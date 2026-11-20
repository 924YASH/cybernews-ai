import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  Printer,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { DisclaimerBanner, EvidenceMeter, RiskIndicator } from '../components/RiskIndicator';
import type { AppView, TrustReport } from '../types/analysis';
import { downloadReportAsPdf, formatReportSummaryText } from '../utils/pdfExport';

interface TrustReportPageProps {
  reports: TrustReport[];
  activeReport: TrustReport | null;
  onSelectReport: (id: string) => void;
  onNavigate: (view: AppView) => void;
}

export function TrustReportPage({
  reports,
  activeReport,
  onSelectReport,
  onNavigate,
}: TrustReportPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    if (!activeReport) return;
    try {
      await navigator.clipboard.writeText(formatReportSummaryText(activeReport));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy if clipboard API blocked
      const ta = document.createElement('textarea');
      ta.value = formatReportSummaryText(activeReport);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (!activeReport) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Explainable Trust Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Auditable, printable, and downloadable verification reports generated from your analyses.
          </p>
        </div>

        <div className="p-12 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">No Trust Reports Yet</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Run a Fake News, Image Authenticity, Deepfake Video, or Website Safety analysis to
            generate an explainable trust report you can export as PDF or print.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('news')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
            >
              <FileSearch className="w-4 h-4" />
              <span>Analyze News Claim</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('website')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
            >
              <span>Check Website Safety</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Explainable Trust Report</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review full findings, evidence strength, sources, and technical limitations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {reports.length > 1 && (
            <select
              aria-label="Select saved report"
              value={activeReport.id}
              onChange={(e) => onSelectReport(e.target.value)}
              className="px-3 py-2 text-xs font-mono text-slate-200 bg-[#0B1120] border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 max-w-[230px]"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.submittedLabel.slice(0, 26)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0B1120] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Summary Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0B1120] border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => downloadReportAsPdf(activeReport)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <article className="print-report p-6 sm:p-8 rounded-xl bg-[#0B1120] border border-slate-800 space-y-7">
        {/* Top Metadata Grid */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold">{activeReport.id}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{activeReport.contentType} Analysis</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(activeReport.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{activeReport.classification}</h2>
            <p className="text-sm text-slate-300 break-words">
              <span className="text-slate-500">Submitted target: </span>
              {activeReport.submittedLabel}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-3 shrink-0">
            <RiskIndicator level={activeReport.riskLevel} />
            <EvidenceMeter strength={activeReport.evidenceStrength} />
          </div>
        </div>

        {/* Main Claim if News */}
        {activeReport.mainClaim && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-2">Primary Claim Evaluated</h3>
            <p className="p-4 rounded-lg bg-[#060913] border border-slate-800 text-sm font-medium text-white">
              {activeReport.mainClaim}
            </p>
          </div>
        )}

        {/* Executive Summary */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-2">Executive Explanation</h3>
          <p className="text-sm text-slate-200 leading-relaxed">{activeReport.summary}</p>
        </div>

        {/* Key Findings */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-2.5">Key Findings</h3>
          {activeReport.findings.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
              {activeReport.findings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No distinct technical anomalies recorded.</p>
          )}
        </div>

        {/* Evidence Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-lg bg-[#060913] border border-slate-800/90">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Supporting Evidence</span>
            </div>
            {activeReport.supportingEvidence.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {activeReport.supportingEvidence.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">None recorded for this investigation.</p>
            )}
          </div>

          <div className="p-5 rounded-lg bg-[#060913] border border-slate-800/90">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-3">
              <XCircle className="w-4 h-4" />
              <span>Contradictory Evidence</span>
            </div>
            {activeReport.contradictoryEvidence.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {activeReport.contradictoryEvidence.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">None recorded for this investigation.</p>
            )}
          </div>
        </div>

        {/* Sources */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-2.5">Sources &amp; References</h3>
          {activeReport.sources.length > 0 ? (
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-[#060913]">
              {activeReport.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cyan-300 truncate">{src.title}</p>
                    <p className="text-xs font-mono text-slate-500 truncate">{src.url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-[#060913] p-4 rounded-lg border border-slate-800">
              No external web sources were linked to this report.
            </p>
          )}
        </div>

        {/* Limitations & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-amber-400 mb-2.5">Analysis Limitations</h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              {activeReport.limitations.map((lim, i) => (
                <li key={i}>• {lim}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200 mb-2.5">Recommended Actions</h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              {activeReport.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <DisclaimerBanner />
      </article>
    </div>
  );
}
