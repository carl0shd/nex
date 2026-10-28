import type { ReactNode } from "react";
import {
  Cpu,
  EditPencil,
  Eye,
  Folder,
  GitCommit,
  Globe,
  MediaImage,
  Page,
  Prohibition,
  Refresh,
  Search,
  Slash,
  Sparks,
  Terminal,
  WarningTriangle,
} from "iconoir-react";
import { InlineCode } from "@/components/atoms/inline-code";
import {
  ParallelAgents,
  PlanApproval,
  PullRequestCard,
  SubagentCard,
  SystemDivider,
  SystemRow,
  TodoPlan,
  TurnSummary,
  UsageLimitCard,
} from "@/components/task/block-cards";
import { LogoTile } from "@/components/atoms/logo-tile";
import {
  BlockNote,
  BlockRow,
  BlockTag,
  DiffLines,
  FileList,
  GrepMatches,
  ImagePreview,
  LiveOutput,
  OutputLines,
  WebResults,
} from "@/components/task/blocks";
import {
  ContextMeter,
  QueuedMessage,
  ResponseActions,
  StreamingParagraph,
  ThinkingLine,
  ThoughtToggle,
} from "@/components/task/agent-flow";
import { AgentText, UserBubble } from "@/components/task/conversation";
import {
  CodeBlock,
  MdCallout,
  MdDivider,
  MdHeading,
  MdLink,
  MdList,
  MdParagraph,
  MdStrong,
  MdTable,
} from "@/components/task/markdown";
import { QuestionCard } from "@/components/task/question-card";
import { PermissionCard } from "@/components/task/permission-card";
import { Section } from "@/components/design-system/specimen";
import { StatusDot } from "@/components/atoms/status-dot";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold text-ink">{title}</span>
        <span className="text-xs text-ink-4">{description}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-card bg-surface px-5 pt-1 pb-5 shadow-[0_0_0_1px_rgb(236_235_230/5%)]">
        {children}
      </div>
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span className="mt-4 mb-0.5 block text-2xs text-ink-4">{children}</span>;
}

function SmallAction({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="interactive press flex size-6 cursor-pointer items-center justify-center rounded-chip text-ink-3 select-none hover:bg-hover hover:text-ink-2"
    >
      {children}
    </button>
  );
}

function FilesPanel() {
  return (
    <Panel
      title="Archivos"
      description="Read, Write y Edit. Todo colapsa a una fila; lo que importa se abre."
    >
      <Caption>Read · colapsado, es lo normal</Caption>
      <BlockRow icon={Eye} verb="Read" target="src/routes/logout.tsx" meta="38 lines" />
      <Caption>Read · rango de líneas</Caption>
      <BlockRow
        icon={Eye}
        verb="Read"
        target="src/auth/url.ts"
        tags={<BlockTag mono>L40–88</BlockTag>}
        meta="48 lines"
      />
      <Caption>Read · lecturas seguidas se agrupan en una fila</Caption>
      <BlockRow icon={Eye} verb="Read" target="5 files" meta="412 lines" chevron="down" />
      <FileList
        files={[
          { path: "src/auth/url.ts", meta: "88" },
          { path: "src/auth/session.ts", meta: "131" },
          { path: "src/routes/login.tsx", meta: "64" },
          { path: "src/routes/logout.tsx", meta: "38" },
          { path: "src/oauth/callback.ts", meta: "91" },
        ]}
      />
      <Caption>Read · imagen, con miniatura</Caption>
      <BlockRow
        icon={MediaImage}
        verb="Read"
        target="design/login.png"
        meta="1440×900"
        chevron="down"
      />
      <ImagePreview />
      <Caption>Write · archivo nuevo</Caption>
      <BlockRow
        icon={Page}
        verb="Write"
        target="src/auth/session.test.ts"
        tags={<BlockTag tone="new">new</BlockTag>}
        diff={{ added: 61 }}
        chevron="right"
      />
      <Caption>Edit · diff abierto con números de línea</Caption>
      <BlockRow
        icon={EditPencil}
        verb="Edit"
        target="src/routes/logout.tsx"
        diff={{ added: 2, removed: 1 }}
        chevron="down"
      />
      <DiffLines
        lines={[
          { n: 11, sign: " ", code: "export function logout(req) {" },
          { n: 12, sign: "-", code: "  return redirect(req.query.next);" },
          { n: 12, sign: "+", code: "  const next = safeNext(req.query.next);" },
          { n: 13, sign: "+", code: "  return redirect(next ?? '/');" },
          { n: 14, sign: " ", code: "}" },
        ]}
      />
      <Caption>Edit · varios cambios en un archivo</Caption>
      <BlockRow
        icon={EditPencil}
        verb="Edit"
        target="src/auth/url.ts"
        tags={<BlockTag>3 edits</BlockTag>}
        diff={{ added: 14, removed: 6 }}
        chevron="right"
      />
      <Caption>Edit · notebook</Caption>
      <BlockRow
        icon={EditPencil}
        verb="Edit"
        target="analysis.ipynb"
        tags={<BlockTag>cell 4</BlockTag>}
        diff={{ added: 6, removed: 2 }}
        chevron="right"
      />
    </Panel>
  );
}

