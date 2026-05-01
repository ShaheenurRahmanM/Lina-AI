import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (data: {
    fullName: string;
    assistantName: string;
    apiKey: string;
    theme: 'dark' | 'light';
    systemPrompt: string;
    model: string;
    voiceEnabled: boolean;
    voiceName: string;
    voiceRate: number;
    voicePitch: number;
    voiceVolume: number;
    temperature: number;
    maxTokens: number;
    showWelcome: boolean;
  }) => void;
}

function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [fullName, setFullName] = useState('');
  const [assistantName, setAssistantName] = useState('Lina AI');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [systemPrompt, setSystemPrompt] = useState('You are Lina AI, an intelligent, helpful, professional and friendly AI assistant.');
  const [model, setModel] = useState('llama-3.1-70b-versatile');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceName, setVoiceName] = useState('default');
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onComplete({
      fullName,
      assistantName,
      apiKey,
      theme,
      systemPrompt,
      model,
      voiceEnabled,
      voiceName,
      voiceRate,
      voicePitch,
      voiceVolume,
      temperature,
      maxTokens,
      showWelcome,
    });
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl rounded-[3rem] border border-white/20 dark:border-slate-800/50 glass p-8 sm:p-12 shadow-2xl"
      >
        <div className="mb-12 text-center">
          <div className="mx-auto mb-8 animate-float flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-sky-500 text-white shadow-2xl shadow-sky-500/30">
            <Sparkles size={40} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] font-black text-sky-600 dark:text-sky-400 mb-2">Welcome to the future</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-6">Meet Lina Intelligence</h1>
          <p className="mx-auto max-w-xl text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Your personal frontier intelligence, crafted for elegance and performance. Securely encrypted and entirely yours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Your Identity</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Full Name"
                className="mt-3 w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-6 py-4 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">AI Moniker</span>
              <input
                value={assistantName}
                onChange={(event) => setAssistantName(event.target.value)}
                required
                placeholder="Lina AI"
                className="mt-3 w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-6 py-4 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Groq API Backbone</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              required
              placeholder="sk-..."
              type="password"
              className="mt-3 w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-6 py-4 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
            />
            <p className="mt-3 text-[10px] text-slate-400 ml-4">
              Need a key? <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-sky-500 font-bold hover:underline">Provision one from Groq Console</a>
            </p>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Intelligence Directives</span>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-6 py-4 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 resize-none font-medium leading-relaxed"
            />
          </label>

          <div className="grid gap-8 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">AI Model</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-3 w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-6 py-4 text-slate-900 dark:text-slate-100 outline-none transition-all focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 font-medium"
              >
                <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Recommended)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Faster)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Temperature</span>
              <div className="mt-3 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(parseFloat(event.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Precise (0)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{temperature}</span>
                  <span>Creative (2)</span>
                </div>
              </div>
            </label>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Max Tokens</span>
              <div className="mt-3 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(parseInt(event.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Short (256)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{maxTokens}</span>
                  <span>Long (8192)</span>
                </div>
              </div>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="voiceEnabled"
                checked={voiceEnabled}
                onChange={(event) => setVoiceEnabled(event.target.checked)}
                className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <label htmlFor="voiceEnabled" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Enable Voice Responses
              </label>
            </div>
          </div>

          {voiceEnabled && (
            <div className="grid gap-8 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Voice Rate</span>
                <div className="mt-3 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceRate}
                    onChange={(event) => setVoiceRate(parseFloat(event.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{voiceRate}x</span>
                  </div>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-4">Voice Pitch</span>
                <div className="mt-3 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(event) => setVoicePitch(parseFloat(event.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{voicePitch}x</span>
                  </div>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-800 bg-white/50 dark:bg-slate-900/50 ml-4">Voice Volume</span>
                <div className="mt-3 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceVolume}
                    onChange={(event) => setVoiceVolume(parseFloat(event.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{Math.round(voiceVolume * 100)}%</span>
                  </div>
                </div>
              </label>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="showWelcome"
              checked={showWelcome}
              onChange={(event) => setShowWelcome(event.target.checked)}
              className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <label htmlFor="showWelcome" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Show welcome message on startup
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-[2rem] bg-sky-500 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-sky-600 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-sky-500/30"
          >
            Launch Experience
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default OnboardingScreen;
