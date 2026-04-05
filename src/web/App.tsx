import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/layout/error-boundary';
import Titlebar from '@/components/layout/titlebar';
import Sidebar from '@/components/layout/sidebar';
import Home from '@/routes/home';
import OnboardingModal from '@/components/onboarding/onboarding-modal';
import { useAppData } from '@/hooks/use-app-data';
import { useOnboarding } from '@/hooks/use-onboarding';

function App(): React.JSX.Element {
  useAppData();
  const onboarding = useOnboarding();

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <Titlebar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </MemoryRouter>
        </div>
        {onboarding.show && <OnboardingModal onComplete={onboarding.complete} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
