import { useCallback, useEffect, useState } from 'react';
import { deleteServerReport } from '../services/api';
import type { TrustReport } from '../types/analysis';

const STORAGE_KEY = 'cybernews_ai_local_reports_v1';
const MAX_LOCAL_REPORTS = 50;

function loadStoredReports(): TrustReport[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TrustReport[];
  } catch {
    return [];
  }
}

export function useReports() {
  const [reports, setReports] = useState<TrustReport[]>(() => loadStoredReports());
  const [activeReportId, setActiveReportId] = useState<string | null>(() => {
    const initial = loadStoredReports();
    return initial[0]?.id ?? null;
  });

  useEffect(() => {
    try {
      // Never persist large raw base64 media payloads permanently to localStorage
      const safeToPersist = reports.slice(0, MAX_LOCAL_REPORTS).map((r) => ({
        ...r,
        imagePreviewDataUrl: undefined,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeToPersist));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [reports]);

  const addReport = useCallback((report: TrustReport) => {
    setReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)].slice(0, MAX_LOCAL_REPORTS));
    setActiveReportId(report.id);
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      setActiveReportId((curr) => (curr === id ? next[0]?.id ?? null : curr));
      return next;
    });
    void deleteServerReport(id).catch(() => {});
  }, []);

  const clearAllReports = useCallback(() => {
    setReports([]);
    setActiveReportId(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const activeReport = reports.find((r) => r.id === activeReportId) ?? reports[0] ?? null;

  return {
    reports,
    activeReport,
    activeReportId,
    setActiveReportId,
    addReport,
    deleteReport,
    clearAllReports,
  };
}
