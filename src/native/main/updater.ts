import { autoUpdater } from 'electron-updater';
import { is } from '@electron-toolkit/utils';

export function initAutoUpdater(): void {
  if (is.dev) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates();
}
