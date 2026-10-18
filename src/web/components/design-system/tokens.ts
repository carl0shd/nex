interface ColorToken {
  name: string;
  variable: string;
}

interface ColorTokenGroup {
  title: string;
  tokens: ColorToken[];
}

const token = (name: string): ColorToken => ({ name, variable: `--${name}` });

const COLOR_GROUPS: ColorTokenGroup[] = [
  {
    title: "Surfaces",
    tokens: [
      "page",
      "canvas",
      "surface",
      "surface-raised",
      "inset",
      "terminal",
      "muted",
      "muted-strong",
    ].map(token),
  },
  {
    title: "Interaction fills (translucent)",
    tokens: ["field", "hover", "hover-2", "active"].map(token),
  },
  {
    title: "Ink",
    tokens: ["ink", "ink-2", "ink-3", "ink-4", "inverse", "on-color"].map(token),
  },
  {
    title: "Lines",
    tokens: ["line-soft", "line", "line-strong", "line-hover"].map(token),
  },
  {
    title: "Brand",
    tokens: [
      "primary",
      "primary-hover",
      "primary-deep",
      "primary-ink",
      "primary-tint",
      "primary-fg",
      "ring",
    ].map(token),
  },
  {
    title: "Semantic",
    tokens: ["green", "orange", "red", "blue", "yellow"].map(token),
  },
  {
    title: "Data",
    tokens: [
      "chart-cost",
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "chart-grid",
      "diff-added",
      "diff-removed",
    ].map(token),
  },
  {
    title: "Effects (CSS-only)",
    tokens: [
      "glass-tint",
      "glass-ring",
      "highlight",
      "overlay",
      "scrollbar",
      "terminal-selection",
    ].map(token),
  },
];

interface TypeToken {
  name: string;
  className: string;
  usage: string;
}

const TYPE_SCALE: TypeToken[] = [
  { name: "text-3xs · 10", className: "text-3xs", usage: "Eyebrows, chips, kbd" },
  { name: "text-2xs · 11", className: "text-2xs", usage: "Labels, captions, badges" },
  { name: "text-xs · 12", className: "text-xs", usage: "Secondary rows, descriptions" },
  { name: "text-sm · 13", className: "text-sm", usage: "Body, inputs, menu items" },
  { name: "text-base · 14", className: "text-base", usage: "Emphasis body" },
  { name: "text-lg · 16", className: "text-lg", usage: "Dialog title" },
  { name: "text-xl · 20", className: "text-xl", usage: "Page title" },
  { name: "text-2xl · 24", className: "text-2xl", usage: "Stat hero" },
  { name: "text-3xl · 30", className: "text-3xl", usage: "Display" },
];

const FONT_WEIGHTS = [
  { name: "font-normal", className: "font-normal" },
  { name: "font-medium", className: "font-medium" },
  { name: "font-semibold", className: "font-semibold" },
  { name: "font-bold", className: "font-bold" },
];

const FONT_FAMILIES = [
  { name: "Inter Variable", className: "font-sans", usage: "UI" },
  { name: "JetBrains Mono Variable", className: "font-mono", usage: "Code, numbers, paths" },
];

const TEXT_COLORS = [
  { name: "ink", className: "text-ink", usage: "Primary content" },
  { name: "ink-2", className: "text-ink-2", usage: "Supporting content" },
  { name: "ink-3", className: "text-ink-3", usage: "Labels and metadata" },
  { name: "ink-4", className: "text-ink-4", usage: "Placeholders, disabled" },
  { name: "primary-ink", className: "text-primary-ink", usage: "Brand text on tint" },
];

const RADII = [
  { name: "rounded-chip · 6", className: "rounded-chip", usage: "Chip, kbd" },
  { name: "rounded-control · 8", className: "rounded-control", usage: "Input, toggle, menu row" },
  { name: "rounded-card · 10", className: "rounded-card", usage: "Menu, popover, tile" },
  { name: "rounded-panel · 14", className: "rounded-panel", usage: "Card, panel" },
  { name: "rounded-window · 18", className: "rounded-window", usage: "Dialog" },
  { name: "rounded-full", className: "rounded-full", usage: "Button, badge, switch" },
];

const SHADOWS = [
  { name: "shadow-hairline", className: "shadow-hairline", usage: "Outline as a ring" },
  { name: "shadow-btn", className: "shadow-btn", usage: "Secondary button" },
  { name: "shadow-card", className: "shadow-card", usage: "Card, setting row" },
  { name: "shadow-raised", className: "shadow-raised", usage: "Tooltip, lifted rows" },
  { name: "shadow-overlay", className: "shadow-overlay", usage: "Menu, popover, dialog" },
  { name: "shadow-solid", className: "shadow-solid", usage: "Primary button, check" },
  { name: "shadow-glass", className: "shadow-glass", usage: "Floating glass chrome" },
  { name: "shadow-inset-field", className: "shadow-inset-field", usage: "Tracks, wells" },
];

const EASINGS = [
  { name: "ease-out-strong", className: "ease-out-strong", usage: "Default for everything" },
  { name: "ease-glide", className: "ease-glide", usage: "Sidebar, large moves" },
  { name: "ease-in-out-strong", className: "ease-in-out-strong", usage: "On-screen loops" },
];

export {
  COLOR_GROUPS,
  TYPE_SCALE,
  FONT_WEIGHTS,
  FONT_FAMILIES,
  TEXT_COLORS,
  RADII,
  SHADOWS,
  EASINGS,
};
export type { ColorToken, ColorTokenGroup };
