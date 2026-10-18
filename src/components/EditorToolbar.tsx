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
import { Tooltip } from './Tooltip';

interface EditorToolbarProps {
  onInsert: (syntax: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert }) => {
  return (
    <div className="flex items-center gap-0.5 px-3 h-9 bg-[#0e1118] border-b border-[#1e2636] overflow-x-auto no-scrollbar select-none text-slate-300">
      {/* Headings */}
      <Tooltip content="Heading 1" shortcut="#" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('h1')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Heading 2" shortcut="##" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('h2')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Heading 3" shortcut="###" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('h3')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Basic Formatting */}
      <Tooltip content="Tebal" shortcut="Ctrl+B" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('bold')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors font-bold"
          aria-label="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Miring" shortcut="Ctrl+I" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('italic')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors italic"
          aria-label="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Coret" shortcut="~~text~~" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('strike')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Inline Code" shortcut="`code`" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('code')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Quotes & Lists */}
      <Tooltip content="Kutipan (Quote)" shortcut=">" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('quote')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Daftar Poin (Bullet List)" shortcut="- item" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('bullet')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Daftar Nomor (Numbered List)" shortcut="1. item" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('number')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Checklist Tugas (Task)" shortcut="- [ ]" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('task')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Task List"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <div className="w-[1px] h-4 bg-[#1e2636] mx-1" />

      {/* Advanced Inserts */}
      <Tooltip content="Sisipkan Tautan" shortcut="[title](url)" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('link')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Link"
        >
          <Link className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Sisipkan Gambar" shortcut="![alt](url)" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('image')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Image"
        >
          <Image className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Sisipkan Tabel" shortcut="| col | col |" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('table')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Table"
        >
          <Table className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Blok Kode (Code Block)" shortcut="```lang" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('codeblock')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Code Block"
        >
          <FileCode className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Rumus LaTeX" shortcut="$$" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('math')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Math Formula"
        >
          <Sigma className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Garis Pembatas Horizontal" shortcut="---" position="bottom">
        <button
          type="button"
          onClick={() => onInsert('hr')}
          className="p-1.5 rounded hover:bg-[#182030] hover:text-white transition-colors"
          aria-label="Horizontal Rule"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  );
};
