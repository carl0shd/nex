import { Plus, LayoutGrid, ChevronDown } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { useScrollable } from '@/hooks/use-scrollable';
import SectionHeader from '@/components/ui/section-header';
import TipBox from '@/components/ui/tip-box';
import ShortcutKey from '@/components/ui/shortcut-key';
import WorkspaceItem from '@/components/sidebar/workspace-item';
import TaskGroupHeader from '@/components/sidebar/task-group-header';
import ProjectLabel from '@/components/sidebar/project-label';
import CountBadge from '@/components/sidebar/count-badge';
import SidebarTask from '@/components/sidebar/sidebar-task';

function Sidebar(): React.JSX.Element {
  const [simpleBarRef, isScrollable] = useScrollable();

  return (
    <div className="flex h-full w-65 shrink-0 flex-col bg-bg">
      <div className="flex shrink-0 flex-col gap-1.5 p-4 pb-0">
        <SectionHeader title="// workspaces" actions={[{ icon: LayoutGrid }, { icon: Plus }]} />

        <WorkspaceItem
          name="trabajo"
          color="#3B82F6"
          count={3}
          projects={[{ name: 'api-gateway' }, { name: 'frontend-app' }, { name: 'auth-service' }]}
        />
        <WorkspaceItem
          name="personal"
          color="#8B5CF6"
          count={2}
          projects={[{ name: 'blog-site' }, { name: 'mobile-app' }]}
        />
        <WorkspaceItem name="acme-corp" color="#F59E0B" count={1} collapsed active={false} />
        <WorkspaceItem name="freelance" color="#636363" count={0} collapsed active={false} />
      </div>

      <div className="mx-4 my-4 h-px shrink-0 bg-border" />

      <div className="flex shrink-0 items-center gap-1 px-5">
        <button className="flex cursor-pointer items-center gap-1 text-text-muted">
          <ChevronDown size={12} />
          <span className="select-none text-[13px] font-medium">{'// active tasks'}</span>
        </button>
        <span className="flex-1" />
        <CountBadge count={10} />
      </div>

      <div className="min-h-0 flex-1 pl-4 pr-4 pt-2">
        <SimpleBar ref={simpleBarRef} style={{ maxHeight: '100%' }} autoHide={false}>
          <div className={`flex flex-col gap-2.5 ${isScrollable ? 'pr-3' : ''}`}>
            <div className="flex flex-col gap-0.5">
              <TaskGroupHeader name="trabajo" color="#3B82F6" />
              <div className="flex flex-col gap-1 pl-4">
                <div className="flex flex-col gap-0.5">
                  <ProjectLabel name="api-gateway" />
                  <SidebarTask name="feat-auth" status="active" active />
                  <SidebarTask name="fix-cors" />
                  <SidebarTask name="refactor-db" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <ProjectLabel name="frontend-app" />
                  <SidebarTask name="fix-nav" status="running" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <TaskGroupHeader name="personal" color="#8B5CF6" />
              <div className="flex flex-col gap-1 pl-4">
                <div className="flex flex-col gap-0.5">
                  <ProjectLabel name="blog-site" />
                  <SidebarTask name="redesign" />
                </div>
              </div>
            </div>
          </div>
        </SimpleBar>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-3">
        <button className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-accent py-2 text-[12px] font-medium text-text select-none hover:bg-accent-hover">
          &gt; new task
        </button>
      </div>

      <div className="shrink-0 p-4 pt-0">
        <TipBox>
          <ShortcutKey keys="⌘W" label="new workspace" />
          <ShortcutKey keys="⌘P" label="new project" />
          <ShortcutKey keys="⌘T" label="new task" />
          <ShortcutKey keys="⌘D" label="view diff" />
        </TipBox>
      </div>
    </div>
  );
}

export default Sidebar;
