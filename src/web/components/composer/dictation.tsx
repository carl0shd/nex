import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Mic, Search } from "lucide-react";
import { SelectionMark } from "@/components/atoms/selection-mark";
import { Spinner } from "@/components/atoms/spinner";
import { Menu, MenuLabel, MenuSeparator } from "@/components/primitives/menu";
import { cn } from "@/lib/utils";
import { useSettled } from "@/hooks/use-settled";
import { useVoiceLevelStore } from "@/stores/voice-level.store";

export interface DictationLanguage {
  id: string;
  name: string;
  region?: string;
}

export interface MicrophoneInput {
  id: string;
  name: string;
}

const CHEVRON_DELAY = 800;
const SUGGESTED_ROWS = 4;

const SPEAKING = 0.08;
const QUIET_AFTER_MS = 700;

export function VoiceOrb({ live = false }: { live?: boolean }) {
  const silent = useVoiceLevelStore((s) => s.loudness < SPEAKING);
  const quiet = useSettled(silent, QUIET_AFTER_MS);
  return (
    <span aria-hidden className={cn("voice-orb", live && quiet && "is-quiet")}>
      <span />
      <span />
      <span />
    </span>
  );
}

const BAR_COUNT = [0, 1, 2, 3, 4];
const BAR_STEPS = 3;
const STEP_PX = 4;

export function LevelMeter({ live = false }: { live?: boolean }) {
  const bands = useVoiceLevelStore((s) => s.bands);
  const levels = live ? bands : undefined;
  return (
    <span aria-hidden className={cn("level-meter", levels && "is-live")}>
      {BAR_COUNT.map((index) => (
        <span
          key={index}
          style={
            levels
              ? { height: 2 + Math.round((levels[index] ?? 0) * BAR_STEPS) * STEP_PX }
              : undefined
          }
        />
      ))}
    </span>
  );
}

export function DictationText({ confirmed, pending }: { confirmed: string; pending?: string }) {
  return (
    <>
      {confirmed}
      {pending && <span className="text-ink-4"> {pending}</span>}
      <span className="caret-blink ml-px inline-block h-4 w-[1.5px] bg-ink align-[-3px]" />
    </>
  );
}

