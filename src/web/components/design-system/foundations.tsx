import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings.store";
import { Section, Specimen } from "@/components/design-system/specimen";

const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  {
    title: "Surfaces",
    tokens: ["page", "canvas", "surface", "surface-raised", "elevated", "inset", "control-off"],
  },
  { title: "Interaction fills", tokens: ["field", "hover", "hover-2", "glass"] },
  { title: "Ink", tokens: ["ink", "ink-2", "ink-3", "ink-4", "ink-5", "ink-6", "inverse"] },
  {
    title: "Lines",
    tokens: ["line-soft", "line", "line-chip", "line-strong", "line-focus", "ring-idle"],
  },
  { title: "Brand", tokens: ["accent", "accent-hover", "accent-ink", "accent-tint", "on-accent"] },
  {
    title: "Semantic",
    tokens: [
      "green",
      "green-tint",
      "orange",
      "orange-tint",
      "red",
      "red-solid",
      "red-tint",
      "blue",
      "blue-tint",
      "violet",
      "violet-tint",
    ],
  },
  { title: "Identity", tokens: ["claude", "claude-tile", "knob"] },
];

const TYPE_SCALE = [
  ["text-3xs", "10 / 14", "Mono chips · port numbers"],
  ["text-2xs", "11 / 16", "Meta, captions, pills"],
  ["text-xs", "12 / 18", "Secondary text, labels, tabs"],
  ["text-sm", "13 / 20", "Body — the default"],
  ["text-base", "14 / 21", "Card titles"],
  ["text-md", "15 / 22", "Task title, modal title"],
  ["text-xl", "20 / 26", "Settings sections"],
  ["text-2xl", "24 / 30", "First run headings"],
  ["text-3xl", "30 / 36", "Welcome"],
] as const;

const RADII = [
  ["chip", 6],
  ["control", 8],
  ["field", 10],
  ["menu", 12],
  ["panel", 14],
  ["sheet", 18],
  ["card", 22],
  ["full", 999],
] as const;

const SHADOWS = [
  "hairline",
  "btn",
  "solid",
  "tab",
  "track",
  "card",
  "raised",
  "overlay",
  "modal",
  "focus",
];

function readTokens(tokens: string[]): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(tokens.map((t) => [t, style.getPropertyValue(`--${t}`).trim()]));
}

const ALL_TOKENS = COLOR_GROUPS.flatMap((g) => g.tokens);

function Swatch({ token, value }: { token: string; value?: string }) {
  return (
    <div className="flex w-[132px] flex-col gap-2">
      <span
        className="h-14 rounded-field shadow-[inset_0_0_0_1px_var(--line-strong)]"
        style={{ background: `var(--${token})` }}
      />
      <span className="flex flex-col">
        <span className="text-xs font-medium text-ink">{token}</span>
        <span className="truncate font-mono text-3xs text-ink-4">{value}</span>
      </span>
    </div>
  );
}

export function Colors() {
  const theme = useSettingsStore((s) => s.resolvedTheme);
  return <ColorGroups key={theme} />;
}

function ColorGroups() {
  const values = readTokens(ALL_TOKENS);
  return (
    <Section
      id="colors"
      title="Colors"
      description="Every color in the wireframes. Components use these tokens, never raw values."
    >
      {COLOR_GROUPS.map((group) => (
        <Specimen key={group.title} name={group.title} className="items-start gap-4">
          {group.tokens.map((token) => (
            <Swatch key={token} token={token} value={values[token]} />
          ))}
        </Specimen>
      ))}
    </Section>
  );
}

export function Typography() {
  return (
    <Section
      id="type"
      title="Typography"
      description="Inter for the interface, JetBrains Mono for paths, branches, ports and code. Letter spacing −0.01em."
    >
      <div className="grid grid-cols-2 gap-4">
        <Specimen name="Inter Variable" className="flex-col items-start gap-1">
          <span className="text-3xl font-semibold tracking-[-0.03em] text-ink">Welcome to Nex</span>
          <span className="text-sm text-ink-3">
            400 · 500 · 600 — secondary text gets color, not weight
          </span>
        </Specimen>
        <Specimen name="JetBrains Mono Variable" className="flex-col items-start gap-1">
          <span className="font-mono text-xl text-ink">feat/fix-login-redirect</span>
          <span className="font-mono text-xs text-ink-4">
            ~/.nex/worktrees/nex/fix-login-redirect
          </span>
        </Specimen>
      </div>
      <Specimen name="Scale" className="flex-col items-stretch gap-0 p-0">
        {TYPE_SCALE.map(([name, size, use]) => (
          <div
            key={name}
            className="flex items-baseline gap-6 border-t border-line px-5 py-3 first:border-t-0"
          >
            <span className="w-16 font-mono text-2xs text-ink-4">{name}</span>
            <span className="w-16 font-mono text-2xs text-ink-4">{size}</span>
            <span className={cn("flex-1 truncate text-ink", name)}>Fix login redirect param</span>
            <span className="text-xs text-ink-3">{use}</span>
          </div>
        ))}
      </Specimen>
    </Section>
  );
}

export function ShapeAndElevation() {
  return (
    <Section
      id="shape"
      title="Shape and elevation"
      description="Rings instead of borders; depth comes from surface steps and shadows, never from color."
    >
      <Specimen name="Radii" className="gap-5">
        {RADII.map(([name, px]) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <span
              className="size-16 bg-elevated shadow-[inset_0_0_0_1px_var(--line-strong)]"
              style={{ borderRadius: px }}
            />
            <span className="font-mono text-3xs text-ink-4">
              {name} · {px === 999 ? "pill" : `${px}px`}
            </span>
          </div>
        ))}
      </Specimen>
      <Specimen name="Shadows" className="gap-6 bg-canvas">
        {SHADOWS.map((name) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <span
              className="size-20 rounded-panel bg-surface"
              style={{ boxShadow: `var(--shadow-${name})` }}
            />
            <span className="font-mono text-3xs text-ink-4">shadow-{name}</span>
          </div>
        ))}
      </Specimen>
    </Section>
  );
}
