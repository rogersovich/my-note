import React from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Link, 
  Image, 
  Table, 
  Heading1, 
  Heading2, 
  Heading3, 
  Sigma, 
  FileCode,
  Minus
} from 'lucide-react';

interface EditorToolbarProps {
  onInsert: (syntax: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert }) => {
  return (
    <div className="flex items-center gap-0.5 px-3 h-9 bg-[#0e1118] border-b border-[#1e2636] overflow-x-auto no-scrollbar select-none text-slate-300">
      {/* Headings */}
      <button
        type="button"
        onClick={() => onInsert('h1')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Heading 1 (#)"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('h2')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Heading 2 (##)"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('h3')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Heading 3 (###)"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Basic Formatting */}
      <button
        type="button"
        onClick={() => onInsert('bold')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors font-bold"
        title="Bold (**text**)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('italic')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors italic"
        title="Italic (*text*)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('strike')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Strikethrough (~~text~~)"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('code')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Inline Code (`code`)"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Quotes & Lists */}
      <button
        type="button"
        onClick={() => onInsert('quote')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Quote (> text)"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('bullet')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Bullet List (- item)"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('number')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Numbered List (1. item)"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('task')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Task Checklist (- [ ] item)"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Advanced Inserts */}
      <button
        type="button"
        onClick={() => onInsert('link')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Insert Link ([title](url))"
      >
        <Link className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('image')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Insert Image (![alt](url))"
      >
        <Image className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('table')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Insert Table"
      >
        <Table className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('codeblock')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Code Block (```js)"
      >
        <FileCode className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('math')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="LaTeX Math Equation ($$)"
      >
        <Sigma className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onInsert('hr')}
        className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
        title="Horizontal Divider (---)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
