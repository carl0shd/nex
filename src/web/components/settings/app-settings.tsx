import { useCallback, useEffect, useState } from "react";
import type { AgentAccount } from "@native/db/types";
import type { UsageSummary } from "@native/usage/types";
import LICENSES from "@/assets/licenses.json";
import { AppAddAccount, type ReauthTarget } from "@/components/onboarding/app-add-account";
import type { ClaudeAccount } from "@/components/settings/account-list";
import { SettingsPage, type SettingsData } from "@/components/settings/settings-page";
import { IDE_APPS, TERMINAL_APPS } from "@/components/settings/settings-values";
import type { SettingsWorkspace } from "@/components/settings/workspace-card";
import { accountLabel } from "@/lib/accounts";
import { resolveModel } from "@/components/composer/models";
import { useAgentModels } from "@/hooks/use-agent-models";
import { upgradeClaude } from "@/hooks/use-claude-version-check";
import { claudeCompat } from "@/lib/claude-version";
import { notifyCompact } from "@/lib/notify";
import { relativeTime } from "@/lib/relative-time";
import { activeLimit } from "@/lib/usage";
import { workspaceImageUrl } from "@/lib/workspace-image";
import { useAddProjectStore } from "@/stores/add-project.store";
import { useNewWorkspaceStore } from "@/stores/new-workspace.store";
import { useRemoveWorkspaceStore } from "@/stores/remove-workspace.store";
import { useDictationStore } from "@/stores/dictation.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { workspaceIcon } from "@/lib/workspace-icons";

interface Machine {
  version: string;
  dataDir: string;
  openAtLogin: boolean;
  claudeCode: { version: string; path: string; agentId: string } | null;
  claudeAgentId: string | null;
  ides: string[];
  terminals: string[];
  shells: string[];
}

const NO_MACHINE: Machine = {
  version: "",
  dataDir: "",
  openAtLogin: false,
  claudeCode: null,
  claudeAgentId: null,
  ides: [],
  terminals: [],
  shells: [],
};

function toAccounts(
  saved: readonly AgentAccount[],
  summary: UsageSummary | null,
  tasksFor: (accountId: string) => number,
): ClaudeAccount[] {
  return saved.map((account) => {
    const usage = summary?.accounts.find((item) => item.accountId === account.id);
    return {
      id: account.id,
      name: accountLabel(account),
      email: account.email ?? (account.name.includes("@") ? account.name : ""),
      color: account.color ?? "var(--accent)",
      usedPercent: Math.round((usage && activeLimit(usage).percent) ?? 0),
      isDefault: account.isDefault,
      expired: usage?.status === "expired" || usage?.status === "unauthenticated",
      tasks: tasksFor(account.id),
    };
  });
}

async function loadMachine(): Promise<Machine> {
  const [info, openAtLogin, agents, ides, terminals, shells] = await Promise.all([
    window.api.getAppInfo(),
    window.api.getOpenAtLogin(),
    window.api.detectAgents(),
    window.api.installedApps(IDE_APPS),
    window.api.installedApps(TERMINAL_APPS),
    window.api.listShells(),
  ]);
  const claude = agents.find((agent) => agent.slug === "claude-code" && agent.installed);
  const saved = (await window.api.getAgents()).find((agent) => agent.slug === "claude-code");
  const savedVersion = saved && (await window.api.getAgentVersion(saved.id));
  return {
    version: info.version,
    dataDir: info.dataDir,
    openAtLogin,
    claudeCode:
      saved && savedVersion
        ? { version: savedVersion, path: saved.command, agentId: saved.id }
        : claude?.command && saved
          ? { version: claude.version ?? "0.0.0", path: claude.command, agentId: saved.id }
          : null,
    claudeAgentId: saved?.id ?? null,
    ides,
    terminals,
    shells,
  };
}

const fileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

async function pickClaudeBinary(agentId: string): Promise<boolean> {
  const change = await window.api.pickAgentCommand(agentId).catch(() => null);
  if (!change) return false;
  if (!change.version) {
    notifyCompact({ tone: "red", title: `${fileName(change.command)} isn’t Claude Code` });
    return false;
  }
  notifyCompact({ tone: "green", title: `Using Claude Code v${change.version}` });
  return true;
}

