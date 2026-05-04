export interface ChangedFile {
  name: string;
  added: number;
  removed: number;
  status: 'modified' | 'added' | 'deleted';
}

export interface SessionTab {
  name: string;
  dotColor: string;
  active?: boolean;
}

export interface QuickCommand {
  label: string;
}
