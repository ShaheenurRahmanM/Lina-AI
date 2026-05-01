import { useState } from 'react';
import { Copy, Edit3, Check } from 'lucide-react';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { formatTimestamp } from '../utils/format';

interface ChatMessageProps {
  message: Message;
  onEdit: (content: string) => void;
}

function ChatMessage({ message, onEdit }: ChatMessageProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (draft.trim()) onEdit(draft.trim());
    setEditing(false);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
          isAssistant
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}
      >
        {isAssistant ? 'AI' : 'ME'}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {isAssistant ? 'Lina AI' : 'You'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {formatTimestamp(message.createdAt)}
            {message.edited && ' · edited'}
          </span>
          {message.status === 'streaming' && (
            <span className="text-[10px] text-sky-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              Streaming
            </span>
          )}
        </div>

        {/* Bubble */}
        {editing ? (
          <div className="w-full space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setDraft(message.content); setEditing(false); }}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-prose ${
              isUser
                ? 'bg-sky-500 text-white rounded-tr-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            {/* Action buttons on hover */}
            <div className={`absolute -bottom-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'right-0' : 'left-0'}`}>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {message.role !== 'system' && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <Edit3 size={11} /> Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
