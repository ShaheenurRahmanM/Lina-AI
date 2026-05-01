import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppSettings } from '../types';
import { getAppSettings, saveAppSettings } from '../db/client';

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  loadSettings: () => Promise<void>;
  setSettings: (update: Partial<AppSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  theme: 'dark',
  model: 'llama-3.1-70b-versatile',
  systemPrompt: 'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant. You are concise, accurate, and always aim to provide the most useful response possible.',
  temperature: 0.7,
  maxTokens: 4096,
  voiceEnabled: false,
  voiceName: 'default',
  voiceRate: 1,
  voicePitch: 1,
  voiceVolume: 1,
  showWelcome: true,
};

export const useSettingsStore = create<SettingsState>()(
  devtools((set) => ({
    settings: DEFAULT_SETTINGS,
    loading: true,
    loadSettings: async () => {
      const stored = await getAppSettings();
      set({ settings: stored ?? DEFAULT_SETTINGS, loading: false });
    },
    setSettings: async (update) => {
      await saveAppSettings(update);
      const settings = await getAppSettings();
      set({ settings: settings ?? { ...DEFAULT_SETTINGS, ...update } });
    },
  }))
);
