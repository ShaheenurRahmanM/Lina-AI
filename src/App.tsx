import React, { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { createUserProfile, fetchUserProfile, initializeDatabase } from './db/client';
import { encryptApiKey, getStoredEncryptedApiKey } from './services/crypto';
import AppShell from './layouts/AppShell';
import OnboardingScreen from './components/OnboardingScreen';
import SettingsModal from './components/SettingsModal';
import { UserProfile } from './types';
import { RefreshCw } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT =
  'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant. You are concise, accurate, and always aim to provide the most useful response possible.';

// Error boundary to prevent white-screen crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred. You can safely reload the app.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all"
            >
              <RefreshCw size={16} /> Reload Lina AI
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [initialized, setInitialized] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hideOnboarding, setHideOnboarding] = useState(false);
  const { settings, setSettings } = useSettingsStore();
  const { loadConversations } = useChatStore();

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await initializeDatabase();
        const user = await fetchUserProfile();
        if (isMounted && user) {
          setProfile(user);
          await loadConversations();
        }
      } catch (error) {
        console.error('Initialization warning:', error);
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.remove('dark');
    } else {
      document.body.classList.add('dark');
    }
  }, [settings.theme]);

  const shouldShowOnboarding = useMemo(
    () => !profile && initialized && !hideOnboarding,
    [profile, initialized, hideOnboarding]
  );

  const handleCompleteOnboarding = async (form: {
    fullName: string;
    assistantName: string;
    apiKey: string;
    theme: 'dark' | 'light';
    systemPrompt: string;
    model?: string;
    voiceEnabled?: boolean;
    voiceName?: string;
    voiceRate?: number;
    voicePitch?: number;
    voiceVolume?: number;
    temperature?: number;
    maxTokens?: number;
    showWelcome?: boolean;
  }) => {
    try {
      if (form.apiKey?.trim()) {
        await encryptApiKey(form.apiKey.trim());
      }
      const user = await createUserProfile(form.fullName, form.assistantName);
      await setSettings({
        theme: form.theme,
        systemPrompt: form.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        // Use the selected model if valid, otherwise fallback to the supported default
        model: form.model && !['llama-3.1-70b-versatile', 'llama-3.3-70b-versatile'].includes(form.model) ? form.model : 'llama-3.1-8b-instant',
        voiceEnabled: form.voiceEnabled ?? false,
        voiceName: form.voiceName ?? 'default',
        voiceRate: form.voiceRate ?? 1,
        voicePitch: form.voicePitch ?? 1,
        voiceVolume: form.voiceVolume ?? 1,
        temperature: form.temperature ?? 0.7,
        maxTokens: form.maxTokens ?? 2048,
        showWelcome: form.showWelcome ?? false,
      });
      setProfile(user);
      setHideOnboarding(true);
      await loadConversations();
      toast.success('Welcome to Lina AI!');
    } catch (error) {
      toast.error('Could not save onboarding data.');
      console.error(error);
    }
  };

  const handleOpenSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  useEffect(() => {
    if (initialized && profile) {
      const key = getStoredEncryptedApiKey();
      if (!key) {
        toast('Please configure your Groq API key in Settings.', { icon: '🔑' });
      }
    }
  }, [profile, initialized]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen dark:bg-slate-950 dark:text-slate-100 bg-slate-50 text-slate-900 transition-colors">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AnimatePresence mode="wait">
          {shouldShowOnboarding ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="min-h-screen"
            >
              <OnboardingScreen onComplete={handleCompleteOnboarding} />
            </motion.div>
          ) : (
            initialized && (
              <AppShell onOpenSettings={handleOpenSettings} profile={profile} />
            )
          )}
        </AnimatePresence>
        <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
