import type { Agent, AgentAccount, Project, Session, Terminal, Workspace } from "@native/db/types";
import type { PermissionRequest } from "@native/agents/permissions";
import type { TaskEnvService, TaskEnvState, EnvironmentStatus } from "@native/environments/types";
import type { UsageSummary, UsageTotals } from "@native/usage/types";
import { TESTED_CLAUDE_VERSION } from "@/lib/claude-version";
import { APPLE_PAY, CART_TOTALS, ONBOARDING_EMAILS, RATE_LIMIT } from "@/demo/demo-transcripts";

type NexAPI = Window["api"];

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

const workspace: Workspace = {
  id: "w-acme",
  name: "Acme",
  color: "#33843F",
  icon: "letter",
  customImage: null,
  sortOrder: 0,
  archived: false,
  collapsed: false,
  createdAt: iso(60 * 24 * 30),
};

const project = (id: string, name: string, sortOrder: number): Project => ({
  id,
  workspaceId: workspace.id,
  name,
  path: `/demo/${name}`,
  branchPrefix: "",
  baseBranch: "main",
  pullBase: true,
  setup: null,
  environment: null,
  quickCommands: [],
  sortOrder,
  createdAt: iso(60 * 24 * 30),
});

const projects = [project("p-store", "storefront", 0), project("p-api", "api", 1)];

const session = (
  id: string,
  projectId: string,
  title: string,
  branch: string,
  minutesAgo: number,
  sortOrder: number,
): Session => ({
  id,
  projectId,
  agentId: "a-claude",
  accountId: "acc-work",
  name: branch,
  title,
  branch,
  baseBranch: "main",
  worktreePath: `/demo/worktrees/${branch}`,
  notesPath: "",
  symlinks: [],
  status: "active",
  opens: 3,
  createdAt: iso(minutesAgo),
  lastOpened: iso(minutesAgo),
  diffVisible: false,
  notesVisible: false,
  verticalLayout: null,
  horizontalLayout: null,
  sortOrder,
  width: 600,
  envSlug: branch,
  envOff: false,
});

const sessions = [
  session("s-pay", "p-store", "Add Apple Pay to checkout", "apple-pay", 14, 0),
  session("s-cart", "p-store", "Fix the flaky cart totals test", "cart-totals", 26, 1),
  session("s-rate", "p-api", "Rate limit the public API", "rate-limit", 58, 2),
  session("s-mail", "p-api", "Welcome email on sign up", "welcome-email", 95, 3),
];

const terminal = (sessionId: string, status: Terminal["status"]): Terminal => ({
  id: `t-${sessionId}`,
  sessionId,
  name: "Claude",
  command: "claude",
  args: [],
  cwd: sessions.find((item) => item.id === sessionId)?.worktreePath ?? "",
  env: {},
  isPrimary: true,
  sortOrder: 0,
  status,
  type: "agent",
  runCommand: null,
  agentSessionId: `claude-${sessionId}`,
  createdAt: iso(60),
});

const terminals = [
  terminal("s-pay", "running"),
  terminal("s-cart", "waiting"),
  terminal("s-rate", "idle"),
  terminal("s-mail", "idle"),
];

const transcripts: Record<string, unknown[]> = {
  "t-s-pay": APPLE_PAY,
  "t-s-cart": CART_TOTALS,
  "t-s-rate": RATE_LIMIT,
  "t-s-mail": ONBOARDING_EMAILS,
};

const agent: Agent = {
  id: "a-claude",
  name: "Claude Code",
  slug: "claude-code",
  command: "claude",
  defaultConfigDir: "~/.claude",
  configEnvVar: "CLAUDE_CONFIG_DIR",
  args: [],
  resumeArgs: [],
  skipPermissionsArgs: [],
  builtin: true,
  createdAt: iso(60 * 24 * 30),
};

const account: AgentAccount = {
  id: "acc-work",
  agentId: agent.id,
  name: "Work",
  configDir: "~/.claude",
  isDefault: true,
  keychainService: null,
  email: null,
  color: null,
  createdAt: iso(60 * 24 * 30),
};

const permission: PermissionRequest = {
  id: "perm-cart",
  sessionId: "s-cart",
  tool: "Bash",
  input: {
    command: "pnpm vitest run src/cart --repeat 50",
    description: "Run the cart tests 50 times",
  },
  canRemember: true,
  at: iso(1),
};

