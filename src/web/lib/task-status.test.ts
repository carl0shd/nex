import { describe, expect, it } from "vite-plus/test";
import type { SidebarWorkspace } from "@/components/sidebar/types";
import { statusCounts, taskStatusItems } from "@/lib/task-status";

const WORKSPACES: SidebarWorkspace[] = [
  {
    id: "w",
    name: "Monoku",
    color: "#33843F",
    expanded: true,
    projects: [
      {
        id: "p1",
        name: "nex",
        tasks: [
          { id: "a", title: "Idle one", status: "idle", meta: "2h" },
          { id: "b", title: "Working one", status: "running", meta: "now" },
        ],
      },
      {
        id: "p2",
        name: "api",
        tasks: [{ id: "c", title: "Needs you", status: "waiting", meta: "needs you" }],
      },
    ],
  },
];

describe("taskStatusItems", () => {
  it("puts the tasks that need you first, then working, then idle", () => {
    expect(taskStatusItems(WORKSPACES).map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  it("keeps the project name and drops the age of a task that needs you", () => {
    const [waiting, working] = taskStatusItems(WORKSPACES);
    expect(waiting).toMatchObject({ project: "api", age: "" });
    expect(working).toMatchObject({ project: "nex", age: "now" });
  });
});

it("marks a task with a pending permission as needing you", () => {
  const items = taskStatusItems(WORKSPACES, new Set(["a"]));
  expect(items.find((item) => item.id === "a")).toMatchObject({ status: "waiting", age: "" });
});

describe("statusCounts", () => {
  it("counts each status", () => {
    expect(statusCounts(taskStatusItems(WORKSPACES))).toEqual({ working: 1, waiting: 1, idle: 1 });
  });
});
