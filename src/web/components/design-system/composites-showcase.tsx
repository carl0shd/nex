import { useState } from 'react';
import { Group, Panel } from 'react-resizable-panels';
import { toast } from 'sonner';
import {
  Archive,
  Code,
  Copy,
  Filter,
  FolderGit2,
  GitBranch,
  ImagePlus,
  LayoutList,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Rows3,
  Trash2,
  TriangleAlert
} from 'lucide-react';
import {
  SAMPLE_BRANCHES,
  SAMPLE_QUICK_COMMANDS,
  SAMPLE_REPOS,
  SAMPLE_WORKSPACE_COLORS
} from '@/components/design-system/samples';
import ShowcaseSection from '@/components/design-system/showcase-section';
import Specimen from '@/components/design-system/specimen';
import SpecimenItem from '@/components/design-system/specimen-item';
import SpecimenRow from '@/components/design-system/specimen-row';
import ActionMenu, { type ActionMenuAction } from '@/components/ui/action-menu';
import AgentCardSelector, { type AgentCardOption } from '@/components/ui/agent-card-selector';
import AgentIcon from '@/components/ui/agent-icon';
import BackHeader from '@/components/ui/back-header';
import { Badge } from '@/components/ui/badge';
import BranchPicker from '@/components/ui/branch-picker';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import Callout from '@/components/ui/callout';
import Chip from '@/components/ui/chip';
import ColorPicker from '@/components/ui/color-picker';
import CommandBar from '@/components/ui/command-bar';
import Dropdown, { type DropdownOption } from '@/components/ui/dropdown';
import FloatingPanel from '@/components/ui/floating-panel';
import FolderPicker from '@/components/ui/folder-picker';
import IconButton from '@/components/ui/icon-button';
import IconSelector, { type IconSelectorOption } from '@/components/ui/icon-selector';
import IconToggle from '@/components/ui/icon-toggle';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalBody,
  ModalButton,
  ModalDivider,
  ModalFooter,
  ModalHeader
} from '@/components/ui/modal';
import OptionCard from '@/components/ui/option-card';
import OverflowBadge from '@/components/ui/overflow-badge';
import PanelSection from '@/components/ui/panel-section';
import PopoverMenu from '@/components/ui/popover-menu';
import ProgressRing from '@/components/ui/progress-ring';
import QuickCommandList from '@/components/ui/quick-command-list';
import RepoMultiSelect from '@/components/ui/repo-multi-select';
import ResizeHandle from '@/components/ui/resize-handle';
import SectionHeader from '@/components/ui/section-header';
import SegmentedControl, { type SegmentedControlOption } from '@/components/ui/segmented-control';
import SettingField from '@/components/ui/setting-field';
import SettingRow, { SettingValue } from '@/components/ui/setting-row';
import ShortcutKey from '@/components/ui/shortcut-key';
import { Shimmer } from '@/components/ui/shimmer';
import { Spinner } from '@/components/ui/spinner';
import { StatusPill, type StatusPillTone } from '@/components/ui/status-pill';
import StatusDot from '@/components/ui/status-dot';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import TipBox from '@/components/ui/tip-box';
import TreeGroupLabel from '@/components/ui/tree-group-label';
import WorkspaceBadge from '@/components/ui/workspace-badge';

const DROPDOWN_OPTIONS: DropdownOption[] = [
  { value: 'claude-code', label: 'Claude Code', icon: <AgentIcon slug="claude-code" /> },
  { value: 'codex', label: 'Codex', icon: <AgentIcon slug="codex" />, badge: 'beta' },
  { value: '', label: 'No agent' }
];

const AGENT_OPTIONS: AgentCardOption[] = [
  { value: 'claude-code', label: 'Claude Code', icon: <AgentIcon slug="claude-code" size={18} /> },
  { value: 'shell', label: 'Shell' },
  { value: 'codex', label: 'Codex', disabled: true, badge: 'soon' }
];

const ICON_OPTIONS: IconSelectorOption[] = [
  { id: 'letter', type: 'letter', letter: 'N', label: 'Letter' },
  { id: 'rocket', type: 'icon', icon: Rocket, label: 'Rocket' },
  { id: 'code', type: 'icon', icon: Code, label: 'Code' },
  { id: 'custom', type: 'image-picker', icon: ImagePlus, label: 'Image' }
];

