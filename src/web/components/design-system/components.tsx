import { useState } from "react";
import {
  Bell,
  Copy,
  EditPencil,
  Expand,
  Globe,
  HalfMoon,
  MoreHoriz,
  OpenNewWindow,
  Pause,
  Plus,
  Refresh,
  SunLight,
  Computer,
  Terminal,
  WarningTriangle,
} from "iconoir-react";
import { ClaudeTile } from "@/components/atoms/agent-tile";
import { Button } from "@/components/atoms/button";
import { Chip, CountChip } from "@/components/atoms/chip";
import { Monogram } from "@/components/atoms/entity-chip";
import { IconButton } from "@/components/atoms/icon-button";
import { Kbd, KeyCaps } from "@/components/atoms/kbd";
import { Meter } from "@/components/atoms/meter";
import { Orbit } from "@/components/atoms/orbit";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { SelectButton } from "@/components/atoms/select-button";
import { OptionCard } from "@/components/atoms/option-card";
import { SelectionMark } from "@/components/atoms/selection-mark";
import { Shimmer } from "@/components/atoms/shimmer";
import { StatusDot } from "@/components/atoms/status-dot";
import { StatusPill } from "@/components/atoms/status-pill";
import { StreamText } from "@/components/atoms/stream-text";
import { Switch } from "@/components/atoms/switch";
import { Tabs } from "@/components/atoms/tabs";
import { TextField } from "@/components/atoms/text-field";
import { ValuePill } from "@/components/atoms/value-pill";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { ModalCard, StatusIcon } from "@/components/primitives/modal-card";
import { SettingRow, SettingsCard } from "@/components/primitives/setting-row";
import { Section, Specimen } from "@/components/design-system/specimen";

const DIFFSTAT = (
  <span className="font-mono text-3xs">
    <span className="text-green">+128</span> <span className="text-red">−14</span>
  </span>
);

export function Actions() {
  return (
    <Section
      id="actions"
      title="Actions"
      description="Pills by default. Green is the one primary action per view."
    >
      <Specimen name="Button · variants">
        <Button variant="primary" size="lg" kbd="⌘↵">
          Start task
        </Button>
        <Button variant="secondary" size="lg">
          Back
        </Button>
        <Button variant="inverse" size="sm">
          Review changes
        </Button>
        <Button variant="danger" size="md">
          Close task
        </Button>
        <Button variant="quiet" size="sm">
          Show log
        </Button>
        <Button variant="destructive" size="sm">
          Remove
        </Button>
      </Specimen>
      <Specimen name="Button · sizes (24 · 28 · 34 · 36)">
        <Button variant="secondary" size="xs">
          View log
        </Button>
        <Button variant="secondary" size="sm">
          <Plus width={12} height={12} strokeWidth={2.25} />
          Add project
        </Button>
        <Button variant="secondary" size="md">
          Cancel
        </Button>
        <Button variant="primary" size="lg">
          Continue
        </Button>
      </Specimen>
      <Specimen name="IconButton">
        <IconButton aria-label="Expand">
          <Expand width={14} height={14} strokeWidth={2} />
        </IconButton>
        <IconButton aria-label="More actions">
          <MoreHoriz width={15} height={15} strokeWidth={2} />
        </IconButton>
        <IconButton aria-label="Panel" pressed>
          <Terminal width={15} height={15} strokeWidth={2} />
        </IconButton>
        <IconButton aria-label="Notifications" size="sm">
          <Bell width={14} height={14} strokeWidth={2} />
        </IconButton>
      </Specimen>
      <Specimen name="Kbd · KeyCaps">
        <Kbd>⌘T</Kbd>
        <Kbd>⌘K</Kbd>
        <KeyCaps keys={["⌘", "⇧", "N"]} />
      </Specimen>
    </Section>
  );
}

