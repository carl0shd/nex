import { ipcMain } from 'electron';
import { IPC } from './channels';

export function registerIPCHandlers(): void {
  ipcMain.handle(IPC.APP_GET_INFO, () => ({
    platform: process.platform,
    versions: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    }
  }));
}