const VIEW_OPTIONS: SegmentedControlOption<string>[] = [
  { value: 'split', label: 'Split' },
  { value: 'unified', label: 'Unified' }
];

const LAYOUT_OPTIONS: SegmentedControlOption<string>[] = [
  { value: 'rows', icon: Rows3, title: 'Rows' },
  { value: 'list', icon: LayoutList, title: 'List' }
];

const MENU_ACTIONS: ActionMenuAction[] = [
  { label: 'Rename', icon: Pencil, onClick: () => toast('Rename') },
  { label: 'Duplicate', icon: Copy, onClick: () => toast('Duplicate') },
  { label: 'Archive', icon: Archive, onClick: () => toast('Archive') },
  { label: 'Delete', icon: Trash2, destructive: true, onClick: () => toast.error('Delete') }
];

const TERMINAL_STATUSES = ['idle', 'running', 'waiting'] as const;
const PILL_TONES: StatusPillTone[] = ['neutral', 'primary', 'green', 'orange', 'red', 'blue'];
const RING_STEPS = [
  { progress: 0.25, tone: 'primary' },
  { progress: 0.6, tone: 'orange' },
  { progress: 0.92, tone: 'red' },
  { progress: 1, tone: 'green' }
] as const;
const WORKSPACE_ICONS = ['letter', 'rocket', 'code', 'palette', 'zap'];

function ModalSpecimen(): React.JSX.Element {
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [name, setName] = useState('');

  return (
    <Specimen name="Modal" source="ui/modal.tsx">
      <SpecimenRow>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          Form modal
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
          Confirm modal
        </Button>
      </SpecimenRow>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <ModalHeader label="// new project" title="Create project" subtitle="Link a git repo." />
        <ModalBody>
          <TextField label="// name" value={name} onChange={setName} placeholder="my-project" />
          <FolderPicker value="" onBrowse={() => toast('Browse')} />
        </ModalBody>
        <ModalDivider />
        <ModalFooter>
          <ModalButton variant="outline" onClick={() => setFormOpen(false)}>
            Cancel
          </ModalButton>
          <ModalButton onClick={() => setFormOpen(false)}>Create</ModalButton>
        </ModalFooter>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} width={380}>
        <ModalHeader
          icon={TriangleAlert}
          align="center"
          title="Delete workspace?"
          subtitle="Its projects and worktrees are removed from Nex."
        />
        <ModalFooter>
          <ModalButton variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="destructive" onClick={() => setConfirmOpen(false)}>
            Delete
          </ModalButton>
        </ModalFooter>
      </Modal>
    </Specimen>
  );
}

function FormFieldsSpecimen(): React.JSX.Element {
  const [text, setText] = useState('');
  const [agent, setAgent] = useState('claude-code');
  const [branch, setBranch] = useState('main');
  const [folder, setFolder] = useState('');

  return (
    <Specimen
      name="TextField · Dropdown · BranchPicker · FolderPicker"
      source="ui/text-field · dropdown · branch-picker · folder-picker"
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="// task name"
          value={text}
          onChange={setText}
          placeholder="fix login redirect"
          icon={GitBranch}
          trailing={<Chip>auto</Chip>}
        />
        <Dropdown label="// agent" value={agent} onChange={setAgent} options={DROPDOWN_OPTIONS} />
        <BranchPicker
          label="// base branch"
          value={branch}
          onChange={setBranch}
          branches={SAMPLE_BRANCHES}
          defaultBranch="main"
        />
        <FolderPicker value={folder} onBrowse={() => setFolder('~/Projects/nex')} />
        <TextField label="// disabled" value="" onChange={setText} placeholder="—" disabled />
      </div>
    </Specimen>
  );
}

