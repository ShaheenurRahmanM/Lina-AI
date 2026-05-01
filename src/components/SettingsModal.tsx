import { ChangeEvent, useEffect, useState } from 'react';
import { X, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { clearEncryptedApiKey, encryptApiKey } from '../services/crypto';
import { useChatStore } from '../store/chatStore';
import { importData } from '../db/client';
import { downloadJSON } from '../utils/format';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODELS = [
  { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B — Best Quality (Recommended)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — Fast' },
];

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, loadSettings, setSettings } = useSettingsStore();
  const { conversations, messages, clearAllConversations } = useChatStore();
  const { speak } = useTextToSpeech();
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [model, setModel] = useState(settings.model);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled);
  const [voiceName, setVoiceName] = useState(settings.voiceName ?? 'default');
  const [voiceRate, setVoiceRate] = useState(settings.voiceRate);
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch);
  const [voiceVolume, setVoiceVolume] = useState(settings.voiceVolume);
  const [showWelcome, setShowWelcome] = useState(settings.showWelcome);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  useEffect(() => {
    setTheme(settings.theme);
    setModel(settings.model);
    setSystemPrompt(settings.systemPrompt);
    setTemperature(settings.temperature);
    setMaxTokens(settings.maxTokens);
    setVoiceEnabled(settings.voiceEnabled);
    setVoiceName(settings.voiceName ?? 'default');
    setVoiceRate(settings.voiceRate);
    setVoicePitch(settings.voicePitch);
    setVoiceVolume(settings.voiceVolume);
    setShowWelcome(settings.showWelcome);
  }, [settings]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);


  const handleSave = async () => {
    if (apiKey.trim()) {
      await encryptApiKey(apiKey.trim());
      setApiKey('');
    }
    await setSettings({
      theme,
      model,
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

  const handleExport = () => {
    downloadJSON({ conversations, messages, settings }, 'lina-ai-backup.json');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importData(payload);
      alert('Import successful. Reloading…');
      window.location.reload();
    } catch {
      alert('Failed to import file. Ensure it is a valid Lina AI backup.');
    }
  };

  const handleClear = async () => {
    if (!confirm('This will delete all conversations and reset your API key. Continue?')) return;
    await clearAllConversations();
    clearEncryptedApiKey();
    onClose();
  };

  const handleTestVoice = () => {
    const testText = 'Hello! This is a test of the Lina AI voice. How do you like it?';
    speak(testText, {
      voiceName: voiceName === 'default' ? undefined : voiceName,
      rate: voiceRate,
      pitch: voicePitch,
      volume: voiceVolume,
      lang: 'en-US',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize your Lina AI experience</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

          {/* API Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Groq API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter new key to update (sk-…)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 transition-all placeholder:text-slate-400"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Need a key?{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:underline font-medium"
              >
                Get one at console.groq.com
              </a>
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              AI Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 transition-all cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-slate-400">
              If the selected model is unavailable, the app will automatically retry using a compatible fallback model.
            </p>
          </div>

          {/* Voice Setup */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Voice variant
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 transition-all cursor-pointer"
            >
              <option value="default">Default browser voice</option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rate</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{voiceRate.toFixed(1)}</div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pitch</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{voicePitch.toFixed(1)}</div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-sky-500"
                />
                <div className="mt-1 text-[11px] text-slate-400">{voiceVolume.toFixed(1)}</div>
              </label>
            </div>
            {!availableVoices.length ? (
              <p className="mt-2 text-[11px] text-rose-500">Voice variants are unavailable in this browser. Please reload or try another browser.</p>
            ) : (
              <button
                type="button"
                onClick={handleTestVoice}
                className="mt-3 w-full inline-flex items-center gap-2 justify-center rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 hover:border-sky-400 text-sky-400 hover:text-sky-300 px-4 py-2.5 text-sm font-medium transition-all"
              >
                <Volume2 size={16} />
                Test Voice
              </button>
            )}
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Theme
            </label>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                    theme === t
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Voice & Welcome */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled((value) => !value)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                voiceEnabled ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-400'
              }`}
            >
              Voice responses: {voiceEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <button
              type="button"
              onClick={() => setShowWelcome((value) => !value)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                showWelcome ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Show welcome screen: {showWelcome ? 'On' : 'Off'}
            </button>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Temperature
              </label>
              <span className="text-xs font-bold text-sky-500 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-lg">
                {temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full accent-sky-500 cursor-pointer bg-slate-200 dark:bg-slate-800"
            />
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Max Tokens
              </label>
              <span className="text-xs font-bold text-sky-500 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-lg">
                {maxTokens.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 rounded-full accent-sky-500 cursor-pointer bg-slate-200 dark:bg-slate-800"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Data management */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Data & Privacy
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-400 transition-all"
              >
                Export Backup
              </button>
              <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-400 transition-all cursor-pointer">
                Import Backup
                <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all"
              >
                Wipe All Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
