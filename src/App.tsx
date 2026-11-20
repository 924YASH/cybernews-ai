import {
  FileSearch,
  FileText,
  Film,
  Globe,
  History,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Radar,
  Settings,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BrandMark } from './components/BrandMark';
import { useReports } from './hooks/useReports';
import { FakeNewsPage } from './pages/FakeNewsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ImageCheckerPage } from './pages/ImageCheckerPage';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { TrustReportPage } from './pages/TrustReportPage';
import { VideoCheckerPage } from './pages/VideoCheckerPage';
import { WebsiteSafetyPage } from './pages/WebsiteSafetyPage';
import { fetchHealthStatus } from './services/api';
import type { AppView, HealthStatus } from './types/analysis';

const NAV_ITEMS: Array<{
  id: Exclude<AppView, 'landing'>;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'news', label: 'Fake News Detector', icon: FileSearch },
  { id: 'image', label: 'Image Checker', icon: ImageIcon },
  { id: 'video', label: 'Deepfake Video Checker', icon: Film },
  { id: 'website', label: 'Website Safety', icon: Globe },
  { id: 'reports', label: 'Trust Reports', icon: FileText },
  { id: 'intelligence', label: 'Threat Intelligence', icon: Radar },
  { id: 'history', label: 'Analysis History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const {
    reports,
    activeReport,
    setActiveReportId,
    addReport,
    deleteReport,
    clearAllReports,
  } = useReports();

  const refreshHealth = useCallback(() => {
    fetchHealthStatus()
      .then((data) => setHealth(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const handleNavigate = (nextView: AppView) => {
    setView(nextView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenReport = (reportId: string) => {
    setActiveReportId(reportId);
    handleNavigate('reports');
  };

  if (view === 'landing') {
    return <LandingPage reports={reports} onNavigate={handleNavigate} />;
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === view);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      {/* Desktop Persistent Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-800/80 bg-[#080D1A] sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => handleNavigate('landing')}
            className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-white whitespace-nowrap cursor-pointer"
          >
            <BrandMark size={24} />
            <span>CYBERNEWS AI</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/70 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'history' && reports.length > 0 && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {reports.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleNavigate('landing')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900/70 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#080D1A] border-r border-slate-800 flex flex-col h-full z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                <BrandMark size={24} />
                <span>CYBERNEWS AI</span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleNavigate('landing')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Workspace Header */}
        <header className="no-print sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline">Workspace</span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-white truncate">
                {currentNav?.label ?? 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {view !== 'news' && (
              <button
                type="button"
                onClick={() => handleNavigate('news')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Verification
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {view === 'overview' && (
            <OverviewPage
              reports={reports}
              onNavigate={handleNavigate}
              onOpenReport={handleOpenReport}
            />
          )}
          {view === 'news' && (
            <FakeNewsPage
              onReportCreated={addReport}
              onOpenFullReport={handleOpenReport}
            />
          )}
          {view === 'image' && (
            <ImageCheckerPage
              onReportCreated={addReport}
              onOpenFullReport={handleOpenReport}
            />
          )}
          {view === 'video' && (
            <VideoCheckerPage
              onReportCreated={addReport}
              onOpenFullReport={handleOpenReport}
            />
          )}
          {view === 'website' && (
            <WebsiteSafetyPage
              onReportCreated={addReport}
              onOpenFullReport={handleOpenReport}
            />
          )}
          {view === 'reports' && (
            <TrustReportPage
              reports={reports}
              activeReport={activeReport}
              onSelectReport={setActiveReportId}
              onNavigate={handleNavigate}
            />
          )}
          {view === 'intelligence' && (
            <ThreatIntelPage
              reports={reports}
              health={health}
              onRefreshHealth={refreshHealth}
              onOpenReport={handleOpenReport}
            />
          )}
          {view === 'history' && (
            <HistoryPage
              reports={reports}
              onOpenReport={handleOpenReport}
              onDeleteReport={deleteReport}
              onClearAll={clearAllReports}
              onNavigate={handleNavigate}
            />
          )}
          {view === 'settings' && (
            <SettingsPage
              health={health}
              reportCount={reports.length}
              onRefreshHealth={refreshHealth}
              onClearAllReports={clearAllReports}
            />
          )}
        </main>
      </div>
    </div>
  );
}
