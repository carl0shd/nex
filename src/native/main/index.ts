import { app } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow, getMainWindow, setQuitting } from './app-window';
import { createApplicationMenu } from './menu';
import { registerIPCHandlers } from '@native/ipc/handlers';
import { initAutoUpdater } from './updater';
import { initDatabase, closeDatabase } from '@native/db/database';
import { registerScheme, registerHandler } from '@native/protocol/nex-file';
import { killAllTerminals } from '@native/pty/manager';
import { resetAllStatus } from '@native/db/repositories/terminal.repo';

registerScheme();

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nex.app');
  registerHandler();

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  initDatabase();
  resetAllStatus();
  registerIPCHandlers();
  createApplicationMenu();

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
  killAllTerminals();
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
