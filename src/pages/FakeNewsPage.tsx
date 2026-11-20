import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  FileText,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DisclaimerBanner, EvidenceMeter, RiskIndicator } from '../components/RiskIndicator';
import { analyzeNews } from '../services/api';
import type { TrustReport } from '../types/analysis';

const SAMPLE_CASES = [
  {
    headline: 'Global Banking Consortium Announces Mandatory Cash Ban Starting Next Monday',
    claim: 'All commercial banks worldwide will freeze paper currency withdrawals beginning next Monday under a secret UN directive.',
    articleText:
      'BREAKING SHARE BEFORE DELETED!! Insiders who refuse to be named say every major bank has quietly signed an urgent order banning all cash withdrawals starting Monday at midnight. Mainstream outlets are hiding this from the public. Forward this message to everyone you know immediately and withdraw your savings today!',
    sourceUrl: 'https://unverified-viral-forward.example/cash-ban',
  },
  {
    headline: 'NASA James Webb Space Telescope Detects Carbon Dioxide in Exoplanet Atmosphere',
    claim: 'The James Webb Space Telescope captured the first clear evidence for carbon dioxide in the atmosphere of exoplanet WASP-39 b.',
    articleText:
      'Using its Near-Infrared Spectrograph (NIRSpec), NASA’s James Webb Space Telescope observed transmission spectra of the hot gas giant exoplanet WASP-39 b, revealing a distinct absorption feature consistent with carbon dioxide in its atmosphere.',
    sourceUrl: 'https://www.nasa.gov/universe/exoplanets/',
  },
];

interface FakeNewsPageProps {
  onReportCreated: (report: TrustReport) => void;
  onOpenFullReport: (reportId: string) => void;
}

