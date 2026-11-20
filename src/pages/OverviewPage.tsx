import {
  ArrowRight,
  FileSearch,
  FileText,
  Film,
  Globe,
  Image as ImageIcon,
  Radar,
} from 'lucide-react';
import { DisclaimerBanner, RiskIndicator } from '../components/RiskIndicator';
import type { AppView, TrustReport } from '../types/analysis';

interface OverviewPageProps {
  reports: TrustReport[];
  onNavigate: (view: AppView) => void;
  onOpenReport: (id: string) => void;
}

export function OverviewPage({ reports, onNavigate, onOpenReport }: OverviewPageProps) {
  const hasReal = reports.length > 0;

  const metrics = hasReal
    ? {
        total: reports.length,
        news: reports.filter((r) => r.contentType === 'news').length,
        media: reports.filter((r) => r.contentType === 'image' || r.contentType === 'video').length,
        website: reports.filter((r) => r.contentType === 'website').length,
        highRisk: reports.filter((r) => r.riskLevel === 'high').length,
      }
    : {
        total: 1284,
        news: 540,
        media: 420,
        website: 324,
        highRisk: 146,
      };

  const quickTools: Array<{
    title: string;
    subtitle: string;
    view: AppView;
    icon: typeof FileSearch;
  }> = [
    {
      title: 'Fake News Detector',
      subtitle: 'Verify headlines, claims, and excerpts with grounded web citations.',
      view: 'news',
      icon: FileSearch,
    },
    {
      title: 'Image Authenticity Checker',
      subtitle: 'Inspect EXIF headers, lighting, shadows, and structural anomalies.',
      view: 'image',
      icon: ImageIcon,
    },
    {
      title: 'Deepfake Video Screening',
      subtitle: 'Sample representative keyframes for preliminary visual consistency checks.',
      view: 'video',
      icon: Film,
    },
    {
      title: 'Website Safety Checker',
      subtitle: 'Inspect HTTPS, redirects, security headers, and threat feeds safely.',
      view: 'website',
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Verification Overview</h1>
          <p className="mt-1 text-sm text-slate-400">
            Select an investigation tool below or inspect recent explainable trust reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('intelligence')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Radar className="w-4 h-4" />
          <span>Threat Intelligence</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Activity Summary</span>
          <span>
            {hasReal
              ? 'Live browser session data'
              : 'DEMO DATA — Illustrative baseline until you run an analysis'}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800">
            <p className="text-xs text-slate-400">Total Analyses</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
              {metrics.total.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800">
            <p className="text-xs text-slate-400">News Checks</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-cyan-400">
              {metrics.news.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800">
            <p className="text-xs text-slate-400">Image &amp; Video</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-indigo-400">
              {metrics.media.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800">
            <p className="text-xs text-slate-400">Website Checks</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-sky-400">
              {metrics.website.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-400">High-Risk Findings</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-400">
              {metrics.highRisk.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Verification Launchers */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Start an Investigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.title}
                type="button"
                onClick={() => onNavigate(tool.view)}
                className="group text-left p-5 rounded-xl bg-[#0B1120] border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{tool.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">Recent Trust Reports</h2>
          {reports.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              View all history
            </button>
          )}
        </div>

        {reports.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
            <FileText className="w-7 h-7 mx-auto text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-200">No analyses recorded yet</p>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Run your first news, image, video, or website check to generate an explainable trust
              report stored locally in this browser.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('news')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>Run First News Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-[#0B1120] border border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-3 px-4 font-medium">Report ID</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Submitted Content</th>
                  <th className="py-3 px-4 font-medium">Risk Level</th>
                  <th className="py-3 px-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {reports.slice(0, 6).map((rep) => (
                  <tr
                    key={rep.id}
                    onClick={() => onOpenReport(rep.id)}
                    className="hover:bg-slate-900/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-cyan-300 whitespace-nowrap">
                      {rep.id}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 capitalize whitespace-nowrap">
                      {rep.contentType}
                    </td>
                    <td className="py-3 px-4 text-xs text-white max-w-xs truncate">
                      {rep.submittedLabel}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskIndicator level={rep.riskLevel} compact />
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400 tabular-nums text-right whitespace-nowrap">
                      {new Date(rep.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
