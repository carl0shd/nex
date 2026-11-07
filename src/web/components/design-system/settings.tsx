import { useState } from "react";
import LICENSES from "@/assets/licenses.json";
import { Section, Specimen } from "@/components/design-system/specimen";
import { SettingsCard } from "@/components/primitives/setting-row";
import {
  AccountList,
  RemoveAccountDialog,
  type ClaudeAccount,
} from "@/components/settings/account-list";
import {
  LicenseSheet,
  LicensesView,
  type PackageLicense,
} from "@/components/settings/licenses-view";
import { Overlay } from "@/components/primitives/overlay";
import { SettingsPage, type SettingsData } from "@/components/settings/settings-page";
import type { Preferences } from "@native/db/types";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import type { ThemePreference } from "@/lib/theme";
import type { SettingsWorkspace } from "@/components/settings/workspace-card";

const ACCOUNTS: ClaudeAccount[] = [
  {
    id: "monoku",
    name: "Monoku",
    email: "you@monoku.com",
    color: "#33843F",
    usedPercent: 62,
    isDefault: true,
    tasks: 4,
  },
  {
    id: "personal",
    name: "Personal",
    email: "you@hey.com",
    color: "#6b21a8",
    usedPercent: 18,
    tasks: 2,
  },
  {
    id: "studio",
    name: "Studio",
    email: "you@studio.dev",
    color: "#3f6fb5",
    usedPercent: 0,
    expired: true,
  },
];

const WORKSPACES: SettingsWorkspace[] = [
  {
    id: "monoku",
    name: "Monoku",
    color: "#33843F",
    projects: [
      { id: "nex", name: "nex", path: "~/code/nex", branch: "main", tasks: 4 },
      { id: "api", name: "api", path: "~/code/api", branch: "main", tasks: 1 },
      { id: "website", name: "website", path: "~/code/website", branch: "develop", tasks: 1 },
    ],
  },
  {
    id: "personal",
    name: "Personal",
    color: "#6b21a8",
    projects: [{ id: "dotfiles", name: "dotfiles", path: "~/dotfiles", branch: "main", tasks: 1 }],
  },
];

const SAMPLE_DATA: SettingsData = {
  version: "2.0.0",
  dataDir: "~/.nex",
  openAtLogin: false,
  theme: "dark",
  showSidebar: true,
  accounts: ACCOUNTS,
  workspaces: WORKSPACES,
  claudeCode: {
    version: "2.1.280",
    path: "/opt/homebrew/bin/claude",
    compat: "ok",
    upgrading: false,
  },
  claudePathChangeable: true,
  licenses: LICENSES,
  models: [
    { value: "opus[1m]", label: "Opus 5.5" },
    { value: "sonnet", label: "Sonnet 5" },
  ],
  model: "opus[1m]",
  ides: ["Cursor", "Zed"],
  terminals: ["Terminal", "Ghostty"],
  shells: ["/bin/zsh", "/bin/bash"],
  microphones: [{ value: "1", label: "MacBook Pro Microphone" }],
  languages: [{ value: "es-CO", label: "Español · Colombia" }],
  microphone: "1",
  language: "es-CO",
  lastScan: "2 min ago",
};

function SettingsPageDemo() {
  const [values, setValues] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [theme, setTheme] = useState<ThemePreference>("dark");
  const noop = () => {};
  return (
    <SettingsPage
      values={values}
      data={{ ...SAMPLE_DATA, theme }}
      actions={{
        onPreference: (key, value) => setValues((current) => ({ ...current, [key]: value })),
        onOpenAtLogin: noop,
        onTheme: setTheme,
        onShowSidebar: noop,
        onMakeDefault: noop,
        onShowProfile: noop,
        onRenameAccount: noop,
        onRemoveAccount: noop,
        onAddAccount: noop,
        onSignInAgain: noop,
        onOpenProject: noop,
        onAddProject: noop,
        onImportFromGitHub: noop,
        onAddWorkspace: noop,
        onRenameWorkspace: noop,
        onWorkspaceLookChange: noop,
        onRemoveWorkspace: noop,
        onChangeClaudePath: noop,
        onPlaySound: noop,
        onMicrophone: noop,
        onLanguage: noop,
        onRescan: noop,
        onUpgradeClaude: noop,
        onShowDataFolder: noop,
      }}
    />
  );
}

function LicensesDemo() {
  const [open, setOpen] = useState<PackageLicense | null>(null);
  return (
    <div className="relative h-[640px] w-full overflow-hidden rounded-card bg-page shadow-card">
      <div className="h-full overflow-y-auto px-[60px] py-12">
        <LicensesView packages={LICENSES} onOpen={setOpen} />
      </div>
      {open && (
        <Overlay offset={80} onClose={() => setOpen(null)}>
          <LicenseSheet item={open} onClose={() => setOpen(null)} />
        </Overlay>
      )}
    </div>
  );
}

export function SettingsPageSection() {
  return (
    <Section
      id="settings-page"
      title="Settings page"
      description="One page with an index: search filters every row, the index follows the scroll and jumps to a section. Licenses open from Updates & about."
    >
      <Specimen name="SettingsPage · scroll, search with ⌘F, jump from the index" bare>
        <div className="h-[860px] w-full overflow-hidden rounded-card bg-page shadow-card">
          <SettingsPageDemo />
        </div>
      </Specimen>
      <Specimen name="Claude accounts · menu and Sign out and remove" bare>
        <div className="flex min-h-[340px] items-start gap-16">
          <SettingsCard className="w-[620px]">
            <AccountList
              accounts={ACCOUNTS}
              defaultMenuOpen="personal"
              onMakeDefault={() => {}}
              onRemove={() => {}}
            />
          </SettingsCard>
          <RemoveAccountDialog
            account={ACCOUNTS[1]}
            fallback="Monoku"
            onCancel={() => {}}
            onConfirm={() => {}}
          />
        </div>
      </Specimen>
      <Specimen name="LicensesView · search, open a package" bare>
        <LicensesDemo />
      </Specimen>
    </Section>
  );
}
