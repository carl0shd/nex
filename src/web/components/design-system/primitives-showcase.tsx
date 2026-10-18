import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bold,
  Copy,
  GitBranch,
  Info,
  Italic,
  Pencil,
  Plus,
  Search,
  Trash2,
  Underline,
} from "lucide-react";
import ShowcaseSection from "@/components/design-system/showcase-section";
import Specimen from "@/components/design-system/specimen";
import SpecimenItem from "@/components/design-system/specimen-item";
import SpecimenRow from "@/components/design-system/specimen-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;
const BUTTON_SIZES = ["sm", "default", "lg"] as const;
const BADGE_VARIANTS = ["default", "success", "warning", "info", "destructive"] as const;
const BADGE_TONES = ["solid", "soft"] as const;
const TOGGLE_SIZES = ["sm", "default", "lg"] as const;
const ALERT_VARIANTS = [
  { variant: "default", icon: Info, title: "Heads up", text: "Worktrees share the same git dir." },
  {
    variant: "warning",
    icon: AlertTriangle,
    title: "Uncommitted changes",
    text: "3 files will be stashed.",
  },
  {
    variant: "destructive",
    icon: AlertCircle,
    title: "Push rejected",
    text: "The remote has newer commits.",
  },
] as const;

function ButtonSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Button" source="ui/button.tsx">
      {BUTTON_SIZES.map((size) => (
        <SpecimenRow key={size} label={`size=${size}`}>
          {BUTTON_VARIANTS.map((variant) => (
            <SpecimenItem key={variant} label={variant}>
              <Button variant={variant} size={size}>
                Button
              </Button>
            </SpecimenItem>
          ))}
        </SpecimenRow>
      ))}
      <SpecimenRow label="extras">
        <SpecimenItem label="icon">
          <Button variant="secondary" size="icon">
            <Plus size={14} />
          </Button>
        </SpecimenItem>
        <SpecimenItem label="icon-sm">
          <Button variant="ghost" size="icon-sm">
            <Plus size={12} />
          </Button>
        </SpecimenItem>
        <SpecimenItem label="with icon">
          <Button variant="outline">
            <GitBranch size={13} />
            New task
          </Button>
        </SpecimenItem>
        <SpecimenItem label="disabled">
          <Button disabled>Disabled</Button>
        </SpecimenItem>
      </SpecimenRow>
    </Specimen>
  );
}

function ToggleSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Toggle · ToggleGroup" source="ui/toggle.tsx · ui/toggle-group.tsx">
      {TOGGLE_SIZES.map((size) => (
        <SpecimenRow key={size} label={`size=${size}`}>
          <SpecimenItem label="default">
            <Toggle size={size}>
              <Bold size={13} />
            </Toggle>
          </SpecimenItem>
          <SpecimenItem label="pressed">
            <Toggle size={size} defaultPressed>
              <Bold size={13} />
            </Toggle>
          </SpecimenItem>
          <SpecimenItem label="outline">
            <Toggle size={size} variant="outline">
              <Italic size={13} />
              Italic
            </Toggle>
          </SpecimenItem>
          <SpecimenItem label="group outline">
            <ToggleGroup type="multiple" variant="outline" size={size} defaultValue={["bold"]}>
              <ToggleGroupItem value="bold">
                <Bold size={13} />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic">
                <Italic size={13} />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline">
                <Underline size={13} />
              </ToggleGroupItem>
            </ToggleGroup>
          </SpecimenItem>
        </SpecimenRow>
      ))}
    </Specimen>
  );
}

function TextInputsSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Input · Textarea · InputGroup" source="ui/input.tsx · textarea · input-group">
      <div className="grid grid-cols-3 gap-4">
        <SpecimenItem label="input" className="items-stretch">
          <Input placeholder="Placeholder" />
        </SpecimenItem>
        <SpecimenItem label="input · value" className="items-stretch">
          <Input defaultValue="feat/design-system" />
        </SpecimenItem>
        <SpecimenItem label="input · disabled" className="items-stretch">
          <Input placeholder="Disabled" disabled />
        </SpecimenItem>
        <SpecimenItem label="input-group" className="items-stretch">
          <InputGroup>
            <InputGroupAddon>
              <Search size={14} />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search files…" />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘F</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </SpecimenItem>
        <SpecimenItem label="textarea" className="col-span-2 items-stretch">
          <Textarea rows={3} placeholder="Describe the task…" />
        </SpecimenItem>
      </div>
    </Specimen>
  );
}

function FieldSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Field · Label" source="ui/field.tsx · ui/label.tsx">
      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel>{"// task name"}</FieldLabel>
          <Input placeholder="fix login redirect" />
          <FieldDescription>Used as the branch name.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>{"// base branch"}</FieldLabel>
          <Input defaultValue="mian" />
          <FieldError>Branch does not exist.</FieldError>
        </Field>
        <Field data-disabled>
          <FieldLabel>{"// disabled field"}</FieldLabel>
          <Input placeholder="Unavailable" disabled />
        </Field>
      </div>
    </Specimen>
  );
}

function ChoiceSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Checkbox · Switch" source="ui/checkbox.tsx · ui/switch.tsx">
      <SpecimenRow label="checkbox">
        <Label>
          <Checkbox /> Unchecked
        </Label>
        <Label>
          <Checkbox defaultChecked /> Checked
        </Label>
        <Label>
          <Checkbox disabled /> Disabled
        </Label>
        <Label>
          <Checkbox defaultChecked disabled /> Checked disabled
        </Label>
      </SpecimenRow>
      <SpecimenRow label="switch">
        <Label>
          <Switch /> Off
        </Label>
        <Label>
          <Switch defaultChecked /> On
        </Label>
        <Label>
          <Switch disabled /> Disabled
        </Label>
        <Label>
          <Switch defaultChecked disabled /> On disabled
        </Label>
      </SpecimenRow>
    </Specimen>
  );
}

function SelectSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Select" source="ui/select.tsx">
      <div className="grid grid-cols-3 gap-4">
        <SpecimenItem label="with groups" className="items-stretch">
          <Select defaultValue="claude-code">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Agents</SelectLabel>
                <SelectItem value="claude-code">Claude Code</SelectItem>
                <SelectItem value="codex">Codex</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value="shell">Plain shell</SelectItem>
                <SelectItem value="none" disabled>
                  None (disabled)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SpecimenItem>
        <SpecimenItem label="placeholder" className="items-stretch">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick an editor…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vscode">VS Code</SelectItem>
              <SelectItem value="cursor">Cursor</SelectItem>
              <SelectItem value="zed">Zed</SelectItem>
            </SelectContent>
          </Select>
        </SpecimenItem>
        <SpecimenItem label="disabled" className="items-stretch">
          <Select disabled defaultValue="a">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </SpecimenItem>
      </div>
    </Specimen>
  );
}

function DropdownMenuSpecimen(): React.JSX.Element {
  const [showHidden, setShowHidden] = useState(true);
  const [sort, setSort] = useState("recent");

  return (
    <Specimen name="DropdownMenu" source="ui/dropdown-menu.tsx">
      <SpecimenRow>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Open menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Task</DropdownMenuLabel>
            <DropdownMenuItem>
              <Pencil size={13} />
              Rename
              <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy size={13} />
              Duplicate
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
              Show archived
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 size={13} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SpecimenRow>
    </Specimen>
  );
}

function FloatingSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Popover · Tooltip · HoverCard" source="ui/popover · tooltip · hover-card">
      <SpecimenRow>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Popover
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink">Popover surface</span>
              <span className="text-2xs text-ink-3">
                bg-surface-raised, border-line, shadow-overlay.
              </span>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Tooltip
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open in editor</TooltipContent>
        </Tooltip>

        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline" size="sm">
              HoverCard
            </Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <Card className="w-60 bg-surface-raised shadow-overlay">
              <CardTitle>feat/design-system</CardTitle>
              <CardDescription>3 commits ahead of main · 12 files changed</CardDescription>
            </Card>
          </HoverCardContent>
        </HoverCard>
      </SpecimenRow>
    </Specimen>
  );
}

function DialogSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Dialog" source="ui/dialog.tsx">
      <SpecimenRow>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Open dialog
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[420px]">
            <DialogHeader>
              <DialogTitle>Raw dialog</DialogTitle>
              <DialogDescription>
                The shadcn primitive with its default close button. App modals use Modal instead.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button size="sm">Confirm</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SpecimenRow>
    </Specimen>
  );
}

function CardSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Card" source="ui/card.tsx">
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>4 projects · 11 active worktrees</CardDescription>
        </CardHeader>
        <CardContent className="text-2xs text-ink-2">
          Cards group related content on bg-surface with a soft border.
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </CardFooter>
      </Card>
    </Specimen>
  );
}

function AlertSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Alert" source="ui/alert.tsx">
      <div className="grid grid-cols-3 gap-3">
        {ALERT_VARIANTS.map(({ variant, icon: Icon, title, text }) => (
          <Alert key={variant} variant={variant}>
            <Icon size={13} />
            <AlertDescription>
              <AlertTitle>{title}</AlertTitle>
              {text}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </Specimen>
  );
}

function BadgeSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Badge" source="ui/badge.tsx">
      {BADGE_TONES.map((tone) => (
        <SpecimenRow key={tone} label={`tone=${tone}`}>
          {BADGE_VARIANTS.map((variant) => (
            <SpecimenItem key={variant} label={variant}>
              <div className="flex items-center gap-1.5">
                <Badge variant={variant} tone={tone}>
                  {variant}
                </Badge>
                <Badge variant={variant} tone={tone} size="sm">
                  sm
                </Badge>
              </div>
            </SpecimenItem>
          ))}
        </SpecimenRow>
      ))}
    </Specimen>
  );
}

function KbdSeparatorSpecimen(): React.JSX.Element {
  return (
    <Specimen name="Kbd · Separator" source="ui/kbd.tsx · ui/separator.tsx">
      <SpecimenRow label="kbd">
        <Kbd>⌘K</Kbd>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </SpecimenRow>
      <SpecimenRow label="separator">
        <div className="flex w-64 flex-col gap-2 text-2xs text-ink-2">
          Above
          <Separator />
          Below
        </div>
        <div className="flex h-6 items-center gap-2 text-2xs text-ink-2">
          Left
          <Separator orientation="vertical" />
          Right
        </div>
      </SpecimenRow>
    </Specimen>
  );
}

function PrimitivesShowcase(): React.JSX.Element {
  return (
    <>
      <ShowcaseSection title="Actions" description="Buttons and pressable toggles.">
        <ButtonSpecimen />
        <ToggleSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Inputs" description="Form controls. All sit on bg-inset.">
        <TextInputsSpecimen />
        <FieldSpecimen />
        <ChoiceSpecimen />
        <SelectSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Overlays" description="Radix-portalled layers.">
        <DropdownMenuSpecimen />
        <FloatingSpecimen />
        <DialogSpecimen />
      </ShowcaseSection>
      <ShowcaseSection title="Display" description="Surfaces, status and small text elements.">
        <CardSpecimen />
        <AlertSpecimen />
        <BadgeSpecimen />
        <KbdSeparatorSpecimen />
      </ShowcaseSection>
    </>
  );
}

export default PrimitivesShowcase;
