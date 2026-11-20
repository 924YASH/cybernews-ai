import { Type } from '@google/genai';
import { z } from 'zod';
import { GEMINI_MODEL, getGeminiClient } from './geminiService.ts';
import { reportStore } from './reportStore.ts';
import {
  resolveAndVerifyPublicTarget,
  validateSafePublicUrl,
} from '../utils/ssrfGuard.ts';
import type {
  RedirectHop,
  ThreatFeedCheckResult,
  TrustReport,
  WebsiteInspectionDetails,
} from '../../src/types/analysis.ts';

export const WebsiteInputSchema = z.object({
  url: z.string().trim().min(3, 'Enter a valid website URL.').max(2048),
});

const WebsiteModelOutputSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']),
  classification: z.enum([
    'LOW RISK INDICATORS',
    'CAUTION ADVISED',
    'SUSPICIOUS WEBSITE SIGNALS',
    'HIGH PHISHING OR SAFETY RISK',
    'UNABLE TO FULLY VERIFY',
  ]),
  evidenceStrength: z.enum(['strong', 'moderate', 'limited', 'insufficient']),
  summary: z.string().min(1),
  findings: z.array(z.string()).default([]),
  supportingEvidence: z.array(z.string()).default([]),
  contradictoryEvidence: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

const SUSPICIOUS_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'click', 'gq', 'tk', 'ml', 'cf', 'ga', 'work', 'loan', 'support', 'icu',
]);

const BRAND_KEYWORDS = [
  'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix', 'chase', 'bankofamerica',
  'wellsfargo', 'metamask', 'coinbase', 'binance', 'instagram', 'facebook', 'whatsapp', 'dhl', 'usps',
];

function inspectUrlPatterns(parsed: URL): string[] {
  const warnings: string[] = [];
  const host = parsed.hostname.toLowerCase();
  const full = parsed.href;

  if (parsed.protocol !== 'https:') {
    warnings.push('Connection uses unencrypted HTTP rather than HTTPS.');
  }
  if (parsed.username || parsed.password || full.includes('@')) {
    warnings.push('URL contains embedded credentials or "@" symbol, a common phishing obfuscation pattern.');
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    warnings.push('URL uses a raw IPv4 address instead of a registered domain name.');
  }
  if (host.includes('xn--')) {
    warnings.push('Hostname contains Punycode (IDN) encoding, which can occasionally be used in lookalike domain attacks.');
  }
  const labels = host.split('.');
  if (labels.length >= 4) {
    warnings.push(`Hostname contains ${labels.length - 2} subdomain levels, which can obscure the true registrable domain.`);
  }
  const tld = labels[labels.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    warnings.push(`Uses top-level domain (.${tld}) frequently observed in disposable or phishing campaigns.`);
  }
  if (host.length > 55) {
    warnings.push('Unusually long hostname (>55 characters).');
  }
  const hyphenCount = (host.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    warnings.push(`Hostname contains ${hyphenCount} hyphens, often associated with deceptive lookalike domains.`);
  }

  // Brand impersonation heuristic (e.g., "paypal-verify-login.example.com")
  const registrable = labels.slice(-2).join('.');
  for (const brand of BRAND_KEYWORDS) {
    if (host.includes(brand) && !registrable.startsWith(`${brand}.`)) {
      warnings.push(`Hostname references "${brand}" outside the primary brand domain (${registrable}).`);
      break;
    }
  }

  if (/(login|signin|verify|account|secure|update|wallet|confirm)/i.test(parsed.pathname + parsed.hostname) && parsed.protocol !== 'https:') {
    warnings.push('Sensitive authentication keywords appear on a non-HTTPS URL.');
  }

  return warnings;
}