export function DictateButton({
  listening = false,
  starting = false,
  live = false,
  menuOpen = false,
  onDictate,
  onMenuOpenChange,
}: {
  listening?: boolean;
  starting?: boolean;
  live?: boolean;
  menuOpen?: boolean;
  onDictate?: () => void;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const expanded = !listening && (hovered || menuOpen);
  return (
    <span className="flex items-center">
      <span
        aria-hidden
        className={cn(
          "flex overflow-hidden transition-[width,opacity] duration-200 ease-out-strong",
          listening ? "w-6 opacity-100" : "w-0 opacity-0",
        )}
      >
        <span className="relative flex size-6 items-center justify-center">
          <span
            className={cn(
              "absolute flex transition-[opacity,scale] duration-200 ease-out-strong",
              starting ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
          >
            <Spinner accent />
          </span>
          <span
            className={cn(
              "flex transition-[opacity,scale] duration-200 ease-out-strong",
              starting ? "scale-75 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <VoiceOrb live={live && !starting} />
          </span>
        </span>
      </span>
      <span
        onMouseEnter={() => {
          timer.current = setTimeout(() => setHovered(true), CHEVRON_DELAY);
        }}
        onMouseLeave={() => {
          clearTimeout(timer.current);
          setHovered(false);
        }}
        className={cn(
          "interactive flex h-[30px] items-center rounded-full",
          listening && "bg-green-tint text-accent-ink",
          expanded && "bg-hover-2 text-ink",
          !listening && !expanded && "text-ink-3 hover:bg-hover hover:text-ink-2",
        )}
      >
        <button
          type="button"
          aria-label={starting ? "Starting microphone" : listening ? "Stop dictation" : "Dictate"}
          onClick={() => {
            clearTimeout(timer.current);
            setHovered(false);
            onDictate?.();
          }}
          className="press flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full select-none"
        >
          <Mic width={14} height={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Dictation options"
          aria-expanded={menuOpen}
          aria-hidden={!expanded}
          tabIndex={expanded ? 0 : -1}
          onClick={() => onMenuOpenChange?.(!menuOpen)}
          className={cn(
            "press flex h-full cursor-pointer items-center overflow-hidden rounded-full text-ink-3 transition-[width,margin,opacity] duration-200 ease-out-strong select-none hover:text-ink",
            expanded ? "-ml-1.5 w-4 opacity-100" : "pointer-events-none ml-0 w-0 opacity-0",
          )}
        >
          <ChevronDown width={9} height={9} strokeWidth={2.5} className="shrink-0" />
        </button>
      </span>
    </span>
  );
}

function CompactRow({
  children,
  selected,
  onSelect,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      data-menu-row
      onClick={onSelect}
      className="interactive press-wide relative flex h-[26px] w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 text-left select-none"
    >
      {children}
    </button>
  );
}

const MENU_MAX_HEIGHT = 320;

export function DictationMenu({
  languages,
  suggested = [],
  language,
  onLanguageChange,
  microphones,
  microphone,
  onMicrophoneChange,
  query,
  onQueryChange,
  live = false,
}: {
  live?: boolean;
  languages: readonly DictationLanguage[];
  suggested?: readonly DictationLanguage[];
  language: string;
  onLanguageChange: (id: string) => void;
  microphones: readonly MicrophoneInput[];
  microphone: string;
  onMicrophoneChange: (id: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const current = languages.find((option) => option.id === language);
  const quick = [current, ...suggested.filter((option) => option.id !== language)]
    .filter((option): option is DictationLanguage => Boolean(option))
    .slice(0, SUGGESTED_ROWS);
  const shown = query.trim()
    ? languages.filter((option) =>
        `${option.name} ${option.region ?? ""} ${option.id}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : quick.length
      ? quick
      : languages;
  return (
    <Menu
      width={236}
      maxHeight={MENU_MAX_HEIGHT}
      origin="bottom right"
      className="rounded-field p-1"
      header={
        <>
          <label className="mx-1 mt-0.5 mb-1 flex h-[26px] items-center gap-1.5 rounded-chip bg-surface-raised px-2 text-2xs text-ink-4 shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <Search width={11} height={11} strokeWidth={2} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search languages"
              className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4"
            />
          </label>
        </>
      }
    >
      {shown.length === 0 && (
        <span className="flex h-[26px] items-center px-2 text-xs text-ink-4">
          No languages found
        </span>
      )}
      {shown.map((option) => (
        <CompactRow
          key={option.id}
          selected={option.id === language}
          onSelect={() => onLanguageChange(option.id)}
        >
          <span className="text-xs text-ink">{option.name}</span>
          {option.region && <span className="text-2xs text-ink-4">{option.region}</span>}
          <span className="ml-auto flex w-3 text-accent-ink">
            {option.id === language && <Check width={12} height={12} strokeWidth={2.75} />}
          </span>
        </CompactRow>
      ))}
      <MenuSeparator />
      <MenuLabel className="h-[22px] px-2 text-3xs">Microphone</MenuLabel>
      {microphones.map((input) => {
        const selected = input.id === microphone;
        return (
          <CompactRow
            key={input.id}
            selected={selected}
            onSelect={() => onMicrophoneChange(input.id)}
          >
            <SelectionMark selected={selected} size="sm" />
            <span className={cn("truncate text-xs", selected ? "text-ink" : "text-ink-2")}>
              {input.name}
            </span>
            {selected && (
              <span className="ml-auto flex">
                <LevelMeter live={live} />
              </span>
            )}
          </CompactRow>
        );
      })}
    </Menu>
  );
}
