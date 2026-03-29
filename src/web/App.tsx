import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/error-boundary';
import Titlebar from '@/components/titlebar';
import Home from '@/routes/home';

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <Titlebar />
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </div>
    </ErrorBoundary>
  );
}

export default App;
