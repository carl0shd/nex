import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
// SimpleBar first: its thumb rules match ours selector-for-selector, so whichever
// sheet loads last wins the tie — and the app's has to.
import 'simplebar-react/dist/simplebar.min.css';
import './styles/globals.css';

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
