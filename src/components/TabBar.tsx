import React from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { FileText, FileCode, X, Plus } from 'lucide-react';

export const TabBar: React.FC = () => {
  const { notes, openTabIds, activeNoteId, setActiveNoteId, closeTab, createNote } = useNoteStore();

  const openNotes = openTabIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);

  return (
    <div className="flex items-center h-10 bg-[#0b0e14] border-b border-[#21262d] overflow-x-auto no-scrollbar select-none">
      <div className="flex items-center h-full">
        {openNotes.map((note) => {
          const isActive = note.id === activeNoteId;
          const isMd = note.title.endsWith('.md');

          return (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`group flex items-center h-full px-3.5 border-r border-[#21262d] cursor-pointer text-xs transition-colors relative min-w-[130px] max-w-[200px] ${
                isActive
                  ? 'bg-[#161b24] text-slate-100 font-medium'
                  : 'bg-[#0b0e14] text-slate-400 hover:bg-[#121620] hover:text-slate-200'
              }`}
            >
              {/* Active Tab Top/Bottom Accent */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500" />
              )}

              {/* Icon */}
              {isMd ? (
                <FileCode className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              ) : (
                <FileText className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              )}

              {/* Title */}
              <span className="truncate flex-1">{note.title}</span>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(note.id);
                }}
                className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 hover:text-rose-400 transition-all shrink-0"
                title="Close tab"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={() => createNote('Untitled.md')}
          className="h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-[#161b24] transition-colors flex items-center justify-center border-r border-[#21262d]"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