function TerminalPanel() {
  return (
    <Panel
      title="Terminal y git"
      description="Comandos vivos, terminados, fallidos, largos y en segundo plano."
    >
      <Caption>Bash · corriendo, la salida asoma en vivo</Caption>
      <BlockRow running verb="Running" target="yarn test src/auth" meta="12s" />
      <LiveOutput
        lines={[
          " ✓ src/auth/url.test.ts (4)",
          " ✓ src/auth/session.test.ts (6)",
          " ❯ src/routes/logout.test.ts (2)",
        ]}
      />
      <Caption>Bash · terminó bien</Caption>
      <BlockRow
        icon={Terminal}
        verb="Run"
        target="yarn test src/auth"
        meta="✓ 6 passed · 3.2s"
        metaTone="green"
        chevron="right"
      />
      <Caption>Bash · falló, se abre solo</Caption>
      <BlockRow
        icon={Terminal}
        tone="red"
        verb="Run"
        target="yarn typecheck"
        meta="exit 2 · 4.1s"
        metaTone="red"
        chevron="down"
      />
      <OutputLines
        lines={[
          { text: "src/auth/url.ts:42:7 - error TS2322: Type 'string | undefined'", tone: "red" },
          { text: "  is not assignable to type 'string'.", tone: "red" },
          { text: "Found 1 error in src/auth/url.ts:42" },
        ]}
      />
      <Caption>Bash · salida larga, recortada</Caption>
      <BlockRow
        icon={Terminal}
        verb="Run"
        target="yarn build"
        meta="✓ 18.4s"
        metaTone="green"
        chevron="down"
      />
      <OutputLines
        lines={[
          { text: "vite v7.1.2 building for production..." },
          { text: "✓ 1284 modules transformed." },
          { text: "dist/index.html            0.46 kB" },
          { text: "dist/assets/index.js   412.80 kB │ gzip: 131.2 kB" },
        ]}
        more={{ hidden: 214 }}
      />
      <Caption>Bash · con descripción del agente</Caption>
      <BlockRow
        icon={Terminal}
        verb="Run"
        target="Check which routes import safeNext"
        prose
        meta="0.2s"
      />
      <BlockNote mono>grep -rl "safeNext" src/routes</BlockNote>
      <Caption>Bash · en segundo plano, también aparece en quick commands</Caption>
      <BlockRow
        icon={Terminal}
        verb="Started"
        target="yarn dev"
        tags={
          <BlockTag mono>
            <StatusDot tone="green" />
            :5173
          </BlockTag>
        }
        meta="background"
        actions={
          <>
            <SmallAction label="Open terminal">
              <Terminal width={12} height={12} strokeWidth={2} />
            </SmallAction>
            <SmallAction label="Stop">
              <span className="size-[7px] rounded-[2px] bg-current" />
            </SmallAction>
          </>
        }
      />
      <Caption>Git · commit</Caption>
      <BlockRow
        icon={GitCommit}
        verb="Commit"
        target="Use safeNext in logout"
        prose
        tags={<BlockTag mono>a3f9c21</BlockTag>}
        meta="3 files"
      />
      <Caption>Git · PR abierto</Caption>
      <PullRequestCard
        title="Use safeNext for login and logout redirects"
        number={128}
        branch="feat/fix-login-redirect"
        files={3}
        diff={{ added: 42, removed: 6 }}
      />
    </Panel>
  );
}

