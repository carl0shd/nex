import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HotkeysProvider } from '@tanstack/react-hotkeys';
import ErrorBoundary from '@/components/layout/error-boundary';
import Titlebar from '@/components/layout/titlebar';
import Sidebar from '@/components/layout/sidebar';
import Home from '@/routes/home';
import DiffView from '@/routes/diff-view';
import Settings from '@/routes/settings';
import OnboardingModal from '@/components/onboarding/onboarding-modal';
import OpenLinkModal from '@/components/modals/open-link-modal';
import SessionHotkeys from '@/components/session/session-hotkeys';
import SessionTerminalHotkeys from '@/components/session/session-terminal-hotkeys';
import { useAppData } from '@/hooks/use-app-data';
import { useSystemTheme } from '@/hooks/use-system-theme';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useSettingsStore } from '@/stores/settings.store';

function App(): React.JSX.Element {
  useAppData();
  useSystemTheme();
  const onboarding = useOnboarding();
  const toggleFull = useSidebarStore((s) => s.toggleFull);
  const theme = useSettingsStore((s) => s.resolvedTheme);

  return (
    <ErrorBoundary>
      <HotkeysProvider defaultOptions={{ hotkey: { preventDefault: true } }}>
        <SessionHotkeys />
        <SessionTerminalHotkeys />
        {/* The router wraps the whole shell so the titlebar can navigate too. */}
        <MemoryRouter>
          <div className="flex h-screen flex-col overflow-hidden bg-bg">
            <Titlebar onToggleSidebar={toggleFull} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/diff/:sessionId" element={<DiffView />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
            {onboarding.show && <OnboardingModal onComplete={onboarding.complete} />}
            <OpenLinkModal />
            <Toaster
              position="bottom-center"
              theme={theme}
              closeButton
              expand
              duration={10000}
              style={{ zIndex: 9999 }}
            />
          </div>
        </MemoryRouter>
      </HotkeysProvider>
    </ErrorBoundary>
  );
}

export default App;
