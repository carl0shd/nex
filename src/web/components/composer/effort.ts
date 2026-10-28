export type Effort = "low" | "medium" | "high" | "xhigh" | "max" | "ultracode";

export const EFFORTS: readonly Effort[] = ["low", "medium", "high", "xhigh", "max", "ultracode"];

export const EFFORT_LABEL: Record<Effort, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "X-high",
  max: "Max",
  ultracode: "Ultracode",
};

export const EFFORT_TONE: Record<Effort, string> = {
  low: "text-ink",
  medium: "text-ink",
  high: "text-ink",
  xhigh: "text-accent-ink",
  max: "text-accent-ink",
  ultracode: "text-violet-ink",
};
