import React from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { FileText, FileCode, X, Plus } from 'lucide-react';
import { Tooltip } from './Tooltip';

export const TabBar: React.FC = () => {
  const { notes, openTabIds, activeNoteId, setActiveNoteId, closeTab, createNote } = useNoteStore();

  const openNotes = openTabIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n);

  return (
    <div 
      onWheel={(e) => {
        if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
        }
      }}
      className="flex items-center h-10 bg-[#0e1118] border-b border-[#1e2636] overflow-x-auto no-scrollbar select-none"
    >
      <div className="flex items-center h-full">
        {openNotes.map((note) => {
          const isActive = note.id === activeNoteId;
          const isMd = note.title.endsWith('.md');

          return (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`group flex items-center h-full px-3.5 border-r border-[#1e2636] cursor-pointer text-xs transition-colors relative min-w-[130px] max-w-[200px] ${
                isActive
                  ? 'bg-[#161c28] text-white font-medium'
                  : 'bg-[#0e1118] text-slate-300 hover:bg-[#141824] hover:text-white'
              }`}
            >
              {/* Active Tab Top/Bottom Accent */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
              )}

              {/* Icon */}
              {isMd ? (
                <FileCode className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              ) : (
                <FileText className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              )}

              {/* Title */}
              <span className="truncate flex-1">{note.title}</span>

              {/* Close Button */}
              <Tooltip content="Tutup Tab" position="bottom">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(note.id);
                  }}
                  className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#202838] hover:text-rose-400 transition-all shrink-0"
                  aria-label="Tutup tab"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          );
        })}

        {/* New Tab Button */}
        <Tooltip content="Tab Baru" position="bottom">
          <button
            type="button"
            onClick={() => createNote('Untitled.md')}
            className="h-full px-3 text-slate-300 hover:text-white hover:bg-[#161c28] transition-colors flex items-center justify-center border-r border-[#1e2636]"
            aria-label="Tab Baru"
          >
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
