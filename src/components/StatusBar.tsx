import React from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { countWordsAndChars } from '../utils/editorUtils';
import { Folder, FileText, CheckCircle2, Cloud } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { notes, folders, activeNoteId, syncStatus, currentUser } = useNoteStore();

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const activeFolder = activeNote?.folderId
    ? folders.find((f) => f.id === activeNote.folderId)
    : null;

  const content = activeNote ? activeNote.content : '';
  const { chars, words, lines, readTimeMinutes } = countWordsAndChars(content);

  return (
    <footer className="h-6 bg-[#0e1118] border-t border-[#1e2636] px-3 flex items-center justify-between text-[11px] text-slate-300 select-none z-20">
      {/* Left: Active File Location */}
      <div className="flex items-center gap-2 truncate">
        {activeNote ? (
          <>
            <div className="flex items-center gap-1 text-slate-300">
              {activeFolder ? (
                <>
                  <Folder className="w-3 h-3 text-amber-400/90" />
                  <span className="font-medium text-slate-200">{activeFolder.name}</span>
                  <span className="text-slate-500">/</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 font-mono">Root</span>
                  <span className="text-slate-500">/</span>
                </>
              )}
              <FileText className="w-3 h-3 text-blue-400" />
              <span className="font-semibold text-slate-100">{activeNote.title}</span>
            </div>

            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-[10px] text-slate-300 font-mono">
              {activeNote.updatedAt
                ? `Saved ${new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Unsaved'}
            </span>
          </>
        ) : (
          <span className="text-slate-400">No note selected</span>
        )}
      </div>

      {/* Right: Word counts, sync state & dialect */}
      <div className="flex items-center gap-3">
        {activeNote && (
          <div className="hidden md:flex items-center gap-2 text-slate-300 font-mono text-[11px]">
            <span>{lines} lines</span>
            <span className="text-slate-600">•</span>
            <span>{words} words</span>
            <span className="text-slate-600">•</span>
            <span>{chars} chars</span>
            <span className="text-slate-600">•</span>
            <span>~{readTimeMinutes} min read</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-slate-300">
          {syncStatus === 'synced' ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Realtime Cloud</span>
            </span>
          ) : syncStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="hidden sm:inline text-[10px]">Syncing...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-300">
              <Cloud className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline text-[10px]">
                {currentUser ? 'Offline' : 'Local Storage'}
              </span>
            </span>
          )}
        </div>

        <span className="hidden sm:inline font-mono text-[10px] text-slate-200 bg-[#161c28] px-1.5 py-0.5 rounded border border-[#2b3548]">
          GFM / UTF-8
        </span>
      </div>
    </footer>
  );
};
