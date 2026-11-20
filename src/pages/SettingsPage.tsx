import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lock,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { DisclaimerBanner } from '../components/RiskIndicator';
import type { HealthStatus } from '../types/analysis';

interface SettingsPageProps {
  health: HealthStatus | null;
  reportCount: number;
  onRefreshHealth: () => void;
  onClearAllReports: () => void;
}

export function SettingsPage({
  health,
  reportCount,
  onRefreshHealth,
  onClearAllReports,
}: SettingsPageProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings &amp; Privacy</h1>
        <p className="mt-1 text-sm text-slate-400">
          Inspect server-side integration status, review privacy guarantees, and manage local
          browser history.
        </p>
      </div>

      {/* Backend Service Status */}
      <section className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Server-Side Integrations</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All API credentials are managed strictly via server environment variables — never
              exposed to browser code.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-check</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-[#060913] text-sm">
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Google Gemini API (Server-Side)</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Model: <span className="font-mono text-slate-300">{health?.services.geminiApi.model ?? 'gemini-4-hydrogen'}</span> · Search Grounding enabled
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                health?.services.geminiApi.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {health?.services.geminiApi.configured ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configured</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4" />
                  <span>Not Configured</span>
                </>
              )}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Google Safe Browsing API v4</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Optional server-side URL threat list lookup via <span className="font-mono">GOOGLE_SAFE_BROWSING_API_KEY</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                health?.services.googleSafeBrowsing.configured ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {health?.services.googleSafeBrowsing.configured ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4" />
                  <span>Optional / Unconfigured</span>
                </>
              )}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Abuse.ch URLhaus Threat Feed</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Optional malware URL reputation lookup via <span className="font-mono">URLHAUS_AUTH_KEY</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                health?.services.urlhaus.configured ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {health?.services.urlhaus.configured ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4" />
                  <span>Optional / Unconfigured</span>
                </>
              )}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Firebase Authentication &amp; Firestore</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Using browser-local history mode so all verification tools remain usable without login.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 whitespace-nowrap">
              <Lock className="w-3.5 h-3.5" />
              <span>Local Mode Active</span>
            </span>
          </div>
        </div>
      </section>

      {/* Privacy & Data Handling */}
      <section className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">Privacy &amp; Data Handling</h2>
        </div>

        <ul className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
          <li>
            • <span className="text-white font-medium">Transient Media Processing:</span> Uploaded
            images and extracted video keyframes are analyzed in memory on the server and are never
            written permanently to disk.
          </li>
          <li>
            • <span className="text-white font-medium">Automatic EXIF GPS Redaction:</span> If an
            uploaded image contains GPS coordinates, CyberNews AI flags their presence without
            exposing raw latitude/longitude data in generated reports.
          </li>
          <li>
            • <span className="text-white font-medium">SSRF-Protected URL Inspection:</span> Website
            checks block localhost, private RFC 1918 networks, link-local addresses, and internal
            metadata endpoints, and never execute remote JavaScript.
          </li>
          <li>
            • <span className="text-white font-medium">Local History Control:</span> Saved trust
            reports live only in your current browser&apos;s storage and can be cleared below at any
            time.
          </li>
        </ul>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Local Analysis History</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
              {reportCount} saved {reportCount === 1 ? 'report' : 'reports'} in this browser
            </p>
          </div>
          <button
            type="button"
            disabled={reportCount === 0}
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local History</span>
          </button>
        </div>

        {clearedNotice && (
          <p className="text-xs text-emerald-400">
            Local browser analysis history has been cleared.
          </p>
        )}
      </section>

      <DisclaimerBanner />

      {confirmClear && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#0B1120] border border-slate-700 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Clear Local Analysis History?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              This will permanently remove all {reportCount} trust reports stored in this browser.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllReports();
                  setConfirmClear(false);
                  setClearedNotice(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
