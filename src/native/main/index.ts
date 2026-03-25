import { app, BrowserWindow, Menu } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createMainWindow } from './app-window';
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
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