function SearchPanel() {
  return (
    <Panel
      title="Búsqueda, web y extensiones"
      description="Grep, Glob, web, MCP, skills y comandos."
    >
      <Caption>Grep · coincidencias con el término resaltado</Caption>
      <BlockRow
        icon={Search}
        verb="Search"
        target="safeNext"
        aside="in src/"
        meta="4 matches · 3 files"
        chevron="down"
      />
      <GrepMatches
        term="safeNext"
        matches={[
          { location: "auth/url.ts:12", line: "export function safeNext(raw?: string)" },
          { location: "routes/login.tsx:8", line: "import { safeNext } from '@/auth/url'" },
          { location: "routes/login.tsx:31", line: "const next = safeNext(state.next)" },
          { location: "auth/url.test.ts:4", line: "describe('safeNext', () => {" },
        ]}
      />
      <Caption>Glob · lista de archivos</Caption>
      <BlockRow icon={Folder} verb="Find" target="**/*.test.ts" meta="12 files" chevron="right" />
      <Caption>Sin resultados</Caption>
      <BlockRow icon={Search} verb="Search" target="users_old" aside="in src/" meta="no matches" />
      <Caption>WebFetch · dominio y título de la página</Caption>
      <BlockRow
        lead={
          <LogoTile size="xs" color="var(--ink)" ink="var(--inverse)">
            N
          </LogoTile>
        }
        verb="Fetch"
        target="nextjs.org"
        aside="Redirecting · Next.js docs"
        meta="1.2s"
      />
      <Caption>WebSearch · resultados</Caption>
      <BlockRow
        icon={Globe}
        verb="Search the web"
        target="oauth state param open redirect"
        prose
        meta="8 results"
        chevron="down"
      />
      <WebResults
        results={[
          { letter: "O", title: "Preventing open redirects in OAuth flows", domain: "owasp.org" },
          { letter: "A", title: "state parameter · OAuth 2.0 Security BCP", domain: "auth0.com" },
          {
            letter: "S",
            title: "Validate redirect URLs before following them",
            domain: "stackoverflow.com",
          },
        ]}
      />
      <Caption>MCP · logo del servidor y la herramienta</Caption>
      <BlockRow
        lead={
          <LogoTile size="xs" color="#5e6ad2">
            L
          </LogoTile>
        }
        verb="Linear"
        target="get_issue NEX-142"
        meta="Fix redirect after login"
      />
      <Caption>MCP · trabajando</Caption>
      <BlockRow running verb="Figma" target="get_design_context" meta="3s" />
      <Caption>Skill</Caption>
      <BlockRow icon={Sparks} tone="accent" verb="Using skill" target="frontend-design" prose />
      <Caption>Comando /</Caption>
      <BlockRow icon={Slash} verb="Ran" target="/review" meta="from .claude/commands" />
    </Panel>
  );
}

