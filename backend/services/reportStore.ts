import crypto from 'node:crypto';
import type { DashboardStatsResponse, TrustReport } from '../../src/types/analysis.ts';

const MAX_STORED_REPORTS = 100;

class ReportStore {
  private reports: TrustReport[] = [];

  generateId(prefix: string): string {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CN-${prefix.toUpperCase()}-${dateStamp}-${rand}`;
  }

  save(report: TrustReport): TrustReport {
    // Strip heavy base64 preview images from server memory store to protect privacy and RAM
    const sanitized: TrustReport = {
      ...report,
      imagePreviewDataUrl: undefined,
    };
    this.reports.unshift(sanitized);
    if (this.reports.length > MAX_STORED_REPORTS) {
      this.reports = this.reports.slice(0, MAX_STORED_REPORTS);
    }
    return report;
  }

  list(): TrustReport[] {
    return [...this.reports];
  }

  getById(id: string): TrustReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  deleteById(id: string): boolean {
    const initialLen = this.reports.length;
    this.reports = this.reports.filter((r) => r.id !== id);
    return this.reports.length < initialLen;
  }

  clearAll(): void {
    this.reports = [];
  }

  getStats(): DashboardStatsResponse {
    const byCategory = { news: 0, image: 0, video: 0, website: 0 };
    const byRisk = { low: 0, medium: 0, high: 0, unknown: 0 };

    for (const r of this.reports) {
      byCategory[r.contentType] = (byCategory[r.contentType] || 0) + 1;
      byRisk[r.riskLevel] = (byRisk[r.riskLevel] || 0) + 1;
    }

    return {
      hasRealData: this.reports.length > 0,
      totalAnalyses: this.reports.length,
      byCategory,
      byRisk,
      recentReports: this.reports.slice(0, 12),
    };
  }
}

export const reportStore = new ReportStore();
