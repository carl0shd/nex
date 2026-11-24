import { EFFORTS, EFFORT_LABEL } from "@/components/composer/effort";
import { PERMISSION_LABEL, PERMISSION_MODES } from "@/lib/permission-modes";

const options = <T extends string>(values: readonly T[], labels?: Partial<Record<T, string>>) =>
  values.map((value) => ({ value, label: labels?.[value] ?? value }));

export const IDE_APPS = ["Cursor", "Visual Studio Code", "Zed", "Windsurf", "Xcode"];
export const TERMINAL_APPS = ["Terminal", "iTerm", "Ghostty", "Warp"];
export const FONT_SIZES = options(["11", "12", "13", "14"]);
export const MOTION = options(["system", "reduce"], {
  system: "Follow system",
  reduce: "Reduce",
});
export const HOME_SCENES = options(["time", "dawn", "day", "dusk", "night", "off"], {
  time: "Time of day",
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
  off: "Off",
});
export const SOUNDS = options(["None", "Glass", "Pop", "Tink", "Purr", "Ping"]);
export const EFFORT_OPTIONS = EFFORTS.map((effort) => ({
  value: effort,
  label: EFFORT_LABEL[effort],
}));
export const PERMISSION_OPTIONS = PERMISSION_MODES.map((mode) => ({
  value: mode,
  label: PERMISSION_LABEL[mode],
}));
export const SCROLLBACK = options(["1000", "5000", "10000", "50000"], {
  "1000": "1,000",
  "5000": "5,000",
  "10000": "10,000",
  "50000": "50,000",
});
export const WARN_AT = options(["70", "80", "90"], { "70": "70%", "80": "80%", "90": "90%" });
export const RUN_AT_MOST = ["1", "2", "3", "4", "5", "6"].map((value) => ({
  value,
  label: value === "1" ? "1 environment" : `${value} environments`,
}));
export const PAUSE_AFTER = options(["5", "15", "30", "60", "never"], {
  "5": "5 min",
  "15": "15 min",
  "30": "30 min",
  "60": "1 hour",
  never: "Never",
});