function CoordinationPanel() {
  return (
    <Panel title="Coordinación" description="Plan de tareas, subagentes, plan mode y preguntas.">
      <Caption>Plan de tareas · se actualiza en su lugar, no se repite</Caption>
      <TodoPlan
        items={[
          { label: "Find every place that builds a redirect", state: "done" },
          { label: "Add safeNext to the login route", state: "done" },
          { label: "Switch logout to safeNext", state: "active" },
          { label: "Add a test for // and absolute urls", state: "todo" },
          { label: "Run the auth test suite", state: "todo" },
        ]}
      />
      <Caption>Subagente · trabajando, con sus herramientas adentro</Caption>
      <SubagentCard
        name="Explore"
        task="Find every place that builds a redirect"
        meta="8 tools · 21s"
        steps={[
          { icon: Search, verb: "Search", target: "redirect(" },
          { icon: Eye, verb: "Read", target: "src/oauth/callback.ts", running: true },
        ]}
      />
      <Caption>Subagente · terminado, se pliega con su resultado</Caption>
      <BlockRow
        icon={Cpu}
        verb="Explore"
        target="Find every place that builds a redirect"
        prose
        meta="14 tools · 41s"
        chevron="right"
      />
      <BlockNote>Found 3: login.tsx, logout.tsx and oauth/callback.ts</BlockNote>
      <Caption>Varios subagentes en paralelo</Caption>
      <BlockRow
        icon={Cpu}
        verb="3 agents"
        target={<span className="text-ink-4">in parallel</span>}
        prose
        meta="1 of 3 done"
        chevron="down"
      />
      <ParallelAgents
        agents={[
          { name: "Explore", task: "Map the auth routes", meta: "41s", done: true },
          { name: "Explore", task: "Find redirect helpers in api/", meta: "18s", done: false },
          { name: "Review", task: "Check tests for open redirects", meta: "12s", done: false },
        ]}
      />
      <Caption>Plan para aprobar</Caption>
      <PlanApproval
        title="Share redirect validation across auth routes"
        steps={[
          "Move safeNext into src/auth/url.ts and export it",
          "Use it in login, logout and the OAuth callback",
          "Add tests for //, absolute urls and missing next",
        ]}
      />
      <Caption>El agente te pregunta</Caption>
      <QuestionCard
        question="Where should logout go when next is missing?"
        value="home"
        onChange={() => {}}
        options={[
          { value: "home", label: "Home", hint: "Same as login today · recommended" },
          { value: "login", label: "Login page", hint: "Ask them to sign in again" },
          { value: "previous", label: "Previous page", hint: "Uses the referrer when it is ours" },
        ]}
      />
    </Panel>
  );
}

function SystemPanel() {
  return (
    <Panel title="Sistema" description="Permisos, errores, hooks, límites y cierre del turno.">
      <Caption>Pide permiso</Caption>
      <PermissionCard title="Claude wants to edit a protected file" subject=".env.local" />
      <Caption>La herramienta falló y el agente reintenta</Caption>
      <BlockRow
        icon={WarningTriangle}
        tone="red"
        verb="Edit"
        target="src/auth/url.ts"
        meta="text to replace not found"
        metaTone="red"
      />
      <BlockRow
        icon={EditPencil}
        verb="Edit"
        target="src/auth/url.ts"
        diff={{ added: 3, removed: 1 }}
        chevron="right"
      />
      <Caption>Lo rechazaste</Caption>
      <BlockRow
        icon={Prohibition}
        tone="muted"
        verbMuted
        verb="Denied"
        target="psql … DROP TABLE users_old"
        meta="by you"
      />
      <Caption>Interrumpido</Caption>
      <SystemDivider>Interrupted by you</SystemDivider>
      <Caption>Hook del proyecto bloqueó algo</Caption>
      <BlockRow
        icon={WarningTriangle}
        tone="orange"
        verb="Hook"
        target="pre-commit · lint failed"
        meta="blocked commit"
        metaTone="orange"
        chevron="down"
      />
      <OutputLines
        lines={[
          { text: "src/routes/logout.tsx", tone: "orange" },
          { text: "  14:9  error  'next' is never reassigned  prefer-const" },
        ]}
      />
      <Caption>Contexto compactado</Caption>
      <SystemDivider>
        Context compacted · 182k → 24k tokens<span className="text-ink-3">· View summary</span>
      </SystemDivider>
      <Caption>Reintentando la API</Caption>
      <BlockRow
        lead={<Refresh width={12} height={12} strokeWidth={2} className="animate-spin" />}
        tone="orange"
        verb="Retrying"
        target="API overloaded"
        prose
        meta="in 8s · attempt 2 of 10"
      />
      <Caption>Límite de uso</Caption>
      <UsageLimitCard
        resets="6:00 PM"
        account="Personal"
        body="Claude stopped after reading logout.tsx. Pick it up on another account or wait for the reset."
      />
      <Caption>Resumen al terminar el turno</Caption>
      <TurnSummary files={3} diff={{ added: 42, removed: 6 }} />
    </Panel>
  );
}

