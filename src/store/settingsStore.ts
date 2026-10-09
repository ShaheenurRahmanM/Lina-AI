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
  // Use a currently supported model from Groq
  model: 'llama-3.1-8b-instant',
  systemPrompt: 'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant. You are concise, accurate, and always aim to provide the most useful response possible.',
  temperature: 0.7,
  maxTokens: 2048,
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
      try {
        const stored = await getAppSettings();
        const effective = stored ?? DEFAULT_SETTINGS;
        // Migrate deprecated models to the supported default
        if (effective.model === 'llama-3.1-70b-versatile' || effective.model === 'llama-3.3-70b-versatile') {
          effective.model = DEFAULT_SETTINGS.model;
        }
        set({ settings: effective, loading: false });
      } catch {
        set({ settings: DEFAULT_SETTINGS, loading: false });
      }
    },
    setSettings: async (update) => {
      try {
        const sanitized = { ...update };
        if (sanitized.model === 'llama-3.1-70b-versatile' || sanitized.model === 'llama-3.3-70b-versatile') {
          sanitized.model = DEFAULT_SETTINGS.model;
        }
        await saveAppSettings(sanitized);
        const settings = await getAppSettings();
        set({ settings: settings ?? { ...DEFAULT_SETTINGS, ...sanitized } });
      } catch (err) {
        console.error('Failed to set settings:', err);
      }
    },
  }))
);