function QuickCommandSpecimen(): React.JSX.Element {
  const [commands, setCommands] = useState(SAMPLE_QUICK_COMMANDS);
  const [selected, setSelected] = useState(new Set(['acme/nex']));

  const toggleRepo = (repo: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  };

  return (
    <Specimen
      name="QuickCommandList · RepoMultiSelect"
      source="ui/quick-command-list · repo-multi-select"
    >
      <div className="grid grid-cols-2 gap-4">
        <QuickCommandList commands={commands} onChange={setCommands} />
        <RepoMultiSelect
          repos={SAMPLE_REPOS}
          selected={selected}
          onToggle={toggleRepo}
          statuses={{ 'acme/api': { label: 'imported', tone: 'success' } }}
        />
      </div>
    </Specimen>
  );
}

function SelectionSpecimen(): React.JSX.Element {
  const [agent, setAgent] = useState('claude-code');
  const [icon, setIcon] = useState('letter');
  const [color, setColor] = useState(SAMPLE_WORKSPACE_COLORS[0]);
  const [option, setOption] = useState('worktree');

  return (
    <Specimen
      name="AgentCardSelector · IconSelector · ColorPicker · OptionCard"
      source="ui/agent-card-selector · icon-selector · color-picker · option-card"
    >
      <div className="grid grid-cols-2 gap-6">
        <AgentCardSelector
          label="// agent"
          value={agent}
          onChange={setAgent}
          options={AGENT_OPTIONS}
        />
        <IconSelector label="// icon" value={icon} onChange={setIcon} options={ICON_OPTIONS} />
        <ColorPicker label="// color" value={color} onChange={setColor} />
        <div className="flex flex-col gap-2">
          <OptionCard
            selected={option === 'worktree'}
            onClick={() => setOption('worktree')}
            icon={<GitBranch size={16} className="text-ink-2" />}
            title="New worktree"
            subtitle="Isolated branch checkout"
          />
          <OptionCard
            selected={option === 'existing'}
            onClick={() => setOption('existing')}
            icon={<FolderGit2 size={16} className="text-ink-2" />}
            title="Existing folder"
            subtitle="Work in place"
          />
        </div>
      </div>
    </Specimen>
  );
}

function ControlsSpecimen(): React.JSX.Element {
  const [view, setView] = useState('split');
  const [layout, setLayout] = useState('rows');

  return (
    <Specimen
      name="IconButton · IconToggle · SegmentedControl"
      source="ui/icon-button · icon-toggle · segmented-control"
    >
      <SpecimenRow label="icon-button">
        <SpecimenItem label="ghost">
          <IconButton icon={Plus} variant="ghost" />
        </SpecimenItem>
        <SpecimenItem label="default">
          <IconButton icon={Plus} />
        </SpecimenItem>
        <SpecimenItem label="filled">
          <IconButton icon={Plus} variant="filled" />
        </SpecimenItem>
        <SpecimenItem label="disabled">
          <IconButton icon={Plus} disabled />
        </SpecimenItem>
      </SpecimenRow>
      <SpecimenRow label="icon-toggle">
        <SpecimenItem label="sm">
          <IconToggle icon={Filter} aria-label="Filter" />
        </SpecimenItem>
        <SpecimenItem label="pressed">
          <IconToggle icon={Filter} defaultPressed aria-label="Filter" />
        </SpecimenItem>
        <SpecimenItem label="default">
          <IconToggle icon={Filter} size="default" aria-label="Filter" />
        </SpecimenItem>
      </SpecimenRow>
      <SpecimenRow label="segmented">
        <SpecimenItem label="labels">
          <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={setView} />
        </SpecimenItem>
        <SpecimenItem label="icons">
          <SegmentedControl value={layout} options={LAYOUT_OPTIONS} onChange={setLayout} />
        </SpecimenItem>
      </SpecimenRow>
    </Specimen>
  );
}

function MenusSpecimen(): React.JSX.Element {
  return (
    <Specimen name="ActionMenu · PopoverMenu" source="ui/action-menu · popover-menu">
      <SpecimenRow>
        <SpecimenItem label="action-menu (click or right-click)">
          <ActionMenu trigger={<IconButton icon={MoreHorizontal} />} actions={MENU_ACTIONS} />
        </SpecimenItem>
        <SpecimenItem label="popover-menu (bring your own surface)">
          <PopoverMenu
            anchor="bottom start"
            trigger={
              <Button variant="outline" size="sm">
                Open
              </Button>
            }
          >
            {({ close }) => (
              <Card className="w-56 bg-surface-raised shadow-overlay">
                <CardTitle>Custom content</CardTitle>
                <CardDescription>PopoverMenu renders no chrome of its own.</CardDescription>
                <Button size="sm" variant="secondary" onClick={close}>
                  Close
                </Button>
              </Card>
            )}
          </PopoverMenu>
        </SpecimenItem>
      </SpecimenRow>
    </Specimen>
  );
}

