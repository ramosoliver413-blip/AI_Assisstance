import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="markdown-body space-y-3 text-slate-200 leading-relaxed text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1.5 border-b border-slate-700">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-indigo-300 mt-3 mb-1.5">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold text-slate-300 mt-2 mb-1">{children}</h4>
          ),
          p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-200">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-300">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 bg-slate-900/70 pl-3.5 py-2 my-2.5 rounded-r-lg text-slate-300 italic text-sm border-t border-b border-r border-slate-800">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-slate-700 rounded-xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-700 text-xs text-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900 text-slate-200 font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800 bg-slate-800/80">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-700/50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 text-left font-semibold text-slate-300">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-slate-300">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">{children}</em>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code
                  className="bg-slate-900/90 text-indigo-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                  <span>{match ? match[1] : 'Code / Text'}</span>
                  <button
                    onClick={() => handleCopy(codeString)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedCode === codeString ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto leading-relaxed text-slate-200">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
