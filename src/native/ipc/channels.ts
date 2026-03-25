export const IPC = {
  APP_GET_INFO: 'app:get-info'
} as const;

export type IPCChannel = (typeof IPC)[keyof typeof IPC];