export function Navigation() {
  const [tab, setTab] = useState<"agent" | "changes" | "notes" | "shell">("agent");
  const [theme, setTheme] = useState<"System" | "Dark" | "Light">("Dark");
  const [split, setSplit] = useState<"Unified" | "Split">("Unified");
  return (
    <Section id="navigation" title="Tabs and segments">
      <Specimen name="Tabs · task views">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            {
              value: "agent",
              label: (
                <>
                  <ClaudeTile size={16} />
                  Agent
                  <StatusDot tone="green" />
                </>
              ),
            },
            { value: "changes", label: <>Changes {DIFFSTAT}</> },
            { value: "notes", label: "Notes" },
            { value: "shell", label: "Shell" },
          ]}
        />
      </Specimen>
      <Specimen name="SegmentedControl · text and icons">
        <SegmentedControl
          options={["Unified", "Split"] as const}
          value={split}
          onChange={setSplit}
        />
        <SegmentedControl
          options={["System", "Dark", "Light"] as const}
          value={theme}
          onChange={setTheme}
          icons={{ System: Computer, Dark: HalfMoon, Light: SunLight }}
        />
      </Specimen>
    </Section>
  );
}

export function Inputs() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const [mark, setMark] = useState<"a" | "b">("a");
  const [plan, setPlan] = useState<"claude" | "console">("claude");
  return (
    <Section id="inputs" title="Inputs">
      <div className="grid grid-cols-2 gap-4">
        <Specimen name="TextField" className="flex-col items-stretch">
          <TextField label="Name" defaultValue="Monoku" />
          <TextField
            label="Branch prefix"
            defaultValue="feat/"
            mono
            hint="A task called “fix login redirect” runs on feat/fix-login-redirect"
          />
        </Specimen>
        <Specimen
          name="Switch · SelectButton · SelectionMark"
          className="flex-col items-start gap-4"
        >
          <div className="flex items-center gap-3">
            <Switch checked={on} onChange={setOn} label="Enabled" />
            <Switch checked={off} onChange={setOff} label="Disabled" />
          </div>
          <SelectButton value="8 GB" className="min-w-[90px]" />
          <SelectButton value="~/.nex/worktrees" mono />
          <div role="radiogroup" className="flex items-center gap-3">
            <SelectionMark selected={mark === "a"} onClick={() => setMark("a")} label="First" />
            <SelectionMark selected={mark === "b"} onClick={() => setMark("b")} label="Second" />
          </div>
        </Specimen>
      </div>
      <Specimen name="OptionCard" className="max-w-[440px] flex-col items-stretch gap-2">
        <div role="radiogroup" className="flex flex-col gap-2">
          <OptionCard
            title="Claude account"
            description="Pro, Max, Team or Enterprise"
            selected={plan === "claude"}
            onSelect={() => setPlan("claude")}
          />
          <OptionCard
            title="Console"
            description="Pay as you go with an API key"
            selected={plan === "console"}
            onSelect={() => setPlan("console")}
          />
        </div>
      </Specimen>
    </Section>
  );
}

export function Status() {
  const [streamKey, setStreamKey] = useState(0);
  return (
    <Section
      id="status"
      title="Status"
      description="Flat dots, no halos. Long-running work uses the orbit or a shimmer, never a spinner on the agent logo."
    >
      <Specimen name="StatusDot">
        <StatusDot tone="green" />
        <StatusDot tone="orange" />
        <StatusDot tone="red" />
        <StatusDot tone="blue" />
        <StatusDot tone="idle" />
        <StatusDot tone="green" size={8} />
      </Specimen>
      <Specimen name="StatusPill">
        <StatusPill tone="green">Working</StatusPill>
        <StatusPill tone="orange">Needs you</StatusPill>
        <StatusPill tone="neutral">Idle</StatusPill>
        <StatusPill tone="red">Stopped</StatusPill>
      </Specimen>
      <Specimen name="ValuePill · badges">
        <ValuePill tone="accent">Default</ValuePill>
        <ValuePill tone="green">Detected</ValuePill>
        <ValuePill>Signed in</ValuePill>
        <ValuePill tone="orange">Will be lost</ValuePill>
      </Specimen>
      <Specimen name="Chip · quick commands">
        <Chip running meta=":5173">
          dev
        </Chip>
        <Chip>test</Chip>
        <CountChip count={4} />
      </Specimen>
      <Specimen name="Orbit · Shimmer · StreamText · Meter">
        <Orbit />
        <Orbit size="lg" />
        <Shimmer className="text-sm">Reading src/routes/logout.tsx…</Shimmer>
        <Meter value={34} tone="blue" />
        <Meter value={62} />
        <button
          type="button"
          className="interactive press cursor-pointer text-left text-sm text-ink-2"
          onClick={() => setStreamKey((k) => k + 1)}
        >
          <StreamText key={streamKey} text="Tests pass. Checking the logout route next." />
        </button>
      </Specimen>
    </Section>
  );
}

