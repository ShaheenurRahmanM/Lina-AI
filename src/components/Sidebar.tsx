import { useMemo } from 'react';
import { Plus, Search, Settings, Pin } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import ChatList from './ChatList';
import SearchBar from './SearchBar';

interface SidebarProps {
  onSelectConversation: (conversationId: string) => void;
  onOpenSettings: () => void;
  query: string;
  setQuery: (value: string) => void;
}

function Sidebar({ onSelectConversation, onOpenSettings, query, setQuery }: SidebarProps) {
  const { filteredConversations, addConversation, togglePin, removeConversation, renameConversation } = useChatStore();
  const pinned = useMemo(() => filteredConversations.filter((conversation) => conversation.pinned), [filteredConversations]);
  const recent = useMemo(() => filteredConversations.filter((conversation) => !conversation.pinned), [filteredConversations]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sky-600 dark:text-sky-400">Library</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Sessions</h2>
          </div>
          <button
            type="button"
            onClick={addConversation}
            className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white transition-all hover:bg-sky-600 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/20"
            aria-label="New chat"
          >
            <Plus size={22} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <SearchBar query={query} onQueryChange={setQuery} />
      </div>

      <div className="flex-1 overflow-y-auto pb-8 space-y-6 custom-scrollbar">
        {pinned.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 dark:text-slate-500 mb-4 px-2">Pinned</p>
            <ChatList chats={pinned} onSelect={onSelectConversation} onPin={togglePin} onRename={renameConversation} onDelete={removeConversation} />
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 dark:text-slate-500">History</p>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-500 transition-colors"
            >
              <Settings size={12} /> Config
            </button>
          </div>
          <ChatList chats={recent} onSelect={onSelectConversation} onPin={togglePin} onRename={renameConversation} onDelete={removeConversation} />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
