import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: string | string[];
}

function CodeBlock({ inline, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const code = Array.isArray(children)
    ? children.join('')
    : typeof children === 'string'
    ? children
    : String(children ?? '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  if (inline) {
    return (
      <code className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">
        {code}
      </code>
    );
  }

  return (
    <div className="group relative my-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95 ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar font-mono text-xs">
        <SyntaxHighlighter
          language={language}
          style={materialDark}
          customStyle={{
            background: 'transparent',
            margin: 0,
            padding: 0,
            fontSize: '0.85rem',
            lineHeight: '1.5',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default CodeBlock;
