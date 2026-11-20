import { z } from 'zod';
import {
  extractJsonFromText,
  GEMINI_MODEL,
  getGeminiClient,
} from './geminiService.ts';
import { reportStore } from './reportStore.ts';
import type { SourceReference, TrustReport } from '../../src/types/analysis.ts';

export const NewsInputSchema = z
  .object({
    headline: z.string().max(400).optional().default(''),
    articleText: z.string().max(12000).optional().default(''),
    claim: z.string().max(1500).optional().default(''),
    sourceUrl: z.string().max(2048).optional().default(''),
  })
  .refine(
    (d) =>
      d.headline.trim().length > 0 ||
      d.articleText.trim().length > 0 ||
      d.claim.trim().length > 0,
    { message: 'Provide at least a news headline, article text, or factual claim to analyze.' }
  );

const NewsModelOutputSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']),
  classification: z.enum([
    'LIKELY RELIABLE',
    'SUSPICIOUS',
    'UNVERIFIED',
    'INSUFFICIENT EVIDENCE',
  ]),
  evidenceStrength: z.enum(['strong', 'moderate', 'limited', 'insufficient']),
  mainClaim: z.string().min(1),
  summary: z.string().min(1),
  claimBreakdown: z
    .array(
      z.object({
        statement: z.string(),
        type: z.enum(['factual', 'opinion', 'unverified_assertion']),
        assessment: z.string(),
      })
    )
    .default([]),
  findings: z.array(z.string()).default([]),
  supportingEvidence: z.array(z.string()).default([]),
  contradictoryEvidence: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export async function analyzeNewsClaim(
  input: z.infer<typeof NewsInputSchema>
): Promise<TrustReport> {
  const ai = getGeminiClient();

  const submittedParts: string[] = [];
  if (input.headline.trim()) submittedParts.push(`Headline: ${input.headline.trim()}`);
  if (input.claim.trim()) submittedParts.push(`Specific Claim: ${input.claim.trim()}`);
  if (input.articleText.trim()) submittedParts.push(`Article Excerpt:\n${input.articleText.trim()}`);
  if (input.sourceUrl.trim()) submittedParts.push(`Submitted Source URL: ${input.sourceUrl.trim()}`);

  const userContent = submittedParts.join('\n\n');

  const systemInstruction = `You are a senior investigative fact-checker and misinformation analyst for CyberNews AI.
Your responsibility is rigorous, honest, explainable verification.

CRITICAL RULES:
1. Distinguish clearly between verifiable factual statements, opinions, and unsupported assertions.
2. Identify sensationalist or manipulative language, logical fallacies, missing context, or unattributed claims.
3. Use the Google Search tool to check credible independent reporting and fact-checking sources.
4. NEVER invent citations, URLs, quotes, or facts. Only reference information actually retrieved from search results or present in the user's text.
5. If independent corroboration is unavailable or inconclusive, classify as "UNVERIFIED" or "INSUFFICIENT EVIDENCE" and explicitly explain why.
6. NEVER output percentage probabilities or claim absolute proof of truth or falsehood.
7. Return ONLY a valid JSON object matching the exact schema below (no extra prose outside JSON):
{
  "riskLevel": "low" | "medium" | "high" | "unknown",
  "classification": "LIKELY RELIABLE" | "SUSPICIOUS" | "UNVERIFIED" | "INSUFFICIENT EVIDENCE",
  "evidenceStrength": "strong" | "moderate" | "limited" | "insufficient",
  "mainClaim": "Single clear sentence summarizing the central claim being checked",
  "summary": "2-4 sentence plain-language explanation separating observations from conclusions",
  "claimBreakdown": [
    { "statement": "...", "type": "factual" | "opinion" | "unverified_assertion", "assessment": "..." }
  ],
  "findings": ["Key linguistic, contextual, or factual observations"],
  "supportingEvidence": ["Verified facts or credible reporting supporting the claim, or empty array if none"],
  "contradictoryEvidence": ["Credible evidence contradicting or refuting the claim, or empty array if none"],
  "missingInformation": ["Key details, dates, primary sources, or context missing from the submission"],
  "limitations": ["Explicit limitations of this analysis"],
  "recommendations": ["Practical next steps for the reader to independently verify this claim"]
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Investigate and verify the following submission:\n\n${userContent}`,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('AI verification model returned an empty response.');
  }

  const parsedJson = extractJsonFromText(rawText);
  const validated = NewsModelOutputSchema.parse(parsedJson);

  // Extract genuine grounding URLs directly from Gemini Search Grounding metadata (never fabricated)
  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sourceMap = new Map<string, SourceReference>();

  for (const chunk of groundingChunks) {
    const uri = chunk?.web?.uri;
    const title = chunk?.web?.title;
    if (uri && /^https?:\/\//i.test(uri) && !sourceMap.has(uri)) {
      let domain = '';
      try {
        domain = new URL(uri).hostname.replace(/^www\./, '');
      } catch {
        domain = '';
      }
      sourceMap.set(uri, {
        title: title?.trim() || domain || 'Referenced Source',
        url: uri,
        domain,
      });
    }
  }

  const sources = Array.from(sourceMap.values()).slice(0, 8);
  const groundingUsed = sources.length > 0;

  const limitations = [...validated.limitations];
  if (!groundingUsed) {
    limitations.unshift(
      'No external web grounding sources were returned for this query; this claim could not be independently corroborated against live published sources.'
    );
  }
  limitations.push(
    'AI-assisted claim analysis is a preliminary investigative aid and does not constitute definitive proof of authenticity or falsehood.'
  );

  const label =
    input.headline.trim() ||
    input.claim.trim() ||
    input.articleText.trim().slice(0, 80) + (input.articleText.trim().length > 80 ? '…' : '');

  const report: TrustReport = {
    id: reportStore.generateId('NEWS'),
    status: 'success',
    createdAt: new Date().toISOString(),
    contentType: 'news',
    submittedLabel: label,
    submittedContentPreview: userContent.slice(0, 500),
    riskLevel: validated.riskLevel,
    classification: validated.classification,
    evidenceStrength: groundingUsed
      ? validated.evidenceStrength
      : validated.evidenceStrength === 'strong'
      ? 'limited'
      : validated.evidenceStrength,
    mainClaim: validated.mainClaim,
    summary: validated.summary,
    claimBreakdown: validated.claimBreakdown,
    findings: validated.findings,
    supportingEvidence: validated.supportingEvidence,
    contradictoryEvidence: validated.contradictoryEvidence,
    missingInformation: validated.missingInformation,
    sources,
    limitations: Array.from(new Set(limitations)),
    recommendations: validated.recommendations,
    groundingUsed,
  };

  return reportStore.save(report);
}
