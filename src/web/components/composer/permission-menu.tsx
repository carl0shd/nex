import type { ComponentType } from "react";
import {
  Check,
  EditPencil,
  Map as MapIcon,
  Minus,
  NavArrowDown,
  OpenSelectHandGesture,
  Prohibition,
  ShieldCheck,
  WarningTriangle,
} from "iconoir-react";
import { Kbd } from "@/components/atoms/kbd";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { ComposerPill } from "@/components/composer/composer-pill";
import { Menu, MenuLabel } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;

export type PermissionMode = "plan" | "manual" | "dontask" | "edits" | "auto" | "bypass";

const PERMISSION_MODES: readonly PermissionMode[] = [
  "plan",
  "manual",
  "dontask",
  "edits",
  "auto",
  "bypass",
];

type Capability = { label: string; access: "allowed" | "asks" | "never" };

const MODE: Record<
  PermissionMode,
  { icon: Icon; name: string; chip: string; summary: string; tone: string; can: Capability[] }
> = {
  plan: {
    icon: MapIcon,
    name: "Plan mode",
    chip: "Plan",
    summary: "Claude reads and plans, nothing changes",
    tone: "text-blue",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Edit files", access: "never" },
      { label: "Run commands", access: "never" },
      { label: "Touch files outside the worktree", access: "never" },
    ],
  },
  manual: {
    icon: OpenSelectHandGesture,
    name: "Ask first",
    chip: "Ask first",
    summary: "Claude checks with you before every change",
    tone: "text-ink-4 hover:text-ink-2",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Edit files in this worktree", access: "asks" },
      { label: "Run commands", access: "asks" },
      { label: "Touch files outside the worktree", access: "asks" },
    ],
  },
  dontask: {
    icon: Prohibition,
    name: "Don't ask",
    chip: "Don't ask",
    summary: "Only what you already allowed, the rest is denied",
    tone: "text-ink-4 hover:text-ink-2",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Commands you allowed", access: "allowed" },
      { label: "Anything new", access: "never" },
      { label: "Touch files outside the worktree", access: "never" },
    ],
  },
  edits: {
    icon: EditPencil,
    name: "Accept edits",
    chip: "Accept edits",
    summary: "Edits go through, commands still ask",
    tone: "text-ink-4 hover:text-ink-2",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Edit files in this worktree", access: "allowed" },
      { label: "Run commands", access: "asks" },
      { label: "Touch files outside the worktree", access: "asks" },
    ],
  },
  auto: {
    icon: ShieldCheck,
    name: "Auto",
    chip: "Auto",
    summary: "Claude decides what needs your OK",
    tone: "text-ink-4 hover:text-ink-2",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Edit files in this worktree", access: "allowed" },
      { label: "Run risky commands", access: "asks" },
      { label: "Touch files outside the worktree", access: "asks" },
    ],
  },
  bypass: {
    icon: WarningTriangle,
    name: "Bypass permissions",
    chip: "Bypass",
    summary: "Everything runs without asking",
    tone: "text-red",
    can: [
      { label: "Read files", access: "allowed" },
      { label: "Edit files anywhere", access: "allowed" },
      { label: "Run any command", access: "allowed" },
      { label: "Touch files outside the worktree", access: "allowed" },
    ],
  },
};

const ACCESS = {
  allowed: { mark: "bg-green-tint text-accent-ink", note: "without asking" },
  asks: { mark: "bg-orange-tint text-orange", note: "asks first" },
  never: { mark: "bg-hover-2 text-ink-4", note: "never" },
} as const;

const ICONS = Object.fromEntries(PERMISSION_MODES.map((mode) => [mode, MODE[mode].icon]));
const LABELS = Object.fromEntries(PERMISSION_MODES.map((mode) => [mode, MODE[mode].name]));
const TONES = Object.fromEntries(PERMISSION_MODES.map((mode) => [mode, MODE[mode].tone]));

function AccessMark({ access }: { access: Capability["access"] }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full",
        ACCESS[access].mark,
      )}
    >
      {access === "allowed" && <Check width={9} height={9} strokeWidth={3.25} />}
      {access === "asks" && <span className="text-3xs leading-none font-bold">?</span>}
      {access === "never" && <Minus width={9} height={9} strokeWidth={3.25} />}
    </span>
  );
}

export function PermissionChip({
  mode,
  open = false,
  onClick,
}: {
  mode: PermissionMode;
  open?: boolean;
  onClick?: () => void;
}) {
  const ModeIcon = MODE[mode].icon;
  return (
    <ComposerPill active={open} onClick={onClick}>
      <span className={cn("flex", mode === "bypass" && "text-red")}>
        <ModeIcon width={11} height={11} strokeWidth={2.25} />
      </span>
      {MODE[mode].chip}
      <NavArrowDown width={10} height={10} strokeWidth={2.25} className="opacity-70" />
    </ComposerPill>
  );
}

export function PermissionMenu({
  mode,
  onChange,
  defaultMode = "auto",
}: {
  mode: PermissionMode;
  onChange: (mode: PermissionMode) => void;
  defaultMode?: PermissionMode;
}) {
  const current = MODE[mode];
  return (
    <Menu width={320} origin="bottom left" className="rounded-panel bg-surface-raised">
      <MenuLabel className="h-7" trailing={<span className="text-ink">{current.chip}</span>}>
        Permissions
      </MenuLabel>
      <div className="px-1 pt-0.5">
        <SegmentedControl
          variant="bar"
          options={PERMISSION_MODES}
          value={mode}
          onChange={onChange}
          icons={ICONS}
          labels={LABELS}
          tones={TONES}
        />
      </div>
      <div className="flex flex-col gap-0.5 px-2.5 pt-3 pb-1.5">
        <span className="text-sm font-medium text-ink">{current.name}</span>
        <span className="mb-2 text-2xs text-ink-4">{current.summary}</span>
        {current.can.map((capability) => (
          <div
            key={capability.label}
            className="flex h-[26px] items-center gap-[9px] text-xs text-ink-2"
          >
            <AccessMark access={capability.access} />
            {capability.label}
            <span className="ml-auto text-2xs text-ink-4">{ACCESS[capability.access].note}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2 border-t border-line px-2.5 pt-2 pb-1 text-2xs text-ink-4">
        <span className="flex items-center gap-[5px]">
          <Kbd>⇧⇥</Kbd>
          cycle
        </span>
        <span className="flex items-center gap-[5px]">
          <Kbd>1</Kbd>–<Kbd>6</Kbd>
        </span>
        <span className="ml-auto text-ink-3">Default: {MODE[defaultMode].chip}</span>
      </div>
    </Menu>
  );
}
