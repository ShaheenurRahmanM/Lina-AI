interface PromptCardProps {
  prompt: string;
}

function PromptCard({ prompt }: PromptCardProps) {
  return (
    <button
      type="button"
      className="group relative rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 text-left transition-all hover:border-sky-500/50 hover:bg-white dark:hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] shadow-sm backdrop-blur-sm"
    >
      <p className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors tracking-tight">{prompt}</p>
      <p className="mt-2 text-xs text-slate-400 font-medium">Click to try this prompt</p>
    </button>
  );
}

export default PromptCard;
