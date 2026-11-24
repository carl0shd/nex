import { app, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createMainWindow, getMainWindow, setQuitting } from "./app-window";
import { createApplicationMenu } from "./menu";
import { registerIPCHandlers } from "@native/ipc/handlers";
import { initDatabase, closeDatabase } from "@native/db/database";
import { scanAllTranscripts } from "@native/usage/ingest";
import { registerScheme, registerHandler } from "@native/protocol/nex-file";
import { flushAllBuffers, killAllTerminals, sweepOrphanBuffers } from "@native/pty/manager";
import { getAllIds, resetAllStatus } from "@native/db/repositories/terminal.repo";
import { disposeSpeech, initSpeech } from "@native/speech/manager";
import { isDev } from "@native/paths";
import { agentStates, refreshAgentModels, stopAllAgents } from "@native/agents/agent-runner";
import { readPreferences } from "@native/main/preferences";
import { removeLegacyHooks } from "@native/hooks/cleanup";
import { fixEnv } from "./fix-env";

if (isDev()) {
  app.setName("Nex Dev");
  app.setPath("userData", join(app.getPath("appData"), "Nex Dev"));
} else {
  fixEnv();
}

registerScheme();

const MODELS_REFRESH_DELAY_MS = 3000;

app.whenReady().then(() => {
  electronApp.setAppUserModelId(isDev() ? "com.nex.app.dev" : "com.nex.app");
  registerHandler();

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  initDatabase();
  resetAllStatus();
  sweepOrphanBuffers(new Set(getAllIds()));
  registerIPCHandlers();
  removeLegacyHooks();
  initSpeech();
  createApplicationMenu();

  createMainWindow();

  // Catches up on anything the agents wrote while Nex was closed. Deferred so
  // the first paint is never blocked by a cold full scan.
  setImmediate(() => scanAllTranscripts());
  setTimeout(refreshAgentModels, MODELS_REFRESH_DELAY_MS);

  app.on("activate", () => {
    const win = getMainWindow();
    if (win) {
      win.show();
    } else {
      createMainWindow();
    }
  });
});

let quitConfirmed = false;

app.on("before-quit", (event) => {
  const working = Object.values(agentStates()).filter((state) => state === "running").length;
  if (!quitConfirmed && working > 0 && readPreferences().quitWithAgents !== "quit") {
    event.preventDefault();
    const message =
      working === 1 ? "An agent is still working" : `${working} agents are still working`;
    void dialog
      .showMessageBox({
        type: "warning",
        message,
        detail: "Quitting stops them. Their changes stay in the worktrees.",
        buttons: ["Quit", "Cancel"],
        defaultId: 1,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response !== 0) return;
        quitConfirmed = true;
        app.quit();
      });
    return;
  }
  setQuitting(true);
  flushAllBuffers();
  stopAllAgents();
});

app.on("will-quit", () => {
  killAllTerminals();
  void disposeSpeech();
  closeDatabase();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
