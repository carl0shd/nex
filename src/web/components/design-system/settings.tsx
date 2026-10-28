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
import { SettingsPage } from "@/components/settings/settings-page";
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

const MACHINE = {
  runtime: "Apple container 1.5",
  environments: 3,
  usedGb: 5.2,
  totalGb: 8,
  healthy: true,
};

const CLAUDE_CODE = {
  version: "2.4.1",
  path: "/opt/homebrew/bin/claude",
  upToDate: true,
  liveTranscripts: 6,
};

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
          <SettingsPage
            accounts={ACCOUNTS}
            workspaces={WORKSPACES}
            machine={MACHINE}
            claudeCode={CLAUDE_CODE}
            licenses={LICENSES}
            version="2.0.0"
          />
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
