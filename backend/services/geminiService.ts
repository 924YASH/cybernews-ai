import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

let cachedClient: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key !== 'YOUR_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add a valid key in Settings > Secrets (or .env) to run AI analysis.'
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export function extractJsonFromText(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip optional markdown code fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model returned an unparseable response structure.');
  }
}

export function formatGeminiError(error: unknown): { statusCode: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('gemini_api_key is not configured')) {
    return { statusCode: 503, message: raw };
  }
  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      statusCode: 502,
      message:
        'AI analysis could not authenticate with the Gemini API. Please verify your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      statusCode: 429,
      message:
        'AI analysis quota was temporarily exceeded. Please wait a moment and try again.',
    };
  }
  return {
    statusCode: 502,
    message: 'AI analysis service encountered an upstream error. Please retry shortly.',
  };
}
