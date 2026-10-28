import { useState } from "react";
import { SentAttachments, type Attachment } from "@/components/composer/attachments";
import { Composer } from "@/components/composer/composer";
import { DropOverlay } from "@/components/composer/drop-overlay";
import { CommandPill, FilePill, LinkPill } from "@/components/composer/inline-pill";
import { CommandPicker, FilePicker } from "@/components/composer/pickers";
import { Section, Specimen } from "@/components/design-system/specimen";
import { UserBubble } from "@/components/task/conversation";
import type { JSONContent } from "@tiptap/react";
import {
  commandPickerView,
  filePickerView,
  type SlashCommand,
  type WorktreeFile,
} from "@/lib/composer-pickers";

const WORKTREE_FILES: WorktreeFile[] = [
  { path: "src/routes/logout.tsx", status: "M" },
  { path: "src/auth/url.ts", status: "M" },
  { path: "src/auth/session.test.ts", status: "A" },
  { path: "src/routes/login.tsx", recent: true },
  { path: "src/auth/", recent: true },
  { path: "package.json", recent: true },
  { path: "src/auth/url.test.ts" },
  { path: "src/auth/session.ts" },
  { path: "src/auth/providers/github.ts" },
  { path: "src/lib/logger.ts" },
  { path: "docs/changelog.md" },
];

const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: "review",
    args: "[focus]",
    description: "Review the changes in this worktree",
    source: "project",
  },
  { name: "release-notes", description: "Draft release notes from merged PRs", source: "project" },
  {
    name: "fix-issue",
    args: "<ticket>",
    description: "Fix a Linear ticket end to end",
    source: "project",
  },
  { name: "standup", description: "Summarize what changed since yesterday", source: "personal" },
  {
    name: "compact",
    description: "Summarize the conversation to free context",
    source: "builtin",
  },
  { name: "init", description: "Write a CLAUDE.md for this project", source: "builtin" },
  {
    name: "frontend-design",
    description: "Build distinctive UI that avoids generic looks",
    source: "skill",
  },
];

const LINKS = [
  "https://linear.app/monoku/issue/NEX-123/fix-redirect-after-login",
  "https://github.com/monoku/nex/pull/128",
  "https://github.com/monoku/nex/issues/42",
  "https://github.com/monoku/nex/blob/main/src/auth/url.ts",
  "https://www.figma.com/design/k3J9/Nex-2?node-id=12-4",
  "https://acme.slack.com/archives/C04/p17",
  "https://www.notion.so/monoku/Auth-redesign-8f2c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
  "https://monoku.atlassian.net/browse/AUTH-77",
  "https://monoku.sentry.io/issues/4821/",
  "https://owasp.org/www-community/attacks/",
];

const TRAY: Attachment[] = [
  { id: "shot-1", kind: "image", name: "mobile.png" },
  { id: "shot-2", kind: "image", name: "design.png" },
  { id: "paste", kind: "text", name: "Pasted text", lines: 84, language: "log" },
  { id: "ci", kind: "file", name: "ci.yml", size: "2 KB" },
];

const WAITING_COMMAND: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "commandMention", attrs: { id: "review", label: "review", args: "[focus]" } },
        { type: "text", text: " " },
      ],
    },
  ],
};

function PickerDemo({ kind, query }: { kind: "file" | "command"; query: string }) {
  const [selected, setSelected] = useState(0);
  return kind === "file" ? (
    <FilePicker
      view={filePickerView(WORKTREE_FILES, query)}
      query={query}
      selected={selected}
      onSelect={() => {}}
      onHover={setSelected}
    />
  ) : (
    <CommandPicker
      view={commandPickerView(SLASH_COMMANDS, query)}
      query={query}
      selected={selected}
      onSelect={() => {}}
      onHover={setSelected}
    />
  );
}

export function RichInput() {
  return (
    <Section
      id="rich-input"
      title="Rich input"
      description="@ files and folders, / commands, pasted links, images, long text and dropped files."
    >
      <Specimen name="Composer · type @ or / , paste a link or 20+ lines, drop a file" bare>
        <div className="w-[600px] rounded-b-[22px] bg-surface pt-[460px] shadow-card">
          <Composer
            placeholder="Reply to Claude…"
            files={WORKTREE_FILES}
            commands={SLASH_COMMANDS}
            state="idle"
          />
        </div>
      </Specimen>
      <Specimen name="Pills">
        <span className="text-sm leading-6 text-ink">
          Same bug as <FilePill path="src/routes/logout.tsx" />, reuse the helper in{" "}
          <FilePill path="src/auth/" /> then run <CommandPill name="review" />
        </span>
      </Specimen>
      <Specimen name="LinkPill · read from the URL only" className="flex-col items-stretch gap-0">
        {LINKS.map((url) => (
          <div
            key={url}
            className="flex h-10 items-center gap-6 border-b border-line text-2xs last:border-0"
          >
            <span className="w-[420px] truncate font-mono text-ink-4">{url}</span>
            <LinkPill url={url} />
          </div>
        ))}
      </Specimen>
      <Specimen name="FilePicker · just typed @ · @log · inside a folder" className="items-end">
        <PickerDemo kind="file" query="" />
        <PickerDemo kind="file" query="log" />
        <PickerDemo kind="file" query="src/auth/" />
      </Specimen>
      <Specimen name="CommandPicker · just typed / · /re" className="items-end">
        <PickerDemo kind="command" query="" />
        <PickerDemo kind="command" query="re" />
      </Specimen>
      <Specimen name="Composer · attachments · command waiting for its argument" bare>
        <div className="flex w-[600px] flex-col gap-4">
          <div className="rounded-b-[22px] bg-surface pt-2 shadow-card">
            <Composer
              placeholder="Reply to Claude…"
              defaultAttachments={TRAY}
              files={WORKTREE_FILES}
              commands={SLASH_COMMANDS}
              state="idle"
            />
          </div>
          <div className="rounded-b-[22px] bg-surface pt-2 shadow-card">
            <Composer
              placeholder="Reply to Claude…"
              defaultContent={WAITING_COMMAND}
              files={WORKTREE_FILES}
              commands={SLASH_COMMANDS}
              state="idle"
            />
          </div>
        </div>
      </Specimen>
      <div className="grid grid-cols-2 gap-6">
        <Specimen name="Sent message" className="flex-col items-end">
          <SentAttachments attachments={TRAY.slice(0, 2)} />
          <UserBubble>The button is misaligned on mobile, match the design</UserBubble>
          <UserBubble>
            Pick up <LinkPill url={LINKS[0]} />, the PR is <LinkPill url={LINKS[1]} />
          </UserBubble>
        </Specimen>
        <Specimen name="DropOverlay · dragging files over the task" bare>
          <div className="relative flex h-[260px] w-full flex-col justify-end rounded-card bg-surface p-4 shadow-card">
            <span className="text-sm text-ink-3">Done. Login and logout share safeNext now.</span>
            <DropOverlay images={2} files={1} />
          </div>
        </Specimen>
      </div>
    </Section>
  );
}
