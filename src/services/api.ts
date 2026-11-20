import type {
  DashboardStatsResponse,
  HealthStatus,
  TrustReport,
} from '../types/analysis';

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const errBody = (await res.json()) as { error?: string };
      throw new Error(errBody.error || `Request failed with status ${res.status}.`);
    }
    throw new Error(`Request failed with status ${res.status}.`);
  }
  return (await res.json()) as T;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  return handleJsonResponse<HealthStatus>(res);
}

export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const res = await fetch('/api/dashboard/stats');
  return handleJsonResponse<DashboardStatsResponse>(res);
}

export async function analyzeNews(payload: {
  headline: string;
  articleText: string;
  claim: string;
  sourceUrl: string;
}): Promise<TrustReport> {
  const res = await fetch('/api/analyze/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<TrustReport>(res);
}

export async function analyzeImage(file: File): Promise<TrustReport> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/analyze/image', {
    method: 'POST',
    body: formData,
  });
  return handleJsonResponse<TrustReport>(res);
}

export async function analyzeVideo(payload: {
  fileName: string;
  durationSec: number;
  fileSizeBytes: number;
  frames: Array<{
    timestampSec: number;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    base64Data: string;
  }>;
}): Promise<TrustReport> {
  const res = await fetch('/api/analyze/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<TrustReport>(res);
}

export async function analyzeWebsite(url: string): Promise<TrustReport> {
  const res = await fetch('/api/analyze/website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return handleJsonResponse<TrustReport>(res);
}

export async function deleteServerReport(id: string): Promise<void> {
  await fetch(`/api/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