async function safeInspectRedirectsAndHeaders(initialUrl: URL): Promise<{
  finalUrl: string;
  httpStatus?: number;
  redirectChain: RedirectHop[];
  securityHeaders: WebsiteInspectionDetails['securityHeaders'];
  pageTitle?: string;
  fetchWarning?: string;
}> {
  const MAX_HOPS = 5;
  const TIMEOUT_MS = 6000;
  const MAX_BYTES = 131_072; // 128 KB max read

  let currentUrl = initialUrl;
  const redirectChain: RedirectHop[] = [];
  const securityHeaders = {
    strictTransportSecurity: false,
    contentSecurityPolicy: false,
    xFrameOptions: false,
    xContentTypeOptions: false,
  };

  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const check = await resolveAndVerifyPublicTarget(currentUrl.hostname);
    if (!check.allowed) {
      return {
        finalUrl: currentUrl.href,
        redirectChain,
        securityHeaders,
        fetchWarning: `Redirect inspection halted: ${check.reason}`,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(currentUrl.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CyberNewsAI-SafetyInspector/1.0 (+non-executing)',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        },
      });
      clearTimeout(timer);

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          return {
            finalUrl: currentUrl.href,
            httpStatus: res.status,
            redirectChain,
            securityHeaders,
          };
        }
        let nextUrl: URL;
        try {
          nextUrl = new URL(loc, currentUrl);
        } catch {
          return {
            finalUrl: currentUrl.href,
            httpStatus: res.status,
            redirectChain,
            securityHeaders,
            fetchWarning: 'Site returned a malformed redirect location header.',
          };
        }

        if (nextUrl.protocol !== 'http:' && nextUrl.protocol !== 'https:') {
          return {
            finalUrl: currentUrl.href,
            httpStatus: res.status,
            redirectChain,
            securityHeaders,
            fetchWarning: `Blocked redirect to unsupported protocol (${nextUrl.protocol}).`,
          };
        }

        redirectChain.push({
          from: currentUrl.href,
          to: nextUrl.href,
          statusCode: res.status,
        });

        currentUrl = nextUrl;
        if (hop === MAX_HOPS) {
          return {
            finalUrl: currentUrl.href,
            httpStatus: res.status,
            redirectChain,
            securityHeaders,
            fetchWarning: `Stopped after maximum redirect limit (${MAX_HOPS} hops).`,
          };
        }
        continue;
      }

      securityHeaders.strictTransportSecurity = Boolean(res.headers.get('strict-transport-security'));
      securityHeaders.contentSecurityPolicy = Boolean(res.headers.get('content-security-policy'));
      securityHeaders.xFrameOptions = Boolean(res.headers.get('x-frame-options'));
      securityHeaders.xContentTypeOptions = Boolean(res.headers.get('x-content-type-options'));

      // Read bounded chunk to safely extract <title> only (never executing scripts)
      let pageTitle: string | undefined;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') && res.body) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (total < MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          chunks.push(value);
          total += value.byteLength;
        }
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        const htmlText = Buffer.concat(chunks).toString('utf8');
        const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch?.[1]) {
          pageTitle = titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 140);
        }
      }

      return {
        finalUrl: currentUrl.href,
        httpStatus: res.status,
        redirectChain,
        securityHeaders,
        pageTitle,
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      return {
        finalUrl: currentUrl.href,
        redirectChain,
        securityHeaders,
        fetchWarning: isTimeout
          ? 'Target server timed out within the 6-second safety window.'
          : 'Target server could not be reached over HTTP/HTTPS (host unreachable, TLS error, or connection refused).',
      };
    }
  }

  return { finalUrl: currentUrl.href, redirectChain, securityHeaders };
}