function HeadersSpecimen(): React.JSX.Element {
  const [sectionCollapsed, setSectionCollapsed] = useState(false);
  const [groupCollapsed, setGroupCollapsed] = useState(false);

  return (
    <Specimen
      name="SectionHeader · TreeGroupLabel · PanelSection · BackHeader"
      source="ui/section-header · tree-group-label · panel-section · back-header"
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="flex w-64 flex-col gap-2 rounded-md bg-sidebar p-2">
          <SectionHeader
            title="Workspaces"
            collapsed={sectionCollapsed}
            onToggle={() => setSectionCollapsed((c) => !c)}
            actions={[{ icon: Plus }, { icon: Filter }]}
          />
          <TreeGroupLabel
            id="nex"
            name="nex"
            collapsed={groupCollapsed}
            onToggle={() => setGroupCollapsed((c) => !c)}
            trailing={<Chip>3</Chip>}
          />
        </div>
        <div className="flex flex-col gap-4">
          <PanelSection title="Top projects" trailing={<SettingValue>last 30d</SettingValue>}>
            <span className="text-2xs text-ink-2">Section body</span>
          </PanelSection>
          <BackHeader title="Licenses" description="Open-source notices" onBack={() => {}} />
        </div>
      </div>
    </Specimen>
  );
}

function SettingsSpecimen(): React.JSX.Element {
  return (
    <Specimen name="SettingRow · SettingField" source="ui/setting-row · setting-field">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <SettingRow
            title="Word diff"
            description="Highlight changed words inside a line."
            control={<Switch defaultChecked />}
          />
          <SettingRow
            variant="plain"
            title="Version"
            control={<SettingValue>1.4.0</SettingValue>}
          />
        </div>
        <SettingField label="Default editor" description="Used by “Open in editor”.">
          <Input defaultValue="cursor" />
        </SettingField>
      </div>
    </Specimen>
  );
}

function FeedbackSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Callout · Toast" source="ui/callout.tsx · sonner (globals.css)">
      <div className="grid grid-cols-3 gap-3">
        <Callout>Sessions keep running when you close the window.</Callout>
        <Callout variant="warning">This worktree has uncommitted changes.</Callout>
        <Callout variant="error">Could not reach the git remote.</Callout>
      </div>
      <SpecimenRow label="toast">
        <Button variant="outline" size="sm" onClick={() => toast('Task created')}>
          default
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success('Pushed to origin')}>
          success
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.warning('Rate limited', { description: 'retry in 30s' })}
        >
          warning
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error('Failed to create task', { description: 'fatal: bad ref' })}
        >
          error
        </Button>
      </SpecimenRow>
    </Specimen>
  );
}

function SmallDisplaySpecimen(): React.JSX.Element {
  return (
    <Specimen
      name="Chip · StatusDot · OverflowBadge · ShortcutKey · TipBox · CommandBar"
      source="ui/chip · status-dot · overflow-badge · shortcut-key · tip-box · command-bar"
    >
      <SpecimenRow label="chip">
        <Chip>default</Chip>
        <Chip>
          <GitBranch size={9} />
          main
        </Chip>
      </SpecimenRow>
      <SpecimenRow label="status-dot">
        {TERMINAL_STATUSES.map((status) => (
          <SpecimenItem key={status} label={status}>
            <StatusDot status={status} />
          </SpecimenItem>
        ))}
      </SpecimenRow>
      <SpecimenRow label="overflow">
        <OverflowBadge count={3} />
        <Badge variant="info" tone="soft">
          +12 / -4
        </Badge>
      </SpecimenRow>
      <SpecimenRow label="tip-box">
        <div className="w-72">
          <TipBox>
            <ShortcutKey keys="⌘N" label="New task" />
            <ShortcutKey keys="⌘K" label="Command bar" />
          </TipBox>
        </div>
      </SpecimenRow>
      <SpecimenRow label="command-bar">
        <CommandBar />
      </SpecimenRow>
    </Specimen>
  );
}

