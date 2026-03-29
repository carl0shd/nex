export const IPC = {
  APP_GET_INFO: 'app:get-info',
  FULLSCREEN_CHANGE: 'window:fullscreen-change'
} as const;

export type IPCChannel = (typeof IPC)[keyof typeof IPC];