export function AgentBlocks() {
  return (
    <Section
      id="agent-blocks"
      title="Agent blocks"
      description="Everything Claude does in the conversation. Every block collapses to one row; what matters opens."
    >
      <div className="grid grid-cols-2 items-start gap-8">
        <FilesPanel />
        <TerminalPanel />
        <SearchPanel />
        <CoordinationPanel />
        <SystemPanel />
      </div>
    </Section>
  );
}

function FlowCard({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs text-ink-3">{caption}</span>
      <div className="flex flex-col gap-3 rounded-card bg-surface p-[18px] shadow-task">
        {children}
      </div>
    </div>
  );
}

export function ConversationFlow() {
  return (
    <Section
      id="flow"
      title="Conversation flow"
      description="Thinking, streaming, queued messages, interrupts, context and session states."
    >
      <div className="grid grid-cols-2 items-start gap-8">
        <FlowCard caption="Pensando: orbit, segundos y esc para interrumpir">
          <UserBubble>Logout has the same problem, can you fix it too?</UserBubble>
          <ThinkingLine seconds={4} />
        </FlowCard>
        <FlowCard caption="Llega la respuesta: el pensamiento se pliega y el texto aparece con caret de bloque">
          <UserBubble>Logout has the same problem, can you fix it too?</UserBubble>
          <ThoughtToggle seconds={12} />
          <StreamingParagraph>
            Same hole: logout builds the redirect from the raw query param. I’ll switch it to
          </StreamingParagraph>
        </FlowCard>
        <FlowCard caption="En cola: tu próximo mensaje al final, atenuado; “Send now” interrumpe a Claude">
          <UserBubble>Fix the redirect in logout too</UserBubble>
          <AgentText>
            Same hole as login. Switching it to <InlineCode>safeNext</InlineCode>.
          </AgentText>
          <BlockRow running verb="Editing" target="src/routes/logout.tsx" />
          <QueuedMessage>Also update the docs in README.md</QueuedMessage>
        </FlowCard>
        <FlowCard caption="Interrumpido con esc: queda marcado y el composer listo para corregir el rumbo">
          <UserBubble>Fix the redirect in logout too</UserBubble>
          <AgentText>Same hole as login. Switching it to</AgentText>
          <SystemDivider>Interrupted by you</SystemDivider>
        </FlowCard>
        <FlowCard caption="Acciones de la respuesta: aparecen al pasar el mouse (copiar + timestamp)">
          <div className="group/response flex flex-col gap-3">
            <AgentText>
              Logout now uses <InlineCode>safeNext</InlineCode> too, and the new test covers a{" "}
              <InlineCode>next</InlineCode> that starts with two slashes. All 7 tests pass.
            </AgentText>
            <ResponseActions time="22 minutes ago" exact="Oct 17, 2026 at 4:00 PM" />
          </div>
        </FlowCard>
        <FlowCard caption="Contexto casi lleno: medidor segmentado al final de la conversación">
          <AgentText>
            Done. Login and logout share <InlineCode>safeNext</InlineCode> now.
          </AgentText>
          <BlockRow
            icon={Terminal}
            verb="Run"
            target="yarn test src/auth"
            meta="✓ 7 passed"
            metaTone="green"
          />
          <ContextMeter percent={91} />
        </FlowCard>
        <FlowCard caption="Estados de la sesión: una fila del sistema; el composer no cambia">
          <SystemRow
            kind="offline"
            title="You're offline"
            description="Claude keeps working locally. Links and connectors wait."
            actions={[{ label: "Retry", primary: true }]}
          />
          <SystemRow
            kind="crashed"
            title="Claude Code exited unexpectedly"
            description="Exit code 1 · 2 min ago. Your changes are safe in the worktree."
            actions={[{ label: "View log" }, { label: "Restart", primary: true }]}
          />
          <SystemRow
            kind="ended"
            title="This session ended 2 days ago"
            description="Resume to keep the conversation and context."
            actions={[{ label: "Start fresh" }, { label: "Resume", primary: true }]}
          />
        </FlowCard>
      </div>
    </Section>
  );
}