async function checkGoogleSafeBrowsing(targetUrl: string): Promise<ThreatFeedCheckResult> {
  const checkedAt = new Date().toISOString();
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();
  if (!apiKey) {
    return {
      provider: 'Google Safe Browsing',
      status: 'unavailable',
      details: 'External reputation check unavailable (GOOGLE_SAFE_BROWSING_API_KEY is not configured).',
      checkedAt,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          client: { clientId: 'cybernews-ai', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: targetUrl }],
          },
        }),
      }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return {
        provider: 'Google Safe Browsing',
        status: 'unavailable',
        details: `External reputation check unavailable (API returned HTTP ${res.status}).`,
        checkedAt,
      };
    }

    const data = (await res.json()) as { matches?: Array<{ threatType?: string }> };
    if (data.matches && data.matches.length > 0) {
      const types = Array.from(new Set(data.matches.map((m) => m.threatType || 'THREAT')));
      return {
        provider: 'Google Safe Browsing',
        status: 'flagged',
        details: `Flagged for: ${types.join(', ')}.`,
        checkedAt,
      };
    }

    return {
      provider: 'Google Safe Browsing',
      status: 'clean',
      details: 'No active threat matches found in Google Safe Browsing lists.',
      checkedAt,
    };
  } catch {
    return {
      provider: 'Google Safe Browsing',
      status: 'unavailable',
      details: 'External reputation check unavailable (network timeout or upstream error).',
      checkedAt,
    };
  }
}

async function checkUrlhaus(targetUrl: string): Promise<ThreatFeedCheckResult> {
  const checkedAt = new Date().toISOString();
  const authKey = process.env.URLHAUS_AUTH_KEY?.trim();
  if (!authKey) {
    return {
      provider: 'Abuse.ch URLhaus',
      status: 'unavailable',
      details: 'External reputation check unavailable (URLHAUS_AUTH_KEY is not configured).',
      checkedAt,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const body = new URLSearchParams({ url: targetUrl });
    const res = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Auth-Key': authKey,
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        provider: 'Abuse.ch URLhaus',
        status: 'unavailable',
        details: `External reputation check unavailable (URLhaus returned HTTP ${res.status}).`,
        checkedAt,
      };
    }

    const data = (await res.json()) as {
      query_status?: string;
      threat?: string;
      url_status?: string;
    };

    if (data.query_status === 'ok') {
      return {
        provider: 'Abuse.ch URLhaus',
        status: 'flagged',
        details: `Listed in URLhaus database (threat: ${data.threat || 'malware_distribution'}, status: ${data.url_status || 'recorded'}).`,
        checkedAt,
      };
    }

    return {
      provider: 'Abuse.ch URLhaus',
      status: 'clean',
      details: 'URL was not found in the URLhaus malware distribution database.',
      checkedAt,
    };
  } catch {
    return {
      provider: 'Abuse.ch URLhaus',
      status: 'unavailable',
      details: 'External reputation check unavailable (URLhaus lookup failed or timed out).',
      checkedAt,
    };
  }
}

