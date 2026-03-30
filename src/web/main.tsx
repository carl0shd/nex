import './styles/globals.css';
import 'simplebar-react/dist/simplebar.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => scan({ enabled: true }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