export function AppSettings() {
  const prefs = usePreferencesStore((s) => s.prefs);
  const setPref = usePreferencesStore((s) => s.setPref);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const projects = useWorkspaceStore((s) => s.projects);
  const sessions = useWorkspaceStore((s) => s.sessions);
  const editProject = useAddProjectStore((s) => s.edit);
  const showAddProject = useAddProjectStore((s) => s.show);
  const showCloneProject = useAddProjectStore((s) => s.showClone);
  const showNewWorkspace = useNewWorkspaceStore((s) => s.show);
  const showRemoveWorkspace = useRemoveWorkspaceStore((s) => s.show);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const setWorkspaceLook = useWorkspaceStore((s) => s.setWorkspaceLook);
  const microphones = useDictationStore((s) => s.microphones);
  const languages = useDictationStore((s) => s.languages);
  const dictationPrefs = useDictationStore((s) => s.prefs);
  const loadDictation = useDictationStore((s) => s.load);
  const setMicrophone = useDictationStore((s) => s.setMicrophone);
  const setLanguage = useDictationStore((s) => s.setLanguage);
  const [machine, setMachine] = useState<Machine>(NO_MACHINE);
  const [saved, setSaved] = useState<AgentAccount[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [branches, setBranches] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [reauth, setReauth] = useState<ReauthTarget | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [upgrading, setUpgrading] = useState(false);
  const models = useAgentModels();
  const changeClaudePath = async (agentId: string) => {
    if (await pickClaudeBinary(agentId)) setMachine(await loadMachine());
  };

  const reloadAccounts = useCallback(() => {
    void window.api.getAgentAccounts().then(setSaved);
    void window.api.usage
      .getSummary()
      .then((next) => {
        setSummary(next);
        setNow(Date.now());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDictation();
    reloadAccounts();
    void loadMachine().then(setMachine);
  }, [loadDictation, reloadAccounts]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      projects.map(async (project) => {
        const branch = await window.api.detectBaseBranch(project.path).catch(() => "");
        return [project.id, branch] as const;
      }),
    ).then((entries) => !cancelled && setBranches(Object.fromEntries(entries)));
    return () => {
      cancelled = true;
    };
  }, [projects]);

  const openSessions = sessions.filter((session) => session.status !== "done");
  const settingsWorkspaces: SettingsWorkspace[] = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    color: workspace.color,
    image: workspaceImageUrl(workspace.customImage),
    icon: workspaceIcon(workspace.icon),
    projects: projects
      .filter((project) => project.workspaceId === workspace.id)
      .map((project) => ({
        id: project.id,
        name: project.name,
        path: project.path,
        branch: branches[project.id] || "—",
        tasks: openSessions.filter((session) => session.projectId === project.id).length,
      })),
  }));

  const data: SettingsData = {
    ...machine,
    models: models.map((option) => ({ value: option.id, label: option.name })),
    model: resolveModel(models, prefs.model)?.id ?? prefs.model,
    claudePathChangeable: Boolean(machine.claudeAgentId),
    claudeCode: machine.claudeCode && {
      version: machine.claudeCode.version,
      path: machine.claudeCode.path,
      compat: claudeCompat(machine.claudeCode.version),
      upgrading,
    },
    theme,
    showSidebar: !sidebarCollapsed,
    accounts: toAccounts(
      saved,
      summary,
      (accountId) => openSessions.filter((session) => session.accountId === accountId).length,
    ),
    workspaces: settingsWorkspaces,
    licenses: LICENSES,
    microphones: microphones.map((input) => ({ value: input.id, label: input.name })),
    languages: languages.map((language) => ({
      value: language.id,
      label: language.region ? `${language.name} · ${language.region}` : language.name,
    })),
    microphone: dictationPrefs.microphone,
    language: dictationPrefs.language,
    lastScan: summary ? relativeTime(new Date(summary.updatedAt).getTime(), now) : "never",
  };

  return (
    <>
      <SettingsPage
        values={prefs}
        data={data}
        className="w-full"
        actions={{
          onPreference: setPref,
          onOpenAtLogin: (openAtLogin) => {
            setMachine((current) => ({ ...current, openAtLogin }));
            void window.api.setOpenAtLogin(openAtLogin);
          },
          onTheme: setTheme,
          onShowSidebar: (show) => {
            if (show === sidebarCollapsed) toggleSidebar();
          },
          onMakeDefault: (accountId) =>
            void window.api.updateAgentAccount(accountId, { isDefault: true }).then(reloadAccounts),
          onShowProfile: (accountId) => {
            const account = saved.find((item) => item.id === accountId);
            if (account) void window.api.openInFinder(account.configDir);
          },
          onRenameAccount: (accountId, name) => {
            const account = saved.find((item) => item.id === accountId);
            const email = account?.email ?? (account?.name.includes("@") ? account.name : null);
            setSaved((list) =>
              list.map((item) => (item.id === accountId ? { ...item, name, email } : item)),
            );
            void window.api.updateAgentAccount(accountId, { name, email }).catch(() => {
              reloadAccounts();
              notifyCompact({ tone: "red", title: `Another account is already called ${name}` });
            });
          },
          onRemoveAccount: (accountId) =>
            void window.api.deleteAgentAccount(accountId).then(reloadAccounts),
          onAddAccount: () => setAdding(true),
          onSignInAgain: (accountId) => {
            const account = saved.find((item) => item.id === accountId);
            if (account) setReauth({ id: account.id, name: accountLabel(account) });
          },
          onOpenProject: editProject,
          onAddProject: showAddProject,
          onImportFromGitHub: (workspaceId) => showCloneProject(workspaceId, "github"),
          onAddWorkspace: () => {
            if (sidebarCollapsed) toggleSidebar();
            showNewWorkspace();
          },
          onRenameWorkspace: (workspaceId, name) => void renameWorkspace(workspaceId, name),
          onWorkspaceLookChange: (workspaceId, look) => void setWorkspaceLook(workspaceId, look),
          onRemoveWorkspace: showRemoveWorkspace,
          onChangeClaudePath: () => {
            const agentId = machine.claudeAgentId;
            if (agentId) void changeClaudePath(agentId);
          },
          onPlaySound: (sound) => void window.api.playSound(sound),
          onMicrophone: setMicrophone,
          onLanguage: setLanguage,
          onRescan: () => void window.api.usage.refresh().then(reloadAccounts),
          onUpgradeClaude: () => {
            const claude = machine.claudeCode;
            if (!claude) return;
            setUpgrading(true);
            void upgradeClaude(claude.agentId).then((version) => {
              setUpgrading(false);
              if (version) {
                setMachine((current) => ({
                  ...current,
                  claudeCode: current.claudeCode && { ...current.claudeCode, version },
                }));
              }
            });
          },
          onShowDataFolder: () => void window.api.openInFinder(machine.dataDir),
        }}
      />
      {adding && <AppAddAccount onClose={() => setAdding(false)} onAdded={reloadAccounts} />}
      {reauth && (
        <AppAddAccount
          key={reauth.id}
          reauth={reauth}
          onClose={() => setReauth(null)}
          onAdded={reloadAccounts}
        />
      )}
    </>
  );
}
