interface TypingIndicatorProps {
  label?: string;
}

function TypingIndicator({ label = 'Lina AI is thinking...' }: TypingIndicatorProps) {
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-sm">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-3 w-3 animate-pulse rounded-full bg-sky-400" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-500 delay-150" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-500 delay-300" />
      </div>
    </div>
  );
}

export default TypingIndicator;