function StatusSpecimen(): React.JSX.Element {
  return (
    <Specimen
      name="StatusPill · Shimmer · Spinner · ProgressRing"
      source="ui/status-pill · shimmer · spinner · progress-ring"
    >
      <SpecimenRow label="status-pill">
        {PILL_TONES.map((tone) => (
          <StatusPill key={tone} tone={tone}>
            {tone}
          </StatusPill>
        ))}
        <StatusPill tone="orange" pulse>
          Waiting for input
        </StatusPill>
      </SpecimenRow>
      <SpecimenRow label="working">
        <div className="flex items-center gap-2">
          <Spinner />
          <Shimmer className="text-sm font-medium">Claude is editing 3 files…</Shimmer>
        </div>
      </SpecimenRow>
      <SpecimenRow label="progress-ring">
        {RING_STEPS.map(({ progress, tone }) => (
          <ProgressRing key={tone} progress={progress} tone={tone}>
            {Math.round(progress * 100)}
          </ProgressRing>
        ))}
      </SpecimenRow>
    </Specimen>
  );
}

function IdentitySpecimen(): React.JSX.Element {
  return (
    <Specimen name="WorkspaceBadge · AgentIcon" source="ui/workspace-badge · agent-icon">
      <SpecimenRow label="workspace">
        {WORKSPACE_ICONS.map((icon, i) => (
          <SpecimenItem key={icon} label={icon}>
            <WorkspaceBadge
              name="Nex"
              icon={icon}
              color={SAMPLE_WORKSPACE_COLORS[i % SAMPLE_WORKSPACE_COLORS.length]}
              size={28}
              fontSize={12}
            />
          </SpecimenItem>
        ))}
        <SpecimenItem label="size=18 (sidebar)">
          <WorkspaceBadge name="Nex" color={SAMPLE_WORKSPACE_COLORS[0]} />
        </SpecimenItem>
      </SpecimenRow>
      <SpecimenRow label="agent">
        <SpecimenItem label="claude-code">
          <AgentIcon slug="claude-code" size={18} />
        </SpecimenItem>
        <SpecimenItem label="fallback">
          <AgentIcon slug="unknown" size={18} className="text-ink-3" />
        </SpecimenItem>
      </SpecimenRow>
    </Specimen>
  );
}

function LayoutSpecimen(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Specimen name="FloatingPanel · ResizeHandle" source="ui/floating-panel · resize-handle">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative h-44 overflow-hidden rounded-md border border-line-soft bg-terminal">
          <FloatingPanel
            label="Chat"
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          >
            <Input placeholder="Ask about this diff…" />
          </FloatingPanel>
        </div>
        <Group
          orientation="horizontal"
          className="h-44 overflow-hidden rounded-md border border-line-soft"
        >
          <Panel defaultSize="50%" minSize="20%">
            <div className="flex h-full items-center justify-center text-2xs text-ink-3">
              drag the divider
            </div>
          </Panel>
          <ResizeHandle direction="horizontal" />
          <Panel defaultSize="50%" minSize="20%">
            <div className="flex h-full items-center justify-center bg-canvas text-2xs text-ink-3">
              panel
            </div>
          </Panel>
        </Group>
      </div>
    </Specimen>
  );
}

function CompositesShowcase(): React.JSX.Element {
  return (
    <>
      <ShowcaseSection title="Modals" description="Always mounted; open drives the animation.">
        <ModalSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Forms" description="Labelled fields built on Field + InputGroup.">
        <FormFieldsSpecimen />
        <QuickCommandSpecimen />
        <SelectionSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Controls & menus">
        <ControlsSpecimen />
        <MenusSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Structure" description="Headers, settings rows and panels.">
        <HeadersSpecimen />
        <SettingsSpecimen />
        <LayoutSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Feedback & display">
        <FeedbackSpecimen />
        <StatusSpecimen />
        <SmallDisplaySpecimen />
        <IdentitySpecimen />
      </ShowcaseSection>
    </>
  );
}

export default CompositesShowcase;
