import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Settings } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

interface MobileMenuProps {
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  query: string;
  setQuery: (value: string) => void;
  onOpenSettings: () => void;
}

function MobileMenu({ onClose, onSelectConversation, query, setQuery, onOpenSettings }: MobileMenuProps) {
  const { filteredConversations, addConversation, togglePin, removeConversation, renameConversation } = useChatStore();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="flex h-full w-full max-w-xs sm:max-w-sm flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/95 p-5 shadow-2xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] font-semibold text-sky-600 dark:text-sky-300/70">Lina AI</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mobile Menu</h2>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => { addConversation(); onClose(); }}
            className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 shadow-lg shadow-sky-500/20"
          >
            <Plus size={18} /> New chat
          </button>

          <div className="mb-6">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/80 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pb-6">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 p-4 transition-all hover:border-sky-500/40">
                  <button type="button" onClick={() => { onSelectConversation(conversation.id); onClose(); }} className="w-full text-left text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                    {conversation.title}
                  </button>
                  <div className="mt-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <button type="button" onClick={() => togglePin(conversation.id)} className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-2 transition hover:text-sky-500 dark:hover:text-sky-400" title="Pin">
                      <Settings size={14} />
                    </button>
                    <button type="button" onClick={() => removeConversation(conversation.id)} className="rounded-xl border border-rose-200 dark:border-rose-500/80 bg-rose-50 dark:bg-slate-900/80 p-2 text-rose-500 dark:text-rose-300 transition hover:bg-rose-500/10" title="Delete">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-500 py-10">No chats found</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings size={18} /> Settings
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MobileMenu;
