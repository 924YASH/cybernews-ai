import { Type } from '@google/genai';
import { z } from 'zod';
import { GEMINI_MODEL, getGeminiClient } from './geminiService.ts';
import { reportStore } from './reportStore.ts';
import type { TrustReport } from '../../src/types/analysis.ts';

export const VideoFramesInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  durationSec: z.number().min(0).max(36000),
  fileSizeBytes: z.number().min(1).max(200 * 1024 * 1024),
  frames: z
    .array(
      z.object({
        timestampSec: z.number().min(0),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        base64Data: z.string().min(50).max(3_500_000),
      })
    )
    .min(1, 'At least one representative video frame is required for screening.')
    .max(6, 'At most 6 representative frames can be analyzed per screening.'),
});

const VideoModelOutputSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']),
  classification: z.enum([
    'PRELIMINARY SCREENING: NO OBVIOUS VISUAL ANOMALIES',
    'PRELIMINARY SCREENING: VISUAL IRREGULARITIES OBSERVED',
    'PRELIMINARY SCREENING: INCONCLUSIVE',
    'PRELIMINARY SCREENING: ELEVATED MANIPULATION INDICATORS',
  ]),
  evidenceStrength: z.enum(['moderate', 'limited', 'insufficient']),
  summary: z.string().min(1),
  frameObservations: z.array(
    z.object({
      frameIndex: z.number().int().min(1),
      timestampSec: z.number(),
      observation: z.string(),
      notableSignals: z.array(z.string()),
    })
  ),
  findings: z.array(z.string()).default([]),
  supportingEvidence: z.array(z.string()).default([]),
  contradictoryEvidence: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export async function analyzeVideoFrames(
  input: z.infer<typeof VideoFramesInputSchema>
): Promise<TrustReport> {
  const ai = getGeminiClient();

  const systemInstruction = `You are a digital media analyst performing a PRELIMINARY VISUAL SCREENING on sampled still frames extracted from a video for CyberNews AI.

STRICT HONESTY & TECHNICAL BOUNDARIES:
1. You are ONLY inspecting static sampled frames. You do NOT have audio tracks, temporal motion vectors, or a dedicated forensic deepfake neural detector.
2. NEVER claim to have performed audio-lip synchronization analysis, voice cloning detection, biometric facial reenactment classification, or definitive deepfake proof.
3. Focus strictly on observable visual signals across the provided frames: facial boundary blending, lighting and skin-texture consistency across frames, background warping, reflection consistency, and compression artifacts.
4. Always frame findings as preliminary visual screening observations, not forensic proof.
5. Do not output fake probability percentages.`;

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    {
      text: `Analyze the following ${input.frames.length} sampled keyframes from "${input.fileName}" (duration: ${input.durationSec.toFixed(1)}s).
For each frame, note its index (1..${input.frames.length}), timestamp, objective visual observations, and any notable visual consistency signals or artifacts.`,
    },
  ];

  input.frames.forEach((frame, idx) => {
    parts.push({
      text: `Frame ${idx + 1} at timestamp ${frame.timestampSec.toFixed(2)} seconds:`,
    });
    parts.push({
      inlineData: {
        mimeType: frame.mimeType,
        data: frame.base64Data,
      },
    });
  });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: { parts },
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
              'PRELIMINARY SCREENING: NO OBVIOUS VISUAL ANOMALIES',
              'PRELIMINARY SCREENING: VISUAL IRREGULARITIES OBSERVED',
              'PRELIMINARY SCREENING: INCONCLUSIVE',
              'PRELIMINARY SCREENING: ELEVATED MANIPULATION INDICATORS',
            ],
          },
          evidenceStrength: {
            type: Type.STRING,
            enum: ['moderate', 'limited', 'insufficient'],
          },
          summary: { type: Type.STRING },
          frameObservations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                frameIndex: { type: Type.INTEGER },
                timestampSec: { type: Type.NUMBER },
                observation: { type: Type.STRING },
                notableSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['frameIndex', 'timestampSec', 'observation', 'notableSignals'],
            },
          },
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
          'frameObservations',
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
    throw new Error('Vision screening model returned an empty response.');
  }

  const validated = VideoModelOutputSchema.parse(JSON.parse(rawText));

  const limitations = [
    'This assessment is a Preliminary Visual Screening of sampled keyframes — not a dedicated forensic deepfake classifier.',
    'Audio-lip synchronization, voice synthesis analysis, and frame-level temporal motion forensics were NOT performed because no specialized deepfake model is connected.',
    ...validated.limitations,
  ];

  const report: TrustReport = {
    id: reportStore.generateId('VID'),
    status: 'success',
    createdAt: new Date().toISOString(),
    contentType: 'video',
    submittedLabel: input.fileName,
    submittedContentPreview: `${input.fileName} · ${input.durationSec.toFixed(1)}s · ${input.frames.length} sampled frames`,
    riskLevel: validated.riskLevel,
    classification: validated.classification,
    evidenceStrength: validated.evidenceStrength,
    summary: validated.summary,
    findings: validated.findings,
    supportingEvidence: validated.supportingEvidence,
    contradictoryEvidence: validated.contradictoryEvidence,
    sources: [],
    limitations: Array.from(new Set(limitations)),
    recommendations: validated.recommendations,
    videoDetails: {
      fileName: input.fileName,
      durationSec: input.durationSec,
      framesSampled: input.frames.length,
      screeningMode: 'Preliminary Visual Screening (Sampled Keyframes)',
      frameObservations: validated.frameObservations,
    },
  };

  return reportStore.save(report);
}
