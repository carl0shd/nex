import { Plus } from "iconoir-react";

export function AddProjectRow({ onClick }: { onClick?: () => void }) {
  return (
    <div className="ml-[22px] border-l border-line-tree pt-0.5 pl-2">
      <button
        type="button"
        onClick={onClick}
        className="interactive press-wide flex h-[30px] w-full cursor-pointer items-center gap-2 rounded-control bg-hover px-2 text-xs font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] select-none hover:bg-hover-2 hover:text-ink"
      >
        <Plus width={12} height={12} strokeWidth={2.25} />
        Add a project
        <span className="ml-auto text-3xs font-normal text-ink-4">or drop a folder</span>
      </button>
    </div>
  );
}