const diffs: Record<string, string> = {
  "s-pay": `diff --git a/src/checkout/payment-form.tsx b/src/checkout/payment-form.tsx
--- a/src/checkout/payment-form.tsx
+++ b/src/checkout/payment-form.tsx
@@ -41,4 +41,8 @@
   return (
     <form onSubmit={submit} className={styles.form}>
+      {paymentRequest && (
+        <PaymentRequestButtonElement options={{ paymentRequest }} />
+      )}
+      {paymentRequest && <Divider label="Or pay with card" />}
       <CardElement options={cardOptions} />
diff --git a/src/checkout/use-payment-request.ts b/src/checkout/use-payment-request.ts
new file mode 100644
--- /dev/null
+++ b/src/checkout/use-payment-request.ts
@@ -0,0 +1,3 @@
+export function usePaymentRequest(total: number) {
+  return useStripePaymentRequest({ country: "US", currency: "usd", total });
+}
`,
  "s-cart": `diff --git a/src/cart/totals.ts b/src/cart/totals.ts
--- a/src/cart/totals.ts
+++ b/src/cart/totals.ts
@@ -12,3 +12,3 @@
 export function lineTotal(line: CartLine) {
-  return Number((line.price * line.quantity).toFixed(2));
+  return line.priceCents * line.quantity;
 }
`,
  "s-rate": `diff --git a/src/middleware/rate-limit.ts b/src/middleware/rate-limit.ts
new file mode 100644
--- /dev/null
+++ b/src/middleware/rate-limit.ts
@@ -0,0 +1,4 @@
+export const rateLimit = slidingWindow({
+  limit: 100,
+  windowMs: 60_000,
+});
`,
  "s-mail": "",
};

const service = (
  slug: string,
  name: string,
  port: number,
  main: boolean,
  opens: boolean,
): TaskEnvService => ({
  name,
  state: "ready",
  address: opens ? (main ? `${slug}.nex` : `${name}.${slug}.nex`) : null,
  url: opens ? `http://${main ? slug : `${name}.${slug}`}.nex` : null,
  localhostUrl: opens ? `http://${main ? slug : `${name}.${slug}`}.localhost` : null,
  localPort: opens ? port : null,
  main,
  ports: [port],
});

const envState = (sessionId: string, projectId: string, slug: string): TaskEnvState => ({
  sessionId,
  projectId,
  slug,
  status: "running",
  services:
    projectId === "p-store"
      ? [service(slug, "web", 5173, true, true), service(slug, "db", 5432, false, false)]
      : [
          service(slug, "api", 8000, true, true),
          service(slug, "db", 5432, false, false),
          service(slug, "redis", 6379, false, false),
          service(slug, "mailpit", 8025, false, true),
        ],
  steps: [],
  memoryMb: 1536,
  usedGb: 1.2,
  lastActiveAt: now,
  idle: false,
  startedAt: now - 20 * 60_000,
  readyMs: 18_400,
});

const taskEnvironments = sessions.map((item) => envState(item.id, item.projectId, item.envSlug));

const environmentStatus: EnvironmentStatus = {
  supported: true,
  reasonUnsupported: null,
  macos: "26.1",
  hostMemoryGb: 36,
  memoryChoices: [4, 6, 8, 12, 16],
  enabled: true,
  runtime: {
    installed: true,
    version: "1.7.1",
    path: "/usr/local/bin/container",
    compatible: true,
    installedByNex: true,
    running: true,
  },
  dns: { domain: "nex", registered: true },
  blockedPorts: [],
  usage: { containers: 10, running: 10, usedGb: 4.8 },
  setup: null,
};

const totals = (costUsd: number): UsageTotals => ({
  costUsd,
  tokens: {
    input: Math.round(costUsd * 9_000),
    output: Math.round(costUsd * 2_400),
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    cacheRead: Math.round(costUsd * 60_000),
    webSearches: 0,
  },
});

const TREND = [18.4, 22.1, 9.6, 0, 26.3, 31.2, 24.8, 19.5, 28.7, 33.4, 12.2, 0, 27.9, 36.81];

const usageSummary: UsageSummary = {
  today: { total: totals(36.81), inNex: totals(31.42), outsideNex: totals(5.39) },
  trend: TREND.map((costUsd, index) => ({
    day: new Date(now - (TREND.length - 1 - index) * 86_400_000).toISOString().slice(0, 10),
    costUsd,
    tokens: Math.round(costUsd * 70_000),
  })),
  sessions: sessions.map((item, index) => ({
    sessionId: item.id,
    accountId: account.id,
    name: item.title,
    branch: item.branch,
    projectName: projects.find((entry) => entry.id === item.projectId)?.name ?? "",
    workspaceColor: workspace.color,
    status: item.status,
    totals: totals([12.6, 8.9, 6.3, 3.6][index] ?? 0),
  })),
  accounts: [
    {
      accountId: account.id,
      accountName: account.name,
      isDefault: true,
      status: "ok",
      subscriptionType: "max",
      fiveHourPercent: 42,
      fiveHourResetsAt: new Date(now + 2 * 3_600_000 + 18 * 60_000).toISOString(),
      sevenDayPercent: 31,
      sevenDayResetsAt: new Date(now + 4 * 86_400_000).toISOString(),
      limits: [],
      todayCostUsd: 36.81,
      spend: {
        today: { total: totals(36.81), inNex: totals(31.42), outsideNex: totals(5.39) },
        trend: [],
      },
    },
  ],
  worstPercent: 42,
  worstAccountName: account.name,
  updatedAt: new Date(now).toISOString(),
};

