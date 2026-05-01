import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { createUserProfile, fetchUserProfile, initializeDatabase } from './db/client';
import { decryptApiKey, encryptApiKey, getStoredEncryptedApiKey } from './services/crypto';
import AppShell from './layouts/AppShell';
import OnboardingScreen from './components/OnboardingScreen';
import SettingsModal from './components/SettingsModal';
import { AppSettings, UserProfile } from './types';

const DEFAULT_SYSTEM_PROMPT = 'You are Lina AI, an intelligent, helpful, professional and friendly AI assistant.';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hideOnboarding, setHideOnboarding] = useState(false);
  const { settings, setSettings } = useSettingsStore();
  const { loadConversations, activeConversationId } = useChatStore();

  useEffect(() => {
    initializeDatabase()
      .then(async () => {
        const user = await fetchUserProfile();
        if (user) {
          setProfile(user);
          await loadConversations();
        }
        setInitialized(true);
      })
      .catch((error) => {
        toast.error('Unable to initialize local storage.');
        console.error(error);
      });
  }, [loadConversations]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.remove('dark');
    } else {
      document.body.classList.add('dark');
    }
  }, [settings.theme]);

  const shouldShowOnboarding = useMemo(() => !profile && initialized && !hideOnboarding, [profile, initialized, hideOnboarding]);

  const handleCompleteOnboarding = async (form: {
    fullName: string;
    assistantName: string;
    apiKey: string;
    theme: 'dark' | 'light';
    systemPrompt: string;
  }) => {
    try {
      await encryptApiKey(form.apiKey);
      const user = await createUserProfile(form.fullName, form.assistantName);
      await setSettings({
        theme: form.theme,
        systemPrompt: form.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        model: 'llama-3.1-70b-versatile',
        voiceEnabled: true,
        showWelcome: false
      });
      setProfile(user);
      setHideOnboarding(true);
      await loadConversations();
    } catch (error) {
      toast.error('Could not save onboarding data.');
      console.error(error);
    }
  };

  const handleOpenSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  useEffect(() => {
    const key = getStoredEncryptedApiKey();
    if (!key && profile) {
      toast('Please configure your Groq API key in settings.', { icon: '🔑' });
    }
  }, [profile]);

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-slate-100 bg-slate-50 text-slate-900 transition-colors">
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <AnimatePresence>
        {shouldShowOnboarding ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
  );
}

export default App;
