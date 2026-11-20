import { Type } from '@google/genai';
import exifr from 'exifr';
import { z } from 'zod';
import { GEMINI_MODEL, getGeminiClient } from './geminiService.ts';
import { reportStore } from './reportStore.ts';
import type { ImageMetadataSummary, TrustReport } from '../../src/types/analysis.ts';

const ImageModelOutputSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'unknown']),
  classification: z.enum([
    'NO OBVIOUS MANIPULATION SIGNALS',
    'POTENTIAL SYNTHETIC OR EDITED INDICATORS',
    'INCONCLUSIVE VISUAL SCREENING',
    'ELEVATED MANIPULATION RISK',
  ]),
  evidenceStrength: z.enum(['strong', 'moderate', 'limited', 'insufficient']),
  summary: z.string().min(1),
  findings: z.array(z.string()).default([]),
  supportingEvidence: z.array(z.string()).default([]),
  contradictoryEvidence: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

function safeString(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val.toISOString();
  return undefined;
}

export async function analyzeUploadedImage(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}): Promise<TrustReport> {
  const ai = getGeminiClient();

  // Extract EXIF/metadata safely without exposing private GPS coordinates
  let parsedExif: Record<string, unknown> | null = null;
  try {
    parsedExif = (await exifr.parse(params.buffer, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      iptc: true,
    })) as Record<string, unknown> | null;
  } catch {
    parsedExif = null;
  }

  const gpsDetected = Boolean(
    parsedExif &&
      (parsedExif.latitude !== undefined ||
        parsedExif.longitude !== undefined ||
        parsedExif.GPSLatitude !== undefined)
  );

  const metadataSummary: ImageMetadataSummary = {
    fileName: params.fileName,
    fileSizeBytes: params.fileSizeBytes,
    mimeType: params.mimeType,
    width: typeof parsedExif?.ExifImageWidth === 'number' ? parsedExif.ExifImageWidth : undefined,
    height: typeof parsedExif?.ExifImageHeight === 'number' ? parsedExif.ExifImageHeight : undefined,
    exifPresent: Boolean(parsedExif && Object.keys(parsedExif).length > 0),
    cameraMake: safeString(parsedExif?.Make),
    cameraModel: safeString(parsedExif?.Model),
    software: safeString(parsedExif?.Software) || safeString(parsedExif?.CreatorTool),
    dateTimeOriginal: safeString(parsedExif?.DateTimeOriginal) || safeString(parsedExif?.CreateDate),
    colorSpace: safeString(parsedExif?.ColorSpace),
    gpsDetected,
    privacyNote: gpsDetected
      ? 'GPS location tags were detected in the source file and automatically excluded from this report for privacy.'
      : 'No embedded GPS coordinates were detected in the file metadata.',
  };

  const metadataContext = JSON.stringify(
    {
      fileName: metadataSummary.fileName,
      mimeType: metadataSummary.mimeType,
      fileSizeBytes: metadataSummary.fileSizeBytes,
      exifPresent: metadataSummary.exifPresent,
      cameraMake: metadataSummary.cameraMake ?? 'Not present',
      cameraModel: metadataSummary.cameraModel ?? 'Not present',
      software: metadataSummary.software ?? 'Not present',
      dateTimeOriginal: metadataSummary.dateTimeOriginal ?? 'Not present',
      gpsDetected: metadataSummary.gpsDetected,
    },
    null,
    2
  );

  const systemInstruction = `You are a digital media forensics visual analyst for CyberNews AI.
Inspect the provided image and its extracted file metadata for observable authenticity signals.

STRICT SCIENTIFIC & ETHICAL RULES:
1. Carefully inspect lighting direction, shadow consistency, reflections, texture coherence, edges/blending, text rendering, anatomical/structural geometry, and compression or re-encoding patterns.
2. Separate objective visual observations from interpretive conclusions.
3. NEVER claim that missing EXIF metadata proves an image is fake or AI-generated (social media platforms, screenshots, and web exports routinely strip EXIF metadata).
4. NEVER claim that visual inspection alone proves an image is definitively AI-generated or definitively authentic.
5. NEVER fabricate percentages, forensic ELA heatmaps, or external reverse-image search matches you did not actually perform.
6. Communicate uncertainty honestly.`;

  const base64Data = params.buffer.toString('base64');

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: base64Data,
          },
        },
        {
          text: `Perform a structured authenticity visual screening on this image.

Extracted File Metadata (sanitized):
${metadataContext}

Provide observable visual clues, metadata findings, potential manipulation or AI-generation indicators (if any), risk level, evidence strength, explicit technical limitations, and practical next verification steps.`,
        },
      ],
    },
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
              'NO OBVIOUS MANIPULATION SIGNALS',
              'POTENTIAL SYNTHETIC OR EDITED INDICATORS',
              'INCONCLUSIVE VISUAL SCREENING',
              'ELEVATED MANIPULATION RISK',
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
    throw new Error('Vision model returned an empty response.');
  }

  const validated = ImageModelOutputSchema.parse(JSON.parse(rawText));

  const limitations = [
    ...validated.limitations,
    'Visual inspection alone cannot definitively prove whether an image is AI-generated or camera-captured.',
    'Absence of EXIF metadata is common on web-shared or re-saved images and does not by itself indicate manipulation.',
  ];

  const report: TrustReport = {
    id: reportStore.generateId('IMG'),
    status: 'success',
    createdAt: new Date().toISOString(),
    contentType: 'image',
    submittedLabel: params.fileName,
    submittedContentPreview: `${params.fileName} (${params.mimeType}, ${(
      params.fileSizeBytes / 1024
    ).toFixed(1)} KB)`,
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
    imageMetadata: metadataSummary,
  };

  return reportStore.save(report);
}