const SETTINGS: Record<string, unknown> = {
  "app-prefs": { theme: "dark", sidebarCollapsed: false, onboarded: true, addAgentHint: false },
};

const unsubscribe = () => () => {};

const overrides: Partial<NexAPI> = {
  getWorkspaces: async () => [workspace],
  getProjects: async () => projects,
  getSessions: async () => sessions,
  getActiveSessions: async () => sessions,
  getTerminals: async () => terminals,
  getTerminalsBySession: async (sessionId) =>
    terminals.filter((item) => item.sessionId === sessionId),
  getAgents: async () => [agent],
  getAgentAccounts: async () => [account],
  getAgentVersion: async () => TESTED_CLAUDE_VERSION,
  detectAgents: async () => [],
  getSetting: async <T>(key: string, fallback: T) => (SETTINGS[key] as T | undefined) ?? fallback,
  getAppInfo: async () => ({
    platform: "darwin",
    version: "1.0.0",
    dataDir: "",
    versions: { electron: "", chrome: "", node: "" },
  }),
  getOpenAtLogin: async () => false,
  listShells: async () => [],
  installedApps: async () => [],
  isGitRepo: async () => true,
  listBranches: async () => ["main", "develop"],
  listWorktreeFiles: async () => [],
  listClaudeSessions: async () => [],
  readSessionNotes: async () => "",
  getWorktreeDiff: async (worktreePath) =>
    diffs[sessions.find((item) => item.worktreePath === worktreePath)?.id ?? ""] ?? "",
  readWorktreeFileVersions: async () => ({ oldContents: null, newContents: null }),
  countUncommitted: async () => 0,
  agentStates: async () => ({ "s-pay": "running", "s-cart": "running" }),
  getAgentSettings: async () => ({ model: "opus-5-5", effort: "high", mode: "manual" }),
  agentModels: async () => [],
  agentCommands: async () => [],
  agentContext: async () => null,
  lastAgentContext: async () => null,
  mcpStatus: async () => [],
  getBackgroundCommands: async () => ({}),
  getAgentTasks: async () => ({}),
  readSubagentTranscript: async () => [],
  getPendingPermissions: async () => [permission],
  readTranscript: async (terminalId, cursor) => ({
    path: "demo",
    offset: 1,
    reset: cursor === null,
    entries: cursor === null ? (transcripts[terminalId] ?? []) : [],
  }),
  getTerminalRuntimes: async () => ({}),
  ptyGetSnapshot: async () => null,
  ptyEnsure: async () => true,
  getEnvironmentStatus: async () => environmentStatus,
  getTaskEnvironments: async () => taskEnvironments,
  getTaskEnvironmentSize: async () => null,
  getEnvironmentCheck: async () => null,
  getProjectEnvironment: async () => null,
  pathForFile: () => "",
  setZoomFactor: () => {},
  ptyWrite: () => {},
  ptyResize: () => {},
  speech: {
    available: async () => ({ available: false }),
    listDevices: async () => [],
    listLocales: async () => [],
    requestAuth: async () => ({ authorized: false, status: "denied" }),
    start: async () => {},
    stop: async () => {},
    cancel: async () => {},
    onEvent: unsubscribe,
  },
  usage: {
    getSummary: async () => usageSummary,
    getStats: async (granularity) => ({
      granularity,
      buckets: usageSummary.trend.map((day) => ({
        startDay: day.day,
        endDay: day.day,
        costUsd: day.costUsd,
        inNexCostUsd: day.costUsd * 0.85,
        tokens: day.tokens,
      })),
      byModel: [{ model: "claude-opus-5-5", costUsd: 311.2, tokens: 21_800_000 }],
      byAccount: [
        { accountId: account.id, accountName: account.name, costUsd: 311.2, tokens: 21_800_000 },
      ],
      sessions: usageSummary.sessions,
      total: totals(311.2),
      inNexCostUsd: 264.5,
      rangeStartDay: usageSummary.trend[0]?.day ?? "",
      rangeEndDay: usageSummary.trend.at(-1)?.day ?? "",
      historyStartDay: usageSummary.trend[0]?.day ?? null,
    }),
    refresh: async () => {},
    watchStart: async () => {},
    watchStop: async () => {},
    onChanged: unsubscribe,
  },
};

const subscribes = (name: string) => /^(on|watch)[A-Z]/.test(name);

export function installDemoApi(): void {
  window.api = new Proxy(overrides as NexAPI, {
    get(target, name) {
      if (typeof name !== "string") return undefined;
      if (name in target) return target[name as keyof NexAPI];
      return subscribes(name) ? unsubscribe : async () => undefined;
    },
  });
}
