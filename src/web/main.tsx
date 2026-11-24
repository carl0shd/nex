import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles/globals.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

if (import.meta.env.DEV) {
  import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

async function start() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("demo")) {
    const { installDemoApi } = await import("./demo/demo-api");
    installDemoApi();
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
