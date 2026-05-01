import { Mic, Pause, Send, Square } from 'lucide-react';
import { useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onMicToggle: () => void;
  isListening: boolean;
  isGenerating: boolean;
  onStop: () => void;
  onRetry: () => void;
}

function ChatInput({
  value,
  onChange,
  onSend,
  onMicToggle,
  isListening,
  isGenerating,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && value.trim()) onSend();
    }
  };

  const canSend = value.trim().length > 0 && !isGenerating;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm focus-within:border-sky-400 dark:focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Lina AI…"
          disabled={isGenerating}
          className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none leading-relaxed py-1 max-h-48 disabled:opacity-60"
          style={{ minHeight: '24px' }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
          {/* Mic */}
          <button
            type="button"
            onClick={onMicToggle}
            disabled={isGenerating}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-90 ${
              isListening
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 disabled:opacity-40'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <Pause size={15} className="animate-pulse" /> : <Mic size={16} />}
          </button>

          {/* Send / Stop */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-90"
              aria-label="Stop generating"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/30 hover:bg-sky-600 transition-all active:scale-90 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-slate-400 dark:text-slate-600">
          {isGenerating ? (
            <span className="flex items-center gap-1.5 text-sky-500 dark:text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              Generating…
            </span>
          ) : (
            'Powered by Groq'
          )}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-600 hidden sm:block">
          Enter to send · Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}

export default ChatInput;
