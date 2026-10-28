import { parseDiffFromFile } from "@pierre/diffs";
import type { ChangeStatus, ChangedFile } from "@/components/changes/diff-file";

const SESSION_BEFORE = `import { redirect } from "@/lib/http";
import { readSession } from "./store";

export async function completeLogin(req: Request) {
  const session = await readSession(req);
  return redirect("/");
}
`;

const SESSION_AFTER = `import { redirect } from "@/lib/http";
import { clearState, readSession } from "./store";

export async function completeLogin(req: Request) {
  const session = await readSession(req);
  const next = safeNext(session.state?.next);
  if (!next) return redirect("/");

  // keep the param through the OAuth round-trip
  return redirect(next, { headers: clearState() });
}

export function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}
`;

const SESSION_TEST = `import { describe, expect, it } from "vitest";
import { safeNext } from "./session";

describe("safeNext", () => {
  it("keeps same-origin paths", () => {
    expect(safeNext("/tasks/42")).toBe("/tasks/42");
  });

  it("drops protocol-relative urls", () => {
    expect(safeNext("//evil.com")).toBeNull();
  });
});
`;

const LOGIN_BEFORE = `export function Login({ params }: { params: URLSearchParams }) {
  const next = params.get("next");
  return <SignIn next={next} />;
}
`;

const LOGIN_AFTER = `import { safeNext } from "@/auth/session";

export function Login({ params }: { params: URLSearchParams }) {
  const next = safeNext(params.get("next") ?? undefined);
  return <SignIn next={next ?? "/"} />;
}
`;

const LOGOUT_BEFORE = `export async function logout(req: Request) {
  await endSession(req);
  return redirect(req.query.next);
}
`;

const LOGOUT_AFTER = `import { safeNext } from "@/auth/session";

export async function logout(req: Request) {
  await endSession(req);
  return redirect(safeNext(req.query.next) ?? "/");
}
`;

const URL_BEFORE = `export function isSameOrigin(url: URL, origin: string) {
  return url.origin === origin;
}
`;

const URL_AFTER = `export function isSameOrigin(url: URL, origin: string) {
  return url.origin === origin;
}

export function toPath(value: string) {
  try {
    const url = new URL(value, "http://nex.local");
    return url.origin === "http://nex.local" ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}
`;

const URL_TEST = `import { expect, it } from "vitest";
import { toPath } from "./url";

it("keeps relative paths", () => expect(toPath("/a?b=1")).toBe("/a?b=1"));
`;

function changed(path: string, before: string | null, after: string): ChangedFile {
  const diff = parseDiffFromFile(before === null ? null : { name: path, contents: before }, {
    name: path,
    contents: after,
  });
  const status: ChangeStatus = before === null ? "A" : "M";
  const added = diff.hunks.reduce((sum, hunk) => sum + hunk.additionLines, 0);
  const removed = diff.hunks.reduce((sum, hunk) => sum + hunk.deletionLines, 0);
  return { path, status, added, removed, diff };
}

export const CHANGED_FILES: ChangedFile[] = [
  changed("src/auth/session.ts", SESSION_BEFORE, SESSION_AFTER),
  changed("src/auth/session.test.ts", null, SESSION_TEST),
  changed("src/routes/login.tsx", LOGIN_BEFORE, LOGIN_AFTER),
  changed("src/routes/logout.tsx", LOGOUT_BEFORE, LOGOUT_AFTER),
  changed("src/lib/url.ts", URL_BEFORE, URL_AFTER),
  changed("src/lib/url.test.ts", null, URL_TEST),
];
