import { useHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import { defaultShortcut, type ShortcutId } from "@/lib/app-shortcuts";
import { isTypingText } from "@/lib/typing";
import { usePreferencesStore } from "@/stores/preferences.store";

export function useAppHotkey(id: ShortcutId, callback: () => void, enabled = true) {
  const shortcut = defaultShortcut(id);
  const hotkey = usePreferencesStore((s) => s.prefs.shortcuts[id]) ?? shortcut.hotkey;
  const yields = shortcut.yieldsToText ?? false;
  useHotkey(
    hotkey as Hotkey,
    (event) => {
      if (yields && isTypingText(event.target)) return;
      event.preventDefault();
      callback();
    },
    {
      enabled,
      ignoreInputs: false,
      preventDefault: !yields,
      stopPropagation: !yields,
      meta: { name: shortcut.label },
    },
  );
}