export async function analyzeWebsiteSafety(rawUrl: string): Promise<TrustReport> {
  const validation = await validateSafePublicUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    const err = new Error(validation.reason || 'Invalid or unsafe URL.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  const parsedUrl = validation.url;
  const suspiciousPatterns = inspectUrlPatterns(parsedUrl);

  const [httpInspection, safeBrowsingResult, urlhausResult] = await Promise.all([
    safeInspectRedirectsAndHeaders(parsedUrl),
    checkGoogleSafeBrowsing(parsedUrl.href),
    checkUrlhaus(parsedUrl.href),
  ]);

  let finalParsed = parsedUrl;
  try {
    finalParsed = new URL(httpInspection.finalUrl);
  } catch {
    finalParsed = parsedUrl;
  }

  // Also check suspicious patterns on final destination if redirected to another host
  if (finalParsed.hostname !== parsedUrl.hostname) {
    suspiciousPatterns.push(
      `Redirects across domains from ${parsedUrl.hostname} to ${finalParsed.hostname}.`
    );
    for (const p of inspectUrlPatterns(finalParsed)) {
      if (!suspiciousPatterns.includes(p)) suspiciousPatterns.push(p);
    }
  }

  const threatFeedResults = [safeBrowsingResult, urlhausResult];
  const websiteDetails: WebsiteInspectionDetails = {
    submittedUrl: parsedUrl.href,
    finalUrl: httpInspection.finalUrl,
    hostname: finalParsed.hostname,
    protocol: finalParsed.protocol,
    usesHttps: finalParsed.protocol === 'https:',
    httpStatus: httpInspection.httpStatus,
    redirectChain: httpInspection.redirectChain,
    suspiciousPatterns,
    securityHeaders: httpInspection.securityHeaders,
    threatFeedResults,
    pageTitle: httpInspection.pageTitle,
  };

  const ai = getGeminiClient();

  const inspectionSummary = JSON.stringify(
    {
      ...websiteDetails,
      fetchWarning: httpInspection.fetchWarning ?? null,
    },
    null,
    2
  );

  const systemInstruction = `You are a cybersecurity URL and phishing analyst for CyberNews AI.
Analyze the provided technical inspection data (URL structure, HTTPS status, redirect chain, HTTP security headers, and threat feed lookup results).

STRICT RULES:
1. Base your assessment ONLY on the actual inspection data provided below.
2. NEVER pretend a threat feed returned "clean" if its status is "unavailable". Clearly note when external reputation feeds were unavailable.
3. Missing security headers alone do not prove a site is malicious, though they weaken browser-level protections.
4. Provide practical, concrete precautions for the user (e.g., avoid entering credentials, verify domain spelling, check official bookmarks).
5. Never output fabricated percentage scores.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Evaluate this website safety inspection payload and produce an explainable trust report:\n\n${inspectionSummary}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high', 'unknown'] },
          classification: {
            type: Type.STRING,
            enum: [
              'LOW RISK INDICATORS',
              'CAUTION ADVISED',
              'SUSPICIOUS WEBSITE SIGNALS',
              'HIGH PHISHING OR SAFETY RISK',
              'UNABLE TO FULLY VERIFY',
            ],
          },
          evidenceStrength: {
            type: Type.STRING,
            enum: ['strong', 'moderate', 'limited', 'insufficient'],
          },
          summary: { type: Type.STRING },
          findings: { type: Type.ARRAY, items: { type: Type.STRING } },
          supportingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          contradictoryEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'riskLevel',
          'classification',
          'evidenceStrength',
          'summary',
          'findings',
          'supportingEvidence',
          'contradictoryEvidence',
          'limitations',
          'recommendations',
        ],
      },
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Safety analysis model returned an empty response.');
  }

  const validated = WebsiteModelOutputSchema.parse(JSON.parse(rawText));

  // Enforce high risk if any live threat feed explicitly flagged the URL
  const anyThreatFlagged = threatFeedResults.some((t) => t.status === 'flagged');
  const finalRiskLevel = anyThreatFlagged ? 'high' : validated.riskLevel;

  const limitations = [...validated.limitations];
  if (threatFeedResults.every((t) => t.status === 'unavailable')) {
    limitations.unshift(
      'External reputation checks (Google Safe Browsing and URLhaus) were unavailable because their API keys are not configured. Assessment relies on URL structure, HTTPS, redirects, and header inspection.'
    );
  }
  if (httpInspection.fetchWarning) {
    limitations.unshift(httpInspection.fetchWarning);
  }
  limitations.push(
    'No remote JavaScript was executed during inspection. Dynamic client-side phishing or drive-by payloads may not be observable via static header inspection.'
  );

  const report: TrustReport = {
    id: reportStore.generateId('WEB'),
    status: 'success',
    createdAt: new Date().toISOString(),
    contentType: 'website',
    submittedLabel: parsedUrl.hostname,
    submittedContentPreview: parsedUrl.href,
    riskLevel: finalRiskLevel,
    classification: anyThreatFlagged ? 'HIGH PHISHING OR SAFETY RISK' : validated.classification,
    evidenceStrength: validated.evidenceStrength,
    summary: validated.summary,
    findings: validated.findings,
    supportingEvidence: validated.supportingEvidence,
    contradictoryEvidence: validated.contradictoryEvidence,
    sources: [],
    limitations: Array.from(new Set(limitations)),
    recommendations: validated.recommendations,
    websiteDetails,
  };

  return reportStore.save(report);
}
