import { useState, type ReactNode } from "react";
import {
  AddMenu,
  ConnectorAlert,
  ConnectorsMenu,
  type ConnectorGroup,
} from "@/components/composer/add-menu";
import { AddServerDialog } from "@/components/composer/add-server-dialog";
import { Composer } from "@/components/composer/composer";
import { DictateButton, DictationMenu } from "@/components/composer/dictation";
import type { Effort } from "@/components/composer/effort";
import { ModelChip, ModelMenu } from "@/components/composer/model-menu";
import { MODELS } from "@/components/composer/models";
import {
  PermissionChip,
  PermissionMenu,
  type PermissionMode,
} from "@/components/composer/permission-menu";
import { Section, Specimen } from "@/components/design-system/specimen";

const CONNECTORS: ConnectorGroup[] = [
  {
    id: "account",
    label: "Your account",
    source: "claude.ai",
    visible: 6,
    connectors: [
      { id: "linear", name: "Linear", logo: { letter: "L", color: "#5e6ad2" }, enabled: true },
      { id: "slack", name: "Slack", logo: { letter: "S", color: "#4a154b" }, enabled: true },
      {
        id: "notion",
        name: "Notion",
        logo: { letter: "N", color: "var(--ink)", ink: "var(--inverse)" },
        enabled: true,
      },
      { id: "gmail", name: "Gmail", logo: { letter: "M", color: "#ea4335" }, enabled: false },
      {
        id: "calendar",
        name: "Google Calendar",
        logo: { letter: "31", color: "#4285f4" },
        enabled: false,
      },
      { id: "shopify", name: "Shopify", logo: { letter: "S", color: "#5e8e3e" }, enabled: false },
      { id: "slipstream", name: "Slipstream", logo: { letter: "S" }, enabled: true },
      { id: "backstage", name: "Slipstream Backstage", logo: { letter: "S" }, enabled: false },
      { id: "kismet", name: "Kismet", logo: { letter: "K" }, enabled: false },
      { id: "daycast", name: "Daycast", logo: { letter: "D" }, enabled: false },
    ],
  },
  {
    id: "mac",
    label: "This Mac",
    source: "~/.claude.json",
    connectors: [
      {
        id: "figma",
        name: "Figma",
        logo: { letter: "F", color: "#f24e1e" },
        detail: "HTTP",
        enabled: true,
      },
      { id: "pencil", name: "Pencil", logo: { letter: "P" }, detail: "local app", enabled: true },
      {
        id: "freecad",
        name: "FreeCAD",
        logo: { letter: "F" },
        detail: "local",
        enabled: true,
        failed: true,
      },
    ],
  },
  {
    id: "plugins",
    label: "Plugins",
    connectors: [
      {
        id: "cloudflare",
        name: "Cloudflare",
        logo: { letter: "C", color: "#f38020" },
        detail: "plugin",
        enabled: true,
      },
    ],
  },
];

const LANGUAGES = [
  { id: "es-419", name: "Español", region: "Latinoamérica" },
  { id: "en-us", name: "English", region: "US" },
  { id: "pt-br", name: "Português", region: "Brasil" },
  { id: "fr", name: "Français" },
];

const MICROPHONES = [
  { id: "builtin", name: "MacBook Pro Microphone" },
  { id: "airpods", name: "AirPods Pro" },
  { id: "display", name: "Studio Display" },
];

const EFFORT_SPECIMENS: Effort[] = ["high", "xhigh", "max", "ultracode"];
const MODES: PermissionMode[] = ["plan", "manual", "dontask", "edits", "auto", "bypass"];

function ComposerFrame({ children }: { children: ReactNode }) {
  return <div className="w-[600px] rounded-b-[22px] bg-surface pt-2 shadow-card">{children}</div>;
}

function ModelMenuDemo({ initial }: { initial: Effort }) {
  const [model, setModel] = useState("opus-5-5");
  const [effort, setEffort] = useState(initial);
  return (
    <ModelMenu
      models={MODELS}
      model={model}
      onModelChange={setModel}
      effort={effort}
      onEffortChange={setEffort}
    />
  );
}

function PermissionMenuDemo() {
  const [mode, setMode] = useState<PermissionMode>("auto");
  return <PermissionMenu mode={mode} onChange={setMode} />;
}

function ConnectorsDemo({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(true);
  return (
    <div className="pr-[336px]">
      <AddMenu connectorCount={17} connectorsOpen={open} onConnectorsOpenChange={setOpen}>
        <ConnectorsMenu
          groups={CONNECTORS}
          query={query}
          onQueryChange={setQuery}
          onToggle={() => {}}
          onRetry={() => {}}
          onAddServer={() => {}}
          onManage={() => {}}
        />
      </AddMenu>
    </div>
  );
}

function DictationMenuDemo() {
  const [language, setLanguage] = useState("es-419");
  const [microphone, setMicrophone] = useState("builtin");
  const [query, setQuery] = useState("");
  return (
    <DictationMenu
      languages={LANGUAGES}
      language={language}
      onLanguageChange={setLanguage}
      microphones={MICROPHONES}
      microphone={microphone}
      onMicrophoneChange={setMicrophone}
      query={query}
      onQueryChange={setQuery}
    />
  );
}

export function ComposerMenus() {
  return (
    <Section
      id="composer"
      title="Composer"
      description="Permissions, model and effort, the + menu with connectors, and dictation."
    >
      <Specimen name="Composer · every pill opens its menu" bare className="items-end pt-[460px]">
        <ComposerFrame>
          <Composer placeholder="Reply to Claude…" connectors={CONNECTORS} state="idle" />
        </ComposerFrame>
      </Specimen>
      <Specimen name="Chips">
        {MODES.map((mode) => (
          <PermissionChip key={mode} mode={mode} />
        ))}
        {EFFORT_SPECIMENS.map((effort) => (
          <ModelChip key={effort} model="Opus" effort={effort} />
        ))}
        <ConnectorAlert count={1} />
      </Specimen>
      <Specimen name="ModelMenu · High → X-high → Max → Ultracode" className="items-start">
        {EFFORT_SPECIMENS.map((effort) => (
          <ModelMenuDemo key={effort} initial={effort} />
        ))}
      </Specimen>
      <div className="grid grid-cols-[auto_1fr] gap-6">
        <Specimen name="PermissionMenu" className="items-start">
          <PermissionMenuDemo />
        </Specimen>
        <Specimen name="DictationMenu · DictateButton" className="items-start">
          <DictationMenuDemo />
          <div className="flex flex-col gap-3">
            <DictateButton />
            <DictateButton menuOpen />
            <DictateButton listening />
          </div>
        </Specimen>
      </div>
      <Specimen name="AddMenu · ConnectorsMenu" className="items-end pt-[440px]">
        <ConnectorsDemo />
      </Specimen>
      <Specimen name="ConnectorsMenu · searching" className="items-end">
        <ConnectorsDemo initialQuery="sl" />
      </Specimen>
      <Specimen name="AddServerDialog · from Add a server">
        <AddServerDialog onAdd={() => Promise.resolve()} onCancel={() => {}} />
      </Specimen>
      <Specimen name="Composer · dictating" bare>
        <ComposerFrame>
          <Composer
            placeholder="Reply to Claude…"
            dictation={{
              confirmed: "Make the logout redirect use the same helper",
              pending: "and add a test for the",
            }}
            state="idle"
          />
        </ComposerFrame>
      </Specimen>
    </Section>
  );
}
