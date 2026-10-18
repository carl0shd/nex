import { useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import type { ChangedFile } from '@/lib/session-view';
import SectionHeader from '@/components/ui/section-header';
import TreeGroupLabel from '@/components/ui/tree-group-label';
import CountBadge from '@/components/sidebar/count-badge';
import DiffFileRow from '@/components/diff/diff-file-row';
import GlideHighlight from '@/components/ui/glide-highlight';
import { useScrollable } from '@/hooks/use-scrollable';
import { cn } from '@/lib/utils';

interface DiffFileTreeProps {
  files: ChangedFile[];
  activeFile: string | null;
  onSelect: (name: string) => void;
  onCopyPath: (file: ChangedFile) => void;
  onOpenInIDE: (file: ChangedFile) => void;
  onDiscard: (file: ChangedFile) => void;
}

interface FileGroup {
  dir: string;
  files: ChangedFile[];
}

function groupByDirectory(files: ChangedFile[]): FileGroup[] {
  const groups = new Map<string, ChangedFile[]>();
  for (const file of files) {
    const slash = file.name.lastIndexOf('/');
    const dir = slash === -1 ? '' : file.name.slice(0, slash);
    const existing = groups.get(dir);
    if (existing) existing.push(file);
    else groups.set(dir, [file]);
  }
  return Array.from(groups, ([dir, groupFiles]) => ({ dir, files: groupFiles }));
}

function DiffFileTree({
  files,
  activeFile,
  onSelect,
  onCopyPath,
  onOpenInIDE,
  onDiscard
}: DiffFileTreeProps): React.JSX.Element {
  const [collapsedDirs, setCollapsedDirs] = useState<string[]>([]);
  const [scrollRef, isScrollable] = useScrollable();

  const groups = useMemo(() => groupByDirectory(files), [files]);

  const toggleDir = (dir: string): void =>
    setCollapsedDirs((current) =>
      current.includes(dir) ? current.filter((d) => d !== dir) : [...current, dir]
    );

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 flex-col gap-0.5 px-2.5 pt-2.5">
        <SectionHeader title="Files" badge={<CountBadge count={files.length} />} />
      </div>

      <div className="min-h-0 flex-1 px-2.5 pt-1">
        <SimpleBar ref={scrollRef} style={{ maxHeight: '100%' }} autoHide={false}>
          <GlideHighlight className={cn('flex flex-col gap-2', isScrollable && 'pr-2.5')}>
            {groups.map((group) => {
              const collapsed = collapsedDirs.includes(group.dir);
              return (
                <div key={group.dir || '.'} className="flex flex-col gap-px">
                  <TreeGroupLabel
                    id={group.dir}
                    name={group.dir || './'}
                    collapsed={collapsed}
                    onToggle={toggleDir}
                  />
                  {!collapsed && (
                    <div className="ml-2.5 flex flex-col gap-px border-l border-line-soft pl-1.5">
                      {group.files.map((file) => (
                        <DiffFileRow
                          key={file.name}
                          file={file}
                          label={file.name.slice(group.dir ? group.dir.length + 1 : 0)}
                          active={file.name === activeFile}
                          onSelect={onSelect}
                          onCopyPath={onCopyPath}
                          onOpenInIDE={onOpenInIDE}
                          onDiscard={onDiscard}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </GlideHighlight>
        </SimpleBar>
      </div>
    </div>
  );
}

export default DiffFileTree;
