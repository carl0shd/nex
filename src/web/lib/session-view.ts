export interface ChangedFile {
  name: string;
  prevName?: string;
  added: number;
  removed: number;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

export interface SessionTab {
  id: string;
  name: string;
  dotColor: string;
  active?: boolean;
}

export interface QuickCommand {
  label: string;
  command: string;
}
