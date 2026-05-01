import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import ChatPage from '../pages/ChatPage';
import SettingsPage from '../pages/SettingsPage';
import { isOnline } from '../utils/storage';
import { Moon, Sun, Settings, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface AppShellProps {
  onOpenSettings: () => void;
  profile: UserProfile | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function AppShell({ onOpenSettings, profile }: AppShellProps) {
  const { conversations, activeConversationId, setActiveConversation, setQuery, query } = useChatStore();
  const { settings, loadSettings, setSettings } = useSettingsStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    loadSettings();
    const updateOnline = () => setOnline(isOnline());
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [loadSettings]);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setShowInstallPrompt(false);
    if (choice.outcome === 'accepted') {
      console.log('PWA install accepted.');
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null,
    [activeConversationId, conversations]
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 glass px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 transition-all hover:border-sky-500/60 hover:text-sky-600 dark:hover:text-sky-300 lg:hidden active:scale-95 shadow-sm"
          >
            <Sparkles size={22} className="transition-transform group-hover:scale-110" />
          </button>
          <div className="min-w-0 flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sky-600 dark:text-sky-400 truncate">{profile ? `Welcome back, ${profile.fullName}` : 'Lina Intelligence'}</p>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate leading-none mt-0.5 tracking-tight">{profile?.assistantName ?? 'Think. Create. Assist.'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettingsPage((current) => !current)}
            className="hidden sm:inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all hover:border-sky-500/60 hover:text-sky-600 dark:hover:text-sky-300 shadow-sm active:scale-95"
          >
            <Settings size={18} /> <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 transition-all hover:border-sky-500/60 hover:text-sky-600 dark:hover:text-sky-300 shadow-sm active:scale-95"
            title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {settings.theme === 'dark' ? <Sun size={22} className="transition-transform group-hover:rotate-45" /> : <Moon size={22} className="transition-transform group-hover:-rotate-12" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {showInstallPrompt && (
          <div className="absolute right-6 top-24 z-30 rounded-3xl border border-slate-200/70 bg-white/95 dark:border-slate-800/70 dark:bg-slate-950/95 p-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <Sparkles size={18} className="text-sky-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Install Lina AI</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add the app to your home screen for quick offline access.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="mt-4 w-full rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-all"
            >
              Install App
            </button>
          </div>
        )}
        <aside className="hidden w-96 shrink-0 border-r border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-950/95 p-4 backdrop-blur-xl lg:block">
          <Sidebar onSelectConversation={setActiveConversation} onOpenSettings={onOpenSettings} query={query} setQuery={setQuery} />
        </aside>

        <main className="relative flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {showSettingsPage ? (
                <motion.div key="settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-auto">
                  <SettingsPage onClose={() => setShowSettingsPage(false)} />
                </motion.div>
              ) : (
                <motion.div key="chat-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden flex flex-col">
                  <ChatPage conversation={activeConversation} online={online} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)} onSelectConversation={setActiveConversation} query={query} setQuery={setQuery} onOpenSettings={onOpenSettings} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppShell;
