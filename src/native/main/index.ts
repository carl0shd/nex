import { app } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow, getMainWindow, setQuitting } from './app-window';
import { registerIPCHandlers } from '@native/ipc/handlers';
import { initAutoUpdater } from './updater';
import { initDatabase, closeDatabase } from '@native/db/database';
import { registerScheme, registerHandler } from '@native/protocol/nex-file';

registerScheme();

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nex.app');
  registerHandler();

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  initDatabase();
  registerIPCHandlers();

  createMainWindow();
  initAutoUpdater();

  app.on('activate', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
    } else {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  setQuitting(true);
});

app.on('will-quit', () => {
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
