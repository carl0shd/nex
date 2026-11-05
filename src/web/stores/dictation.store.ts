import { create } from "zustand";
import type { DictationLanguage, MicrophoneInput } from "@/components/composer/dictation";
import { suggestedLanguages, toDictationLanguage } from "@/lib/dictation-languages";
import { notifyCompact } from "@/lib/notify";
import { useVoiceLevelStore } from "@/stores/voice-level.store";

const PREFS_KEY = "dictation-prefs";
const RECENT_LANGUAGES = 4;

interface DictationPrefs {
  language: string;
  microphone: string;
  recent: string[];
}

interface DictationStore {
  languages: DictationLanguage[];
  microphones: MicrophoneInput[];
  prefs: DictationPrefs;
  owner: string | null;
  micReady: boolean;
  pending: string;
  load: () => void;
  start: (owner: string, onText: (text: string) => void) => Promise<void>;
  stop: (owner: string) => void;
  setLanguage: (language: string) => void;
  setMicrophone: (microphone: string) => void;
}

let loading: Promise<void> | null = null;
let authorized = false;
let deliver: ((text: string) => void) | null = null;

export const useDictationStore = create<DictationStore>((set, get) => {
  const savePrefs = (prefs: DictationPrefs) => {
    set({ prefs });
    void window.api.setSetting(PREFS_KEY, prefs);
  };

  const loadDevices = () =>
    window.api.speech.listDevices().then((devices) => {
      const microphones = devices.map((device) => ({ id: String(device.id), name: device.name }));
      const fallback = devices.find((device) => device.isDefault) ?? devices[0];
      const { prefs } = get();
      const keep = devices.some((device) => String(device.id) === prefs.microphone);
      set({
        microphones,
        prefs: keep || !fallback ? prefs : { ...prefs, microphone: String(fallback.id) },
      });
    });

  const finish = () => {
    deliver = null;
    set({ owner: null, micReady: false, pending: "" });
    useVoiceLevelStore.getState().setLoudness(0);
  };

  return {
    languages: [],
    microphones: [],
    prefs: { language: "", microphone: "", recent: [] },
    owner: null,
    micReady: false,
    pending: "",

    load: () => {
      loading ??= (async () => {
        window.api.speech.onEvent((event) => {
          if (event.type === "devicesChanged") void loadDevices();
          if (!get().owner) return;
          if (event.type === "state" && event.state === "listening") set({ micReady: true });
          if (event.type === "level") useVoiceLevelStore.getState().setLoudness(event.level ?? 0);
          if (event.type === "partial") set({ pending: event.text ?? "" });
          if (event.type === "final" && event.text) {
            set({ pending: "" });
            deliver?.(event.text);
          }
          if (event.type === "error") {
            notifyCompact({ tone: "red", title: event.message ?? "Dictation stopped" });
          }
          if (event.type === "end" || event.type === "error") {
            const unsaid = get().pending.trim();
            if (unsaid) deliver?.(unsaid);
            finish();
          }
        });
        const [locales, saved] = await Promise.all([
          window.api.speech.listLocales(),
          window.api.getSetting<DictationPrefs | null>(PREFS_KEY, null),
        ]);
        const languages = locales.map((locale) => toDictationLanguage(locale.identifier));
        const first = suggestedLanguages(languages, saved?.recent ?? [], navigator.languages)[0];
        set({
          languages,
          prefs: {
            language: saved?.language || first?.id || languages[0]?.id || "",
            microphone: saved?.microphone ?? "",
            recent: saved?.recent ?? [],
          },
        });
        await loadDevices();
      })();
    },

    start: async (owner, onText) => {
      get().load();
      if (get().owner) return;
      deliver = onText;
      set({ owner, micReady: false, pending: "" });
      if (!authorized) {
        const auth = await window.api.speech.requestAuth();
        authorized = auth.authorized;
        if (!authorized) {
          finish();
          notifyCompact({
            tone: "red",
            title: "Nex needs microphone and speech access to dictate",
          });
          return;
        }
      }
      await loading;
      const { prefs } = get();
      await window.api.speech
        .start({
          locale: prefs.language || undefined,
          deviceId: prefs.microphone ? Number(prefs.microphone) : undefined,
          continuous: true,
        })
        .catch(finish);
    },

    stop: (owner) => {
      if (get().owner === owner) void window.api.speech.stop();
    },

    setLanguage: (language) => {
      const { prefs } = get();
      savePrefs({
        ...prefs,
        language,
        recent: [language, ...prefs.recent.filter((item) => item !== language)].slice(
          0,
          RECENT_LANGUAGES,
        ),
      });
    },

    setMicrophone: (microphone) => savePrefs({ ...get().prefs, microphone }),
  };
});
