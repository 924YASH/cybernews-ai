import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
} from 'lucide-react';
import type { EvidenceStrength, RiskLevel } from '../types/analysis';
import { RESPONSIBLE_AI_DISCLAIMER } from '../utils/pdfExport';

const RISK_META: Record<
  RiskLevel,
  { label: string; textClass: string; barClass: string; borderClass: string; bgClass: string; segments: number }
> = {
  low: {
    label: 'Low Risk',
    textClass: 'text-emerald-400',
    barClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
    segments: 1,
  },
  medium: {
    label: 'Medium Risk',
    textClass: 'text-amber-400',
    barClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
    segments: 2,
  },
  high: {
    label: 'High Risk',
    textClass: 'text-rose-400',
    barClass: 'bg-rose-500',
    borderClass: 'border-rose-500/30',
    bgClass: 'bg-rose-500/10',
    segments: 3,
  },
  unknown: {
    label: 'Unknown',
    textClass: 'text-slate-300',
    barClass: 'bg-slate-400',
    borderClass: 'border-slate-600/50',
    bgClass: 'bg-slate-800/60',
    segments: 0,
  },
};

export function RiskIndicator({
  level,
  compact = false,
}: {
  level: RiskLevel;
  compact?: boolean;
}) {
  const meta = RISK_META[level] ?? RISK_META.unknown;
  const Icon =
    level === 'low'
      ? CheckCircle2
      : level === 'medium'
      ? AlertTriangle
      : level === 'high'
      ? AlertOctagon
      : HelpCircle;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.textClass}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-3.5 py-2 rounded-lg border ${meta.borderClass} ${meta.bgClass}`}>
      <Icon className={`w-4 h-4 shrink-0 ${meta.textClass}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-semibold leading-tight ${meta.textClass}`}>{meta.label}</span>
        <div className="flex items-center gap-1 mt-1.5" aria-hidden="true">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-1 w-6 rounded-xs ${
                step <= meta.segments ? meta.barClass : 'bg-slate-700/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const EVIDENCE_META: Record<EvidenceStrength, { label: string; bars: number; color: string }> = {
  strong: { label: 'Strong Evidence', bars: 4, color: 'bg-cyan-400' },
  moderate: { label: 'Moderate Evidence', bars: 3, color: 'bg-sky-400' },
  limited: { label: 'Limited Evidence', bars: 2, color: 'bg-amber-400' },
  insufficient: { label: 'Insufficient Evidence', bars: 1, color: 'bg-slate-400' },
};

export function EvidenceMeter({ strength }: { strength: EvidenceStrength }) {
  const meta = EVIDENCE_META[strength] ?? EVIDENCE_META.insufficient;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((idx) => (
          <span
            key={idx}
            className={`h-2.5 w-2 rounded-xs ${idx <= meta.bars ? meta.color : 'bg-slate-800'}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{meta.label}</span>
    </div>
  );
}

export function DisclaimerBanner({ className = '' }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-400 leading-relaxed ${className}`}
    >
      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
      <p>{RESPONSIBLE_AI_DISCLAIMER}</p>
    </div>
  );
}
