import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: string | string[];
}

function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const code = String(children ?? '').trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return <code className="rounded-lg bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-sky-600 dark:text-sky-400 font-bold">{children}</code>;
  }

  return (
    <div className="group relative my-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
            copied 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-500'
          }`}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
        <SyntaxHighlighter 
          language={language} 
          style={materialDark} 
          customStyle={{ 
            background: 'transparent', 
            margin: 0, 
            padding: 0,
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;
