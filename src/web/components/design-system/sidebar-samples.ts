import type { SidebarWorkspace } from "@/components/sidebar/types";

const MONOKU = "#33843F";
const PERSONAL = "#6b21a8";

export const WORKSPACES: SidebarWorkspace[] = [
  {
    id: "monoku",
    name: "Monoku",
    color: MONOKU,
    expanded: true,
    projects: [
      {
        name: "nex",
        tasks: [
          {
            id: "fix-login-redirect",
            title: "Fix login redirect param",
            status: "running",
            meta: "12m",
          },
          { id: "usage-panel", title: "Usage panel charts", status: "running", meta: "41m" },
          { id: "bump-electron", title: "Bump Electron to 39.2", status: "idle", meta: "1d" },
        ],
      },
      {
        name: "api",
        tasks: [
          {
            id: "migrate-db-schema",
            title: "Rename users to accounts",
            status: "waiting",
            meta: "needs you",
          },
        ],
      },
      {
        name: "website",
        tasks: [
          { id: "onboarding-copy", title: "Onboarding copy pass", status: "running", meta: "5m" },
          { id: "landing-hero", title: "New landing hero", status: "idle", meta: "2h" },
        ],
      },
    ],
  },
  {
    id: "personal",
    name: "Personal",
    color: PERSONAL,
    expanded: false,
    projects: [{ name: "dotfiles", tasks: [] }],
  },
];
