import { Sparkles, Zap, Code, BookOpen, Lightbulb, Edit } from 'lucide-react';

const PROMPTS = [
  { icon: Zap, label: 'Explain a concept', text: 'Explain a complex topic simply' },
  { icon: Code, label: 'Write code', text: 'Help me write or debug code' },
  { icon: BookOpen, label: 'Summarize', text: 'Summarize this text for me' },
  { icon: Lightbulb, label: 'Brainstorm', text: 'Brainstorm ideas for my project' },
  { icon: Edit, label: 'Write content', text: 'Help me write a professional email' },
  { icon: Sparkles, label: 'Be creative', text: 'Write a short creative story' },
];

interface EmptyChatScreenProps {
  onPromptSelect?: (prompt: string) => void;
}

function EmptyChatScreen({ onPromptSelect }: EmptyChatScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4 py-10 select-none">
      {/* Logo */}
      <div className="mb-6 animate-float">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 shadow-xl shadow-sky-500/30">
          <Sparkles size={28} className="text-white" />
        </div>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400 mb-2">
        Lina Intelligence
      </p>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
        How can I help?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Ask me anything — I'm powered by Llama 3.3 and ready to assist.
      </p>

      {/* Quick-start prompts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {PROMPTS.map(({ icon: Icon, label, text }) => (
          <button
            key={text}
            type="button"
            onClick={() => onPromptSelect?.(text)}
            className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all group"
          >
            <Icon
              size={18}
              className="text-sky-500 group-hover:scale-110 transition-transform"
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyChatScreen;
