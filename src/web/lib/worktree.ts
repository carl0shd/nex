export interface ChangedFile {
  name: string;
  added: number;
  removed: number;
  status: 'modified' | 'added' | 'deleted';
}

export interface WorktreeTab {
  name: string;
  dotColor: string;
  active?: boolean;
}

export interface QuickCommand {
  label: string;
}

export interface Worktree {
  id: string;
  branch: string;
  workspace: string;
  project: string;
  dotColor: string;
  active: boolean;
  notes: string;
  inputPlaceholder?: string;
  files: ChangedFile[];
  totalFiles: number;
  totalAdded: number;
  totalRemoved: number;
  tabs: WorktreeTab[];
  commands: QuickCommand[];
  commandOverflowCount?: number;
}
