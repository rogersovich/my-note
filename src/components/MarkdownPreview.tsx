import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { useNoteStore } from '../store/useNoteStore';
import { Check, Copy } from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface MarkdownPreviewHandle {
  scrollToPercentage: (percentage: number) => void;
}

interface MarkdownPreviewProps {
  onScrollPercentage?: (percentage: number) => void;
}

// Frontmatter metadata parser
function extractFrontmatter(content: string): { frontmatter: Record<string, any> | null; markdown: string } {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/);
  if (!match) return { frontmatter: null, markdown: content };

  const rawYaml = match[1];
  const remainingMarkdown = content.slice(match[0].length);
  const metadata: Record<string, any> = {};

  rawYaml.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value.replace(/'/g, '"'));
        } catch {
          // ignore
        }
      } else {
        value = value.replace(/^["']|["']$/g, '');
      }
      metadata[key] = value;
    }
  });

  return { frontmatter: metadata, markdown: remainingMarkdown };
}

// Custom code block with Copy button & language tag
const PreBlock: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, ...props }) => (
  <div className="relative group my-4 rounded-lg overflow-hidden border border-[#1e2636] bg-[#0b0d13]">
    <pre {...props} className="m-0 p-4 overflow-x-auto text-sm">
      {children}
    </pre>
  </div>
);

const CodeBlock = ({ className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !String(children).includes('\n');
  const [copied, setCopied] = useState(false);

  if (isInline) {
    return (
      <code className="px-1.5 py-0.5 rounded text-xs bg-[#161c28] text-sky-300 border border-[#2b3548] font-mono" {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute -top-3 right-0 flex items-center gap-1.5 z-10">
        {match && (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#161c28] text-slate-300 border border-[#263042]">
            {match[1]}
          </span>
        )}
        <Tooltip content={copied ? 'Tersalin!' : 'Salin Kode'} position="top">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161c28] hover:bg-[#1f2738] text-[11px] text-slate-200 border border-[#263042] transition-colors"
            aria-label="Salin kode"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
};

const markdownComponents = {
  pre: PreBlock,
  code: CodeBlock,
};

export const MarkdownPreview = forwardRef<MarkdownPreviewHandle, MarkdownPreviewProps>(
  ({ onScrollPercentage }, ref) => {
    const { activeNoteId, notes, syncScrollEnabled, fontSize } = useNoteStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const activeNote = notes.find((n) => n.id === activeNoteId);
    const rawContent = activeNote ? activeNote.content : '';

    const { frontmatter, markdown: cleanMarkdown } = extractFrontmatter(rawContent);

    useImperativeHandle(ref, () => ({
      scrollToPercentage: (percentage: number) => {
        if (!containerRef.current) return;
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        containerRef.current.scrollTop = maxScroll * percentage;
      },
    }));

    const handleScroll = () => {
      if (!syncScrollEnabled || !onScrollPercentage || !containerRef.current) return;
      const target = containerRef.current;
      const maxScroll = target.scrollHeight - target.clientHeight;
      if (maxScroll > 0) {
        onScrollPercentage(target.scrollTop / maxScroll);
      }
    };

    if (!activeNote) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium bg-[#0e1118] text-sm">
          No note active
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 h-full overflow-y-auto p-6 md:p-8 bg-[#0e1118] custom-scroll select-text"
      >
        <div 
          className="max-w-3xl mx-auto markdown-preview"
          style={{ fontSize: `${fontSize + 1}px` }}
        >
          {/* Frontmatter metadata table preview (like reference image) */}
          {frontmatter && Object.keys(frontmatter).length > 0 && (
            <div className="mb-6 rounded-lg overflow-hidden border border-[#222a3a] bg-[#141822] shadow-sm">
              <table className="w-full text-xs m-0">
                <tbody>
                  {Object.entries(frontmatter).map(([key, val]) => (
                    <tr key={key} className="border-b border-[#1e2636] last:border-b-0">
                      <td className="w-28 font-medium text-slate-300 bg-[#10141e] px-3 py-2 border-r border-[#1e2636]">
                        {key}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1">
                            {val.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] bg-[#182030] text-blue-300 border border-blue-500/30"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          String(val)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Main Markdown Body */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={markdownComponents}
          >
            {cleanMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
);