export function FakeNewsPage({ onReportCreated, onOpenFullReport }: FakeNewsPageProps) {
  const [headline, setHeadline] = useState('');
  const [claim, setClaim] = useState('');
  const [articleText, setArticleText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sampleIndex, setSampleIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [stageText, setStageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrustReport | null>(null);

  const handleLoadSample = () => {
    const sample = SAMPLE_CASES[sampleIndex % SAMPLE_CASES.length];
    setHeadline(sample.headline);
    setClaim(sample.claim);
    setArticleText(sample.articleText);
    setSourceUrl(sample.sourceUrl);
    setSampleIndex((i) => i + 1);
    setError(null);
  };

  const handleClear = () => {
    setHeadline('');
    setClaim('');
    setArticleText('');
    setSourceUrl('');
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!headline.trim() && !claim.trim() && !articleText.trim()) {
      setError('Enter at least a news headline, factual claim, or article excerpt to investigate.');
      return;
    }

    if (sourceUrl.trim()) {
      try {
        const parsed = new URL(
          /^https?:\/\//i.test(sourceUrl.trim()) ? sourceUrl.trim() : `https://${sourceUrl.trim()}`
        );
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError('Optional source URL must use http:// or https://.');
          return;
        }
      } catch {
        setError('Optional source URL appears malformed. Check the address or leave it blank.');
        return;
      }
    }

    setLoading(true);
    setStageText('Extracting primary factual claims and separating opinions...');
    const t1 = setTimeout(
      () => setStageText('Cross-checking claims against grounded web sources...'),
      1600
    );
    const t2 = setTimeout(
      () => setStageText('Compiling explainable risk assessment and citations...'),
      3600
    );

    try {
      const report = await analyzeNews({ headline, claim, articleText, sourceUrl });
      setResult(report);
      onReportCreated(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete news analysis.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      setStageText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fake News Detector</h1>
          <p className="mt-1 text-sm text-slate-400">
            Analyze headlines, viral messages, or articles to separate facts from opinions and
            inspect grounded corroborating or contradictory evidence.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Submission Form */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4"
        >
          <div>
            <label htmlFor="news-headline" className="block text-xs font-medium text-slate-300 mb-1.5">
              News Headline
            </label>
            <input
              id="news-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Central Bank announces overnight policy shift..."
              maxLength={400}
              className="w-full px-3.5 py-2.5 text-sm text-white bg-[#060913] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label htmlFor="news-claim" className="block text-xs font-medium text-slate-300 mb-1.5">
              Specific Factual Claim
            </label>
            <input
              id="news-claim"
              type="text"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Core claim you want verified..."
              maxLength={1500}
              className="w-full px-3.5 py-2.5 text-sm text-white bg-[#060913] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label htmlFor="news-article" className="block text-xs font-medium text-slate-300 mb-1.5">
              Article Text or Forwarded Post
            </label>
            <textarea
              id="news-article"
              rows={6}
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste the full text, social post, or excerpt here..."
              maxLength={12000}
              className="w-full px-3.5 py-2.5 text-sm text-white bg-[#060913] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-y"
            />
          </div>

          <div>
            <label htmlFor="news-source" className="block text-xs font-medium text-slate-300 mb-1.5">
              Optional Source URL
            </label>
            <input
              id="news-source"
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3.5 py-2.5 text-sm font-mono text-white bg-[#060913] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating Claim...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                <span>Analyze News</span>
              </>
            )}
          </button>
        </form>

        {/* Analysis Results Panel */}
        <div className="xl:col-span-7 space-y-5">
          {loading && (
            <div className="p-8 rounded-xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <h2 className="text-base font-semibold text-white">Running News Investigation</h2>
              </div>
              <p className="text-sm text-slate-300">{stageText}</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">
                Checking claim structure, manipulative cues, and grounded web references via
                server-side Gemini pipeline.
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="p-10 rounded-xl bg-[#0B1120] border border-slate-800 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                <FileSearch className="w-6 h-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">Ready to Verify a Claim</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Enter a headline, claim, or article excerpt on the left — or click{' '}
                <span className="text-slate-200 font-medium">Load Sample</span> to test the
                explainable verification workflow immediately.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="p-6 rounded-xl bg-[#0B1120] border border-slate-800 space-y-6">
              {/* Top Verdict Strip */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{result.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(result.createdAt).toLocaleString()}</span>
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

              {/* Main Claim */}
              {result.mainClaim && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Main Claim Identified</h3>
                  <p className="text-sm font-medium text-white bg-[#060913] p-3.5 rounded-lg border border-slate-800/80">
                    {result.mainClaim}
                  </p>
                </div>
              )}

              {/* AI Explanation */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-1.5">AI Explanation</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>

              {/* Factual vs Opinion Breakdown */}
              {result.claimBreakdown && result.claimBreakdown.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 mb-2.5">
                    Statement Breakdown (Facts vs. Opinions)
                  </h3>
                  <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg overflow-hidden bg-[#060913]">
                    {result.claimBreakdown.map((item, idx) => (
                      <div key={idx} className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-100">{item.statement}</p>
                          <span className="text-xs font-mono text-cyan-400 whitespace-nowrap shrink-0">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{item.assessment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting vs Contradictory Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Supporting Evidence</span>
                  </div>
                  {result.supportingEvidence.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                      {result.supportingEvidence.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No independent corroborating evidence identified.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-[#060913] border border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-2.5">
                    <XCircle className="w-4 h-4" />
                    <span>Contradictory Evidence</span>
                  </div>
                  {result.contradictoryEvidence.length > 0 ? (
                    <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                      {result.contradictoryEvidence.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No direct contradictory evidence retrieved.
                    </p>
                  )}
                </div>
              </div>

              {/* Grounded Sources */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2">
                  Referenced Verification Sources
                </h3>
                {result.sources.length > 0 ? (
                  <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#060913]">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-cyan-300 truncate">{src.title}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">{src.domain || src.url}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-[#060913] p-3.5 rounded-lg border border-slate-800/80">
                    No external web sources were returned for independent verification. Treat this
                    claim as uncorroborated until checked against primary news or official records.
                  </p>
                )}
              </div>

              {/* Missing Info & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.missingInformation && result.missingInformation.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Missing Context &amp; Information</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                      {result.missingInformation.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Suggested Next Verification Steps
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <DisclaimerBanner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
