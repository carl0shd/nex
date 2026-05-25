import { create } from 'zustand';

interface MicPrefs {
  selectedDeviceId: number | null;
  selectedLocale: string | null;
  holdToRecord: boolean;
}

const MIC_PREFS_KEY = 'mic-prefs';

const DEFAULT_PREFS: MicPrefs = {
  selectedDeviceId: null,
  selectedLocale: null,
  holdToRecord: false
};

interface MicState extends MicPrefs {
  loaded: boolean;
  activeRecorderId: string | null;
  load: () => Promise<void>;
  setSelectedDevice: (deviceId: number | null) => void;
  setSelectedLocale: (locale: string | null) => void;
  setHoldToRecord: (hold: boolean) => void;
  setActiveRecorder: (id: string | null) => void;
}

export const useMicStore = create<MicState>((set, get) => {
  const persist = (next: Partial<MicPrefs>): void => {
    set(next);
    const { selectedDeviceId, selectedLocale, holdToRecord } = get();
    window.api.setSetting(MIC_PREFS_KEY, { selectedDeviceId, selectedLocale, holdToRecord });
  };
  return {
    ...DEFAULT_PREFS,
    loaded: false,
    activeRecorderId: null,
    load: async () => {
      const val = await window.api.getSetting<MicPrefs>(MIC_PREFS_KEY, DEFAULT_PREFS);
      set({ ...DEFAULT_PREFS, ...val, loaded: true });
    },
    setSelectedDevice: (deviceId) => persist({ selectedDeviceId: deviceId }),
    setSelectedLocale: (locale) => persist({ selectedLocale: locale }),
    setHoldToRecord: (hold) => persist({ holdToRecord: hold }),
    setActiveRecorder: (id) => {
      if (get().activeRecorderId === id) return;
      set({ activeRecorderId: id });
    }
  };
});
