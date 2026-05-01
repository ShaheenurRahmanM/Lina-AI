import { ChangeEvent, useEffect, useState } from 'react';
import { downloadJSON } from '../utils/format';
import { useSettingsStore } from '../store/settingsStore';
import { clearEncryptedApiKey, encryptApiKey } from '../services/crypto';
import { useChatStore } from '../store/chatStore';
import { getAllConversations, getAllMessages, importData } from '../db/client';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SettingsPageProps {
  onClose: () => void;
}

function SettingsPage({ onClose }: SettingsPageProps) {
  const { settings, loadSettings, setSettings } = useSettingsStore();
  const { conversations, messages, clearAllConversations } = useChatStore();
  const { getVoices } = useTextToSpeech();
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(settings.model);
  const [theme, setTheme] = useState(settings.theme);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled);
  const [voiceName, setVoiceName] = useState(settings.voiceName ?? 'default');
  const [voiceRate, setVoiceRate] = useState(settings.voiceRate);
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch);
  const [voiceVolume, setVoiceVolume] = useState(settings.voiceVolume);
  const [showWelcome, setShowWelcome] = useState(settings.showWelcome);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);

  useEffect(() => {
    loadSettings();
    setModel(settings.model);
    setTheme(settings.theme);
    setSystemPrompt(settings.systemPrompt);
    setVoiceEnabled(settings.voiceEnabled);
    setVoiceName(settings.voiceName ?? 'default');
    setVoiceRate(settings.voiceRate);
    setVoicePitch(settings.voicePitch);
    setVoiceVolume(settings.voiceVolume);
    setShowWelcome(settings.showWelcome);
    setTemperature(settings.temperature);
    setMaxTokens(settings.maxTokens);
  }, [loadSettings, settings.model, settings.theme, settings.systemPrompt, settings.voiceEnabled, settings.voiceName, settings.voiceRate, settings.voicePitch, settings.voiceVolume, settings.showWelcome, settings.temperature, settings.maxTokens]);

  useEffect(() => {
    setAvailableVoices(getVoices());
  }, [getVoices]);

  const handleSave = async () => {
    if (apiKey.trim()) {
      await encryptApiKey(apiKey.trim());
      setApiKey('');
    }
    await setSettings({
      model,
      theme,
      systemPrompt,
      temperature,
      maxTokens,
      voiceEnabled,
      voiceName,
      voiceRate,
      voicePitch,
      voiceVolume,
      showWelcome,
    });
    onClose();
  };

  const handleExport = async () => {
    const conversationsPayload = await getAllConversations();
    const messagesPayload = await getAllMessages();
    downloadJSON({ conversations: conversationsPayload, messages: messagesPayload, settings }, 'lina-ai-backup.json');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importData(payload);
      alert('Chat backup imported successfully. Reloading to refresh views.');
      window.location.reload();
    } catch (error) {
      alert('Import failed. Please select a valid JSON export.');
      console.error(error);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all chat history and settings?')) return;
    await clearAllConversations();
    clearEncryptedApiKey();
    onClose();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-glow">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-sky-300/70">Settings</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Customize Lina AI</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/80 text-slate-100 transition hover:border-sky-500/60 hover:text-sky-300"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-glow">
          <h3 className="text-lg font-semibold text-slate-100">Groq API</h3>
          <p className="mt-2 text-sm text-slate-400">Store your API key locally and securely for Lina AI to generate responses.</p>
          <label className="mt-6 block text-sm font-medium text-slate-200">Groq API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your Groq API key"
            className="mt-2 w-full rounded-3xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
          />
          <div className="mt-4 text-sm text-slate-400">
            Lina AI keeps your key encrypted in the browser. It never leaves your device unless you paste it into the app.
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-glow">
          <h3 className="text-lg font-semibold text-slate-100">Appearance</h3>
          <p className="mt-2 text-sm text-slate-400">Switch Lina AI between light mode and dark mode.</p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${theme === 'dark' ? 'border border-sky-400 bg-slate-900/90' : 'border border-slate-800/60 bg-slate-900/70'}`}
            >
              Dark theme
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${theme === 'light' ? 'border border-sky-400 bg-slate-900/90' : 'border border-slate-800/60 bg-slate-900/70'}`}
            >
              Light theme
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled((value) => !value)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${voiceEnabled ? 'border border-sky-400 bg-slate-900/90' : 'border border-slate-800/60 bg-slate-900/70'}`}
            >
              Voice responses: {voiceEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <button
              type="button"
              onClick={() => setShowWelcome((value) => !value)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${showWelcome ? 'border border-sky-400 bg-slate-900/90' : 'border border-slate-800/60 bg-slate-900/70'}`}
            >
              Welcome screen: {showWelcome ? 'Shown' : 'Hidden'}
            </button>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-800/60 bg-slate-900/80 p-4">
            <h4 className="text-sm font-semibold text-slate-100">Speech customization</h4>
            <label className="mt-4 block text-sm font-medium text-slate-200">Voice variant</label>
            <select
              value={voiceName}
              onChange={(event) => setVoiceName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
            >
              <option value="default">Default browser voice</option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-slate-400">Rate</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceRate}
                  onChange={(event) => setVoiceRate(parseFloat(event.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-xs text-slate-500">{voiceRate.toFixed(1)}</div>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Pitch</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voicePitch}
                  onChange={(event) => setVoicePitch(parseFloat(event.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-xs text-slate-500">{voicePitch.toFixed(1)}</div>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceVolume}
                  onChange={(event) => setVoiceVolume(parseFloat(event.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-xs text-slate-500">{voiceVolume.toFixed(1)}</div>
              </label>
            </div>
            {!availableVoices.length ? (
              <p className="mt-3 text-xs text-rose-400">
                Voice variants are unavailable in this browser. Reload or try another browser to pick a specific voice.
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                Pick from available browser voices and adjust rate, pitch, and volume.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-glow">
        <h3 className="text-lg font-semibold text-slate-100">Assistant personality</h3>
        <p className="mt-2 text-sm text-slate-400">Customize how Lina AI thinks and responds.</p>
        <textarea
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          className="mt-4 min-h-[150px] w-full rounded-3xl border border-slate-700/80 bg-slate-900/80 px-4 py-4 text-slate-100 outline-none transition focus:border-sky-400"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Temperature</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(event) => setTemperature(parseFloat(event.target.value))}
              className="mt-3 w-full accent-sky-500"
            />
            <div className="mt-2 text-xs text-slate-400">{temperature.toFixed(1)} — lower for deterministic responses, higher for creative answers.</div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Max tokens</span>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(event) => setMaxTokens(parseInt(event.target.value, 10))}
              className="mt-3 w-full accent-sky-500"
            />
            <div className="mt-2 text-xs text-slate-400">Limit the response size without breaking the chat flow.</div>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-3xl bg-sky-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-300"
        >
          Save settings
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 justify-center rounded-3xl border border-slate-700/80 bg-slate-900/80 px-6 py-3 text-slate-100 transition hover:border-sky-500/60"
        >
          <Download size={18} /> Export chats
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-3xl border border-slate-700/80 bg-slate-900/80 px-6 py-3 text-slate-100 transition hover:border-sky-500/60">
          <Upload size={18} />
          <span>Import chats</span>
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
      </div>
      <div className="mt-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-rose-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold">Danger zone</h4>
            <p className="mt-1 text-sm text-rose-200/80">Remove local chat history and reset your encrypted API key.</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-3xl border border-rose-500/80 bg-rose-600/20 px-5 py-3 text-sm text-rose-100 transition hover:bg-rose-500/20"
          >
            <Trash2 size={18} /> Clear history
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
