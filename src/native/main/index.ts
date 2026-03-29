import { app, Menu } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow, getMainWindow, setQuitting } from './app-window';
import { buildAppMenu } from './menu';
import { registerIPCHandlers } from '../ipc/handlers';
import { initAutoUpdater } from './updater';

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nex.app');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  Menu.setApplicationMenu(buildAppMenu());
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
