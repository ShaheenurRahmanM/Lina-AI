import { Edit3, Pin, Trash2 } from 'lucide-react';
import { Conversation } from '../types';
import { useState } from 'react';

interface ChatListProps {
  chats: Conversation[];
  onSelect: (conversationId: string) => void;
  onPin: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
}

function ChatList({ chats, onSelect, onPin, onRename, onDelete }: ChatListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const handleEdit = (chatId: string, currentTitle: string) => {
    setEditingId(chatId);
    setTitle(currentTitle);
  };

  return (
    <div className="space-y-4">
      {chats.map((conversation) => (
        <div key={conversation.id} className="group relative rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 p-5 transition-all hover:border-sky-500/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm">
          {editingId === conversation.id ? (
            <div className="space-y-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onRename(conversation.id, title || 'Untitled chat');
                    setEditingId(null);
                  }}
                  className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                >
                  Apply
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => onSelect(conversation.id)} className="w-full text-left text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate block tracking-tight">
                {conversation.title}
              </button>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">{conversation.pinned ? 'Pinned' : 'Archive'}</span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => onPin(conversation.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all hover:border-sky-500 hover:text-sky-500 active:scale-90" title="Pin">
                    <Pin size={12} className={conversation.pinned ? 'fill-sky-500 text-sky-500' : ''} />
                  </button>
                  <button type="button" onClick={() => handleEdit(conversation.id, conversation.title)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all hover:border-sky-500 hover:text-sky-500 active:scale-90" title="Rename">
                    <Edit3 size={12} />
                  </button>
                  <button type="button" onClick={() => onDelete(conversation.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white active:scale-90" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatList;