export function Markdown() {
  return (
    <Section
      id="markdown"
      title="Markdown"
      description="How the agent's answers render: paragraphs, headings, lists, tables, callouts and code."
    >
      <div className="grid grid-cols-2 items-start gap-8">
        <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_rgb(236_235_230/5%)]">
          <MdParagraph>
            Fixed. Both routes now validate <InlineCode>next</InlineCode> with the same helper, and
            the double-slash case is covered by tests. <MdStrong>All 7 tests pass.</MdStrong>
          </MdParagraph>
          <MdHeading level={2}>What changed</MdHeading>
          <MdList
            items={[
              <>
                Moved <InlineCode>safeNext</InlineCode> into{" "}
                <InlineCode>src/auth/url.ts</InlineCode> and exported it
              </>,
              "Login and logout both call it before redirecting",
              <>
                Added 3 tests: <InlineCode>//evil.com</InlineCode>, absolute urls and a missing{" "}
                <InlineCode>next</InlineCode>
              </>,
            ]}
          />
          <MdHeading level={3}>The helper</MdHeading>
          <CodeBlock
            file="src/auth/url.ts"
            language="typescript"
            lines={[
              [{ text: "// Only allow same-origin paths", kind: "comment" }],
              [
                { text: "export function", kind: "keyword" },
                { text: " safeNext(raw" },
                { text: "?", kind: "keyword" },
                { text: ": " },
                { text: "string", kind: "keyword" },
                { text: ") {" },
              ],
              [
                { text: "  " },
                { text: "if", kind: "keyword" },
                { text: " (!raw || !raw.startsWith(" },
                { text: "'/'", kind: "string" },
                { text: ") || raw.startsWith(" },
                { text: "'//'", kind: "string" },
                { text: ")) " },
                { text: "return", kind: "keyword" },
                { text: " " },
                { text: "null", kind: "keyword" },
                { text: ";" },
              ],
              [
                { text: "  " },
                { text: "return", kind: "keyword" },
                { text: " raw.slice(" },
                { text: "0", kind: "number" },
                { text: ", " },
                { text: "2048", kind: "number" },
                { text: ");" },
              ],
              [{ text: "}" }],
            ]}
          />
        </div>
        <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_rgb(236_235_230/5%)]">
          <MdHeading level={3}>Where redirects are built</MdHeading>
          <MdTable
            head={["Route", "Before", "After"]}
            rows={[
              ["/login", "raw next", "safeNext"],
              ["/logout", "raw next", "safeNext"],
              ["/oauth/callback", "state.next", "safeNext"],
            ]}
          />
          <MdHeading level={3}>Next steps</MdHeading>
          <MdList
            ordered
            items={[
              <>
                Review the diff in <MdStrong>Changes</MdStrong>
              </>,
              "Open a PR when you are happy with it",
              "Follow up on the OAuth callback",
            ]}
          />
          <MdCallout title="Heads up.">
            The OAuth callback still reads <InlineCode>state.next</InlineCode> directly. I left it
            for a follow-up so this PR stays small.
          </MdCallout>
          <MdDivider />
          <MdParagraph>
            Validation follows the <MdLink>OWASP cheat sheet</MdLink>, which also recommends an
            allowlist if you ever need cross-origin redirects.
          </MdParagraph>
          <CodeBlock
            file="terminal"
            language="bash"
            lines={[
              [{ text: "yarn test src/auth" }],
              [{ text: "✓ 7 passed · 3.4s", kind: "comment" }],
            ]}
          />
        </div>
      </div>
    </Section>
  );
}
