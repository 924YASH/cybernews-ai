import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  Lock,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DisclaimerBanner, EvidenceMeter, RiskIndicator } from '../components/RiskIndicator';
import { analyzeWebsite } from '../services/api';
import type { TrustReport } from '../types/analysis';

const QUICK_SAMPLES = [
  { label: 'Wikipedia (HTTPS)', url: 'https://www.wikipedia.org' },
  { label: 'Suspicious URL Pattern', url: 'http://paypal-verify-account-login.example.xyz/confirm' },
];

interface WebsiteSafetyPageProps {
  onReportCreated: (report: TrustReport) => void;
  onOpenFullReport: (reportId: string) => void;
}

export function WebsiteSafetyPage({ onReportCreated, onOpenFullReport }: WebsiteSafetyPageProps) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrustReport | null>(null);

  const runCheck = async (target: string) => {
    const trimmed = target.trim();
    if (!trimmed) {
      setError('Enter a website URL to inspect.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const report = await analyzeWebsite(trimmed);
      setResult(report);
      onReportCreated(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Website inspection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runCheck(urlInput);
  };

  const details = result?.websiteDetails;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Website Safety Checker</h1>
        <p className="mt-1 text-sm text-slate-400">
          Inspect HTTPS status, redirect chains, suspicious domain patterns, security headers, and
          configured threat intelligence feeds without executing remote scripts.
        </p>
      </div>

      {/* URL Input Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              aria-label="Website URL"
              className="w-full pl-10 pr-4 py-3 text-sm font-mono text-white bg-[#060913] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inspecting...</span>
              </>
            ) : (
              <>
                <span>Check Website</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">Test examples:</span>
            {QUICK_SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                disabled={loading}
                onClick={() => {
                  setUrlInput(sample.url);
                  void runCheck(sample.url);
                }}
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
          <span className="text-slate-500">
            SSRF-protected: localhost, private IPs, and internal hosts are blocked.
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Loading State */}
      {loading && (
        <div className="p-8 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <h2 className="text-base font-semibold text-white">Inspecting Website Security</h2>
          </div>
          <p className="text-sm text-slate-400">
            Validating DNS against SSRF rules, checking HTTPS &amp; redirect chain, reading security
            headers, and querying configured threat intelligence services...
          </p>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div className="p-10 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Enter a URL to Inspect</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Paste any public HTTP or HTTPS link above to inspect its encryption, redirects, domain
            patterns, security headers, and threat feed status safely from our backend.
          </p>
        </div>
      )}

      {/* Result Dashboard */}
      {!loading && result && details && (
        <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{result.id}</span>
                <span aria-hidden="true">·</span>
                <span>{details.hostname}</span>
                {details.httpStatus && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>HTTP {details.httpStatus}</span>
                  </>
                )}
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">{result.classification}</h2>
              <div className="mt-2">
                <EvidenceMeter strength={result.evidenceStrength} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <RiskIndicator level={result.riskLevel} />
              <button
                type="button"
                onClick={() => onOpenFullReport(result.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Full Trust Report</span>
              </button>
            </div>
          </div>

          {/* Core Signal Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
              <p className="text-xs text-slate-400">HTTPS Encryption</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
                {details.usesHttps ? (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">HTTPS Enabled</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">Unencrypted HTTP</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
              <p className="text-xs text-slate-400">Redirect Hops</p>
              <p className="mt-2 text-sm font-semibold font-mono tabular-nums text-white">
                {details.redirectChain.length}{' '}
                {details.redirectChain.length === 1 ? 'redirect' : 'redirects'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
              <p className="text-xs text-slate-400">Suspicious URL Patterns</p>
              <p
                className={`mt-2 text-sm font-semibold font-mono tabular-nums ${
                  details.suspiciousPatterns.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {details.suspiciousPatterns.length} detected
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Risk Explanation</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Threat Intelligence Reputation Checks */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-2.5">
              External Threat Intelligence Lookups
            </h3>
            <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#060913]">
              {details.threatFeedResults.map((feed) => (
                <div
                  key={feed.provider}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{feed.provider}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{feed.details}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      feed.status === 'clean'
                        ? 'text-emerald-400'
                        : feed.status === 'flagged'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {feed.status === 'clean' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : feed.status === 'flagged' ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {feed.status === 'clean'
                        ? 'No Match'
                        : feed.status === 'flagged'
                        ? 'Threat Flagged'
                        : 'Unavailable'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* URL Patterns & Security Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-300 mb-2.5">
                Suspicious URL Pattern Findings
              </h3>
              {details.suspiciousPatterns.length > 0 ? (
                <ul className="space-y-2 text-xs text-amber-300 leading-relaxed">
                  {details.suspiciousPatterns.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-400">
                  No common phishing or obfuscation patterns detected in the URL string.
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-300 mb-2.5">
                HTTP Security Headers
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  ['Strict-Transport-Security (HSTS)', details.securityHeaders.strictTransportSecurity],
                  ['Content-Security-Policy (CSP)', details.securityHeaders.contentSecurityPolicy],
                  ['X-Frame-Options', details.securityHeaders.xFrameOptions],
                  ['X-Content-Type-Options', details.securityHeaders.xContentTypeOptions],
                ].map(([label, present]) => (
                  <div key={String(label)} className="flex items-center justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className={present ? 'text-emerald-400 font-mono' : 'text-slate-500 font-mono'}>
                      {present ? 'Present' : 'Not Set'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Redirect Chain */}
          {details.redirectChain.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Redirect Chain</h3>
              <div className="p-3.5 rounded-lg bg-[#060913] border border-slate-800/80 space-y-2 font-mono text-xs text-slate-300 overflow-x-auto">
                {details.redirectChain.map((hop, idx) => (
                  <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-cyan-400">[{hop.statusCode}]</span>
                    <span className="truncate max-w-xs">{hop.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate max-w-xs text-white">{hop.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Precautions & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <h3 className="text-xs font-semibold text-slate-300 mb-2">Recommended Precautions</h3>
              <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-400 mb-2">Inspection Limitations</h3>
              <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                {result.limitations.map((lim, i) => (
                  <li key={i}>• {lim}</li>
                ))}
              </ul>
            </div>
          </div>

          <DisclaimerBanner />
        </div>
      )}
    </div>
  );
}
