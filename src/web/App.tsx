import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/layout/error-boundary';
import Titlebar from '@/components/layout/titlebar';
import Sidebar from '@/components/layout/sidebar';
import Home from '@/routes/home';
import OnboardingModal from '@/components/onboarding/onboarding-modal';
import { useAppData } from '@/hooks/use-app-data';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSidebarStore } from '@/stores/sidebar.store';

function App(): React.JSX.Element {
  useAppData();
  const onboarding = useOnboarding();
  const toggleFull = useSidebarStore((s) => s.toggleFull);

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <Titlebar onToggleSidebar={toggleFull} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </MemoryRouter>
        </div>
        {onboarding.show && <OnboardingModal onComplete={onboarding.complete} />}
        <Toaster
          position="bottom-center"
          theme="dark"
          closeButton
          expand
          duration={10000}
          style={{ zIndex: 9999 }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
