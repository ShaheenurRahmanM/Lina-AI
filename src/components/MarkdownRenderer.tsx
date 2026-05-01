import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none 
      prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100
      prose-p:leading-relaxed prose-p:text-slate-800 dark:prose-p:text-slate-200
      prose-a:text-sky-500 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
      prose-strong:font-black prose-strong:text-slate-900 dark:prose-strong:text-slate-100
      prose-code:text-sky-600 dark:prose-code:text-sky-400 prose-code:font-bold
      prose-ul:list-disc prose-ol:list-decimal
      prose-li:my-1
      prose-table:border-collapse prose-table:w-full
      prose-th:bg-slate-100 dark:prose-th:bg-slate-800/50 prose-th:p-3 prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-widest
      prose-td:p-3 prose-td:border-b prose-td:border-slate-100 dark:prose-td:border-slate-800/50
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ inline, className, children, ...props }: any) => (
            <CodeBlock inline={inline} className={className}>
              {children as string | string[]}
            </CodeBlock>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
