import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileSearch,
  FileText,
  Film,
  Globe,
  Image as ImageIcon,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { DisclaimerBanner } from '../components/RiskIndicator';
import type { AppView, TrustReport } from '../types/analysis';

const HERO_IMAGE_PATH = '/src/assets/images/hero_cyber_shield_1795069242533.jpg';

interface LandingPageProps {
  reports: TrustReport[];
  onNavigate: (view: AppView) => void;
}

export function LandingPage({ reports, onNavigate }: LandingPageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const hasRealData = reports.length > 0;

  const stats = hasRealData
    ? {
        total: reports.length,
        suspicious: reports.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'medium').length,
        verified: reports.filter((r) => r.contentType === 'news' && r.riskLevel === 'low').length,
        websites: reports.filter((r) => r.contentType === 'website').length,
      }
    : {
        total: 1284,
        suspicious: 312,
        verified: 648,
        websites: 324,
      };

  const features: Array<{
    title: string;
    description: string;
    view: AppView;
    icon: typeof FileSearch;
    span: string;
  }> = [
    {
      title: 'Fake News Detection',
      description:
        'Separates verifiable facts from opinions, flags manipulative phrasing, and cross-checks claims against live search sources without inventing citations.',
      view: 'news',
      icon: FileSearch,
      span: 'lg:col-span-2',
    },
    {
      title: 'Image Authenticity Analysis',
      description:
        'Extracts EXIF metadata while screening shadows, lighting, textures, and structural consistency for possible edits or synthetic cues.',
      view: 'image',
      icon: ImageIcon,
      span: 'lg:col-span-1',
    },
    {
      title: 'Deepfake Video Investigation',
      description:
        'Samples representative keyframes across your video to perform transparent preliminary visual screening for facial and lighting irregularities.',
      view: 'video',
      icon: Film,
      span: 'lg:col-span-1',
    },
    {
      title: 'Website Safety Checker',
      description:
        'SSRF-protected backend inspection of HTTPS transport, redirect chains, security headers, suspicious URL patterns, and threat feeds.',
      view: 'website',
      icon: Globe,
      span: 'lg:col-span-2',
    },
    {
      title: 'Explainable Trust Reports',
      description:
        'Generates auditable reports with unique IDs, evidence strength meters, limitations, and one-click PDF export or print formatting.',
      view: 'reports',
      icon: FileText,
      span: 'lg:col-span-1',
    },
    {
      title: 'Threat Intelligence Dashboard',
      description:
        'Visualizes verification categories, risk distributions, recent activity, and real connection status for external threat feeds.',
      view: 'intelligence',
      icon: Radar,
      span: 'lg:col-span-2',
    },
  ];

  const steps = [
    {
      num: '01.',
      title: 'Upload or enter content',
      desc: 'Paste a news headline, article excerpt, suspicious URL, or upload an image or video clip directly into the verification workspace.',
    },
    {
      num: '02.',
      title: 'AI-assisted investigation',
      desc: 'Our server-side Gemini pipeline analyzes claims, visual consistency, EXIF headers, and URL patterns without exposing credentials.',
    },
    {
      num: '03.',
      title: 'Evidence and source checks',
      desc: 'Claims are checked against grounded web sources and websites undergo SSRF-safe redirect, header, and configured reputation lookups.',
    },
    {
      num: '04.',
      title: 'Understand the risk report',
      desc: 'Review plain-language explanations, supporting and contradictory evidence, explicit limitations, and exportable PDF trust reports.',
    },
  ];

  const reasons = [
    {
      title: 'Easy to use',
      desc: 'Clean workflows for journalists, students, researchers, and everyday readers — no forensic expertise required.',
      icon: Sparkles,
    },
    {
      title: 'Explainable results',
      desc: 'Every risk category is backed by observable findings and structured evidence rather than opaque black-box percentages.',
      icon: Eye,
    },
    {
      title: 'Multiple verification tools',
      desc: 'Investigate text claims, photographs, video keyframes, and suspicious web links from one unified intelligence console.',
      icon: ShieldCheck,
    },
    {
      title: 'Responsible AI',
      desc: 'Strictly separates observations from conclusions and refuses to fabricate citations, URLs, or unverified claims.',
      icon: Scale,
    },
    {
      title: 'Transparent limitations',
      desc: 'Clearly discloses when external reputation APIs are unconfigured or when media screening is preliminary rather than forensic proof.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100">
      {/* Strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BrandMark size={26} />
            <span>CYBERNEWS AI</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
            <a
              href="#features"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#why-cybernews"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Why CyberNews AI
            </a>
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dashboard
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Verification
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-800/70">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.10),transparent_50%)]"
          />

          <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14 lg:pt-24 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-sm font-medium text-cyan-400 tracking-wide mb-4">
                  Verify Before You Trust.
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.08] text-balance">
                  Stop Misinformation Before It Spreads.
                </h1>
                <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  AI-powered intelligence to investigate fake news, deepfakes, manipulated images,
                  and suspicious websites.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('news')}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Start Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-slate-500 hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore Features
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                  <span>News Claim Grounding</span>
                  <span aria-hidden="true">·</span>
                  <span>Image EXIF &amp; Vision Screening</span>
                  <span aria-hidden="true">·</span>
                  <span>SSRF-Safe URL Inspector</span>
                  <span aria-hidden="true">·</span>
                  <span>Exportable PDF Reports</span>
                </div>
              </div>

              <div className="lg:col-span-5 flex">
                <div className="relative w-full min-h-[280px] lg:h-full rounded-xl overflow-hidden border border-slate-800 bg-[#0B1120]">
                  {!heroImgFailed ? (
                    <img
                      src={HERO_IMAGE_PATH}
                      alt="CyberNews AI geometric translucent obsidian shield emblem"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-[#0B1120] to-indigo-950/50">
                      <BrandMark size={72} />
                      <p className="mt-4 text-sm font-medium text-slate-300">
                        Digital Trust Verification Engine
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#060913]/95 via-[#060913]/65 to-transparent">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Multi-modal verification console combining grounded claim inspection, media
                      metadata forensics, and safe URL analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width Live-Style Dashboard Preview Strip */}
            <div className="mt-14 pt-10 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h2 className="text-sm font-semibold text-slate-200">
                  Verification Activity Snapshot
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    {hasRealData
                      ? 'Live Session Metrics'
                      : 'DEMO DATA — Illustrative baseline until your first analysis runs'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('intelligence')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer whitespace-nowrap"
                  >
                    Open Threat Dashboard
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800/90">
                  <p className="text-xs text-slate-400">Total Analyses</p>
                  <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-white">
                    {stats.total.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {hasRealData ? 'Recorded in this browser' : 'Demo sample metric'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800/90">
                  <p className="text-xs text-slate-400">Suspicious Content Detected</p>
                  <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-amber-400">
                    {stats.suspicious.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">Medium &amp; high-risk flags</p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800/90">
                  <p className="text-xs text-slate-400">Likely Reliable Claims</p>
                  <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-emerald-400">
                    {stats.verified.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">Corroborated news checks</p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800/90">
                  <p className="text-xs text-slate-400">Website Risk Checks</p>
                  <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-cyan-400">
                    {stats.websites.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">HTTPS, redirects &amp; patterns</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Asymmetric Bento Grid */}
        <section id="features" className="py-20 border-b border-slate-800/70">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
                Six Integrated Verification Modules
              </h2>
              <p className="mt-3 text-slate-400 leading-relaxed">
                Investigate text, images, video frames, and web domains using structured,
                honest evidence pipelines. Click any capability to launch it directly.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.title}
                    type="button"
                    onClick={() => onNavigate(feat.view)}
                    className={`${feat.span} group text-left p-6 rounded-xl bg-[#0B1120] border border-slate-800/90 hover:border-cyan-500/50 transition-colors cursor-pointer flex flex-col justify-between`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                      <span>Launch tool</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 border-b border-slate-800/70 bg-[#080D1A]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white">How It Works</h2>
              <p className="mt-3 text-slate-400 leading-relaxed">
                A transparent four-stage workflow built to separate observable evidence from
                conclusions.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="pt-6 border-t border-slate-800 flex flex-col"
                >
                  <span className="font-mono text-sm font-semibold text-cyan-400 tabular-nums">
                    {step.num}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why CyberNews AI? */}
        <section id="why-cybernews" className="py-20 border-b border-slate-800/70">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-4">
                <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
                  Why CyberNews AI?
                </h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Misinformation thrives on urgency and false certainty. CyberNews AI is engineered
                  for epistemic honesty — equipping users with clear evidence rather than
                  fabricated truth scores.
                </p>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => onNavigate('overview')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>Open Verification Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {reasons.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="p-5 rounded-xl bg-[#0B1120] border border-slate-800/80"
                    >
                      <Icon className="w-5 h-5 text-indigo-400" />
                      <h3 className="mt-3.5 text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="py-12 bg-[#060913]">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <DisclaimerBanner />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-500">
            <div className="flex items-center gap-2.5 text-slate-300 font-semibold">
              <BrandMark size={20} />
              <span>CYBERNEWS AI</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="font-normal text-slate-400">Verify Before You Trust.</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                News Detector
              </button>
              <button
                type="button"
                onClick={() => onNavigate('image')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Image Checker
              </button>
              <button
                type="button"
                onClick={() => onNavigate('video')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Video Screening
              </button>
              <button
                type="button"
                onClick={() => onNavigate('website')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Website Safety
              </button>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Privacy &amp; Settings
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
