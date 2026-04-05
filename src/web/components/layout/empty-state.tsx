import nexLogo from '@/assets/images/logo-white.svg';
import ShortcutKey from '@/components/ui/shortcut-key';

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg">
      <img src={nexLogo} alt="Nex" className="w-35 pb-10" draggable={false} />

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg font-medium text-text">No active worktrees</h2>
        <p className="text-sm text-text-secondary">Create a new task to start working</p>
      </div>

      <button className="cursor-pointer rounded bg-accent px-6 py-2.5 text-sm font-medium text-text select-none hover:bg-accent-hover">
        &gt; new task
      </button>

      <div className="flex flex-col gap-2">
        <ShortcutKey keys="⌘W" label="new workspace" />
        <ShortcutKey keys="⌘P" label="new project" />
        <ShortcutKey keys="⌘T" label="new task" />
      </div>
    </div>
  );
}

export default EmptyState;
