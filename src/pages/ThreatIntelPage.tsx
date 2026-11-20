import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DisclaimerBanner, RiskIndicator } from '../components/RiskIndicator';
import type { HealthStatus, TrustReport } from '../types/analysis';

interface ThreatIntelPageProps {
  reports: TrustReport[];
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  onOpenReport: (id: string) => void;
}

const DEMO_CATEGORIES = [
  { name: 'News', count: 540 },
  { name: 'Image', count: 290 },
  { name: 'Video', count: 130 },
  { name: 'Website', count: 324 },
];

const DEMO_RISK = [
  { name: 'Low Risk', value: 648, color: '#10b981' },
  { name: 'Medium Risk', value: 364, color: '#f59e0b' },
  { name: 'High Risk', value: 146, color: '#f43f5e' },
  { name: 'Unknown', value: 126, color: '#64748b' },
];

const DEMO_TIMELINE = [
  { day: 'Day 1', checks: 145, flagged: 32 },
  { day: 'Day 2', checks: 178, flagged: 41 },
  { day: 'Day 3', checks: 162, flagged: 29 },
  { day: 'Day 4', checks: 214, flagged: 53 },
  { day: 'Day 5', checks: 196, flagged: 44 },
  { day: 'Day 6', checks: 228, flagged: 61 },
  { day: 'Day 7', checks: 161, flagged: 38 },
];

export function ThreatIntelPage({
  reports,
  health,
  onRefreshHealth,
  onOpenReport,
}: ThreatIntelPageProps) {
  const hasReal = reports.length > 0;

  const categoryData = hasReal
    ? [
        { name: 'News', count: reports.filter((r) => r.contentType === 'news').length },
        { name: 'Image', count: reports.filter((r) => r.contentType === 'image').length },
        { name: 'Video', count: reports.filter((r) => r.contentType === 'video').length },
        { name: 'Website', count: reports.filter((r) => r.contentType === 'website').length },
      ]
    : DEMO_CATEGORIES;

  const riskData = hasReal
    ? [
        {
          name: 'Low Risk',
          value: reports.filter((r) => r.riskLevel === 'low').length,
          color: '#10b981',
        },
        {
          name: 'Medium Risk',
          value: reports.filter((r) => r.riskLevel === 'medium').length,
          color: '#f59e0b',
        },
        {
          name: 'High Risk',
          value: reports.filter((r) => r.riskLevel === 'high').length,
          color: '#f43f5e',
        },
        {
          name: 'Unknown',
          value: reports.filter((r) => r.riskLevel === 'unknown').length,
          color: '#64748b',
        },
      ].filter((d) => d.value > 0)
    : DEMO_RISK;

  // Build real timeline grouped by date when user has real reports
  const timelineData = (() => {
    if (!hasReal) return DEMO_TIMELINE;
    const byDate = new Map<string, { day: string; checks: number; flagged: number }>();
    for (const r of [...reports].reverse()) {
      const label = new Date(r.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      const existing = byDate.get(label) ?? { day: label, checks: 0, flagged: 0 };
      existing.checks += 1;
      if (r.riskLevel === 'high' || r.riskLevel === 'medium') existing.flagged += 1;
      byDate.set(label, existing);
    }
    return Array.from(byDate.values());
  })();

  const totalCount = hasReal ? reports.length : 1284;
  const newsCount = categoryData[0].count;
  const imageCount = categoryData[1].count;
  const videoCount = categoryData[2].count;
  const websiteCount = categoryData[3].count;
  const highRiskCount = hasReal
    ? reports.filter((r) => r.riskLevel === 'high').length
    : 146;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Threat Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Distribution of verified categories, risk levels, activity trends, and live threat feed
            connectivity.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {hasReal ? (
            <span className="text-cyan-400">LIVE APPLICATION DATA ({reports.length} reports)</span>
          ) : (
            <span className="text-amber-400">DEMO DATA (Run an analysis to switch to live data)</span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Analyses', value: totalCount, color: 'text-white' },
          { label: 'News Checks', value: newsCount, color: 'text-cyan-400' },
          { label: 'Image Checks', value: imageCount, color: 'text-indigo-400' },
          { label: 'Video Checks', value: videoCount, color: 'text-violet-400' },
          { label: 'Website Checks', value: websiteCount, color: 'text-sky-400' },
          { label: 'High-Risk Flags', value: highRiskCount, color: 'text-rose-400' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 rounded-xl bg-[#0B1120] border border-slate-800"
          >
            <p className="text-xs text-slate-400 truncate">{kpi.label}</p>
            <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${kpi.color}`}>
              {kpi.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Category Bar Chart + Risk Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 p-5 rounded-xl bg-[#0B1120] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Analyses by Category</h2>
            {!hasReal && <span className="text-[11px] font-mono text-amber-400">DEMO DATA</span>}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={54} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 p-5 rounded-xl bg-[#0B1120] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Risk Distribution</h2>
            {!hasReal && <span className="text-[11px] font-mono text-amber-400">DEMO DATA</span>}
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
            {riskData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 font-mono tabular-nums">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}:</span>
                <span className="text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Over Time Area Chart */}
      <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Verification Activity Over Time</h2>
          {!hasReal && <span className="text-[11px] font-mono text-amber-400">DEMO DATA</span>}
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="checksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flaggedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Area
                type="monotone"
                dataKey="checks"
                name="Total Checks"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#checksFill)"
              />
              <Area
                type="monotone"
                dataKey="flagged"
                name="Medium/High Risk"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#flaggedFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connected Threat Intelligence Feeds */}
      <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Threat Intelligence Feeds</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real server-side connection status for external intelligence providers. Unconfigured
              feeds never return fabricated threat matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-[#060913]">
          {(health?.threatFeeds ?? []).map((feed) => (
            <div
              key={feed.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{feed.name}</span>
                  <span className="text-xs text-slate-500" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-400">{feed.category}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {feed.description}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Last checked: {new Date(feed.lastChecked).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                    feed.connected ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {feed.connected ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <HelpCircle className="w-4 h-4" />
                  )}
                  <span>{feed.statusLabel}</span>
                </span>
                <a
                  href={feed.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Log when real reports exist */}
      {hasReal && (
        <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white">Recent Analysis Activity</h2>
          <div className="divide-y divide-slate-800/70">
            {reports.slice(0, 5).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onOpenReport(r.id)}
                className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-900/50 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.submittedLabel}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {r.id} · {r.contentType} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <RiskIndicator level={r.riskLevel} compact />
              </button>
            ))}
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