export function Identity() {
  return (
    <Section
      id="identity"
      title="Identity"
      description="Agent logo tiles wherever an agent is named; workspace initials in their color."
    >
      <Specimen name="ClaudeTile · 16 · 18 · 22 · 32">
        <ClaudeTile size={16} />
        <ClaudeTile size={18} />
        <ClaudeTile size={22} />
        <ClaudeTile size={32} />
      </Specimen>
      <Specimen name="Monogram · workspace badge">
        <Monogram>M</Monogram>
        <Monogram size="md">M</Monogram>
        <Monogram size="lg">M</Monogram>
        <Monogram color="#6b21a8">P</Monogram>
        <Monogram size="md" color="#6b21a8">
          P
        </Monogram>
      </Specimen>
    </Section>
  );
}

export function Overlays() {
  return (
    <Section
      id="overlays"
      title="Menus, dialogs and toasts"
      description="Overlays stay solid; only toasts use the glass."
    >
      <div className="flex flex-wrap items-start gap-6">
        <Specimen name="Menu" bare>
          <Menu>
            <MenuLabel>Environment · 4 services</MenuLabel>
            <MenuItem icon={Globe} meta="monoku-fix-login.nex">
              web
            </MenuItem>
            <MenuItem icon={Copy}>Copy link</MenuItem>
            <MenuItem icon={OpenNewWindow}>Open in its own window</MenuItem>
            <MenuSeparator />
            <MenuItem icon={Refresh}>Restart environment</MenuItem>
            <MenuItem icon={Pause}>Pause</MenuItem>
            <MenuItem checked>Claude can use this browser</MenuItem>
            <MenuSeparator />
            <MenuItem danger>Clear browsing data</MenuItem>
          </Menu>
        </Specimen>
        <Specimen name="ModalCard" bare>
          <ModalCard
            title="Close Fix login redirect param?"
            description="The branch feat/fix-login-redirect stays in git."
            icon={<StatusIcon tone="red" icon={WarningTriangle} />}
            footer={
              <>
                <Button variant="quiet" size="sm">
                  Commit first
                </Button>
                <span className="ml-auto" />
                <Button variant="secondary">Cancel</Button>
                <Button variant="danger">Close task</Button>
              </>
            }
          >
            <p className="m-0 text-sm text-ink-2">Its worktree and environment are deleted.</p>
          </ModalCard>
        </Specimen>
      </div>
    </Section>
  );
}

export function Settings() {
  const [notify, setNotify] = useState(true);
  return (
    <Section id="settings" title="Settings rows">
      <SettingsCard label="Behaviour" className="max-w-[640px]">
        <SettingRow
          label="Notify when a task needs you"
          description="A native notification and a sound."
          control={<Switch checked={notify} onChange={setNotify} />}
        />
        <SettingRow
          label="Machine memory"
          description="Shared by every task that runs in an environment"
          control={<SelectButton value="8 GB" className="min-w-[90px]" />}
        />
        <SettingRow
          label="Edit commands"
          control={
            <Button variant="secondary" size="sm">
              <EditPencil width={12} height={12} strokeWidth={2} />
              Edit
            </Button>
          }
        />
      </SettingsCard>
    </Section>
  );
}
