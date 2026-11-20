import {
  AlertTriangle,
  FileText,
  History,
  Info,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { RiskIndicator } from '../components/RiskIndicator';
import type { AppView, ContentType, RiskLevel, TrustReport } from '../types/analysis';

interface HistoryPageProps {
  reports: TrustReport[];
  onOpenReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (view: AppView) => void;
}

export function HistoryPage({
  reports,
  onOpenReport,
  onDeleteReport,
  onClearAll,
  onNavigate,
}: HistoryPageProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ContentType>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (categoryFilter !== 'all' && r.contentType !== categoryFilter) return false;
      if (riskFilter !== 'all' && r.riskLevel !== riskFilter) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.submittedLabel.toLowerCase().includes(q) ||
        r.classification.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
  }, [reports, query, categoryFilter, riskFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analysis History</h1>
          <p className="mt-1 text-sm text-slate-400">
            Search, inspect, or remove saved explainable trust reports from your workspace.
          </p>
        </div>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Browser-local storage notice (Firebase not configured) */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-white">Local Browser Storage Mode: </span>
          Firebase Authentication and Firestore are not configured in this environment, so your
          application remains usable without login. Analysis history is stored locally in this
          browser only, and raw uploaded images or videos are never permanently saved.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by report ID, headline, domain, or summary..."
            className="w-full pl-10 pr-4 py-2.5 text-sm text-white bg-[#0B1120] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0B1120] border border-slate-800 overflow-x-auto">
          {(['all', 'news', 'image', 'video', 'website'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          aria-label="Filter by risk level"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as 'all' | RiskLevel)}
          className="px-3.5 py-2 text-xs text-slate-200 bg-[#0B1120] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Table / Empty State */}
      {reports.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
          <History className="w-8 h-8 mx-auto text-slate-600" />
          <h2 className="mt-4 text-base font-semibold text-white">No History Saved Yet</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Completed news, image, video, and website verification reports automatically appear
            here for quick recall and PDF export.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('news')}
            className="mt-5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            Start Your First Verification
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
          <p className="text-sm text-slate-300">No reports match your active search or filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategoryFilter('all');
              setRiskFilter('all');
            }}
            className="mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-[#0B1120] border border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-3 px-4 font-medium">Report ID</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Target &amp; Classification</th>
                <th className="py-3 px-4 font-medium">Risk</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filtered.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-cyan-300 whitespace-nowrap">
                    {rep.id}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300 capitalize whitespace-nowrap">
                    {rep.contentType}
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="text-sm font-medium text-white truncate">{rep.submittedLabel}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{rep.classification}</p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskIndicator level={rep.riskLevel} compact />
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenReport(rep.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-md cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rep.id)}
                        aria-label={`Delete report ${rep.id}`}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for Single Delete */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#0B1120] border border-slate-700 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Delete Trust Report?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              This will permanently remove report{' '}
              <span className="font-mono text-cyan-300">{confirmDeleteId}</span> from your browser
              history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReport(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {confirmClearAll && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#0B1120] border border-slate-700 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Clear All Local History?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              All {reports.length} saved trust reports stored in this browser will be permanently
              erased.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClearAll(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
