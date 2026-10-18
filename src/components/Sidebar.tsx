import React, { useState, useRef } from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { 
  FolderPlus, 
  FilePlus, 
  Upload, 
  Search, 
  Folder as FolderIcon, 
  FolderOpen, 
  FileText, 
  FileCode, 
  Star, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown,
  X
} from 'lucide-react';
import type { Folder, Note } from '../types';

export const Sidebar: React.FC = () => {
  const {
    notes,
    folders,
    activeNoteId,
    setActiveNoteId,
    createNote,
    createFolder,
    renameFolder,
    deleteFolder,
    renameNote,
    deleteNote,
    toggleFavorite,
    moveNoteToFolder,
    expandedFolderIds,
    toggleFolderExpanded,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    sidebarOpen,
  } = useNoteStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Inline input states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderParentId, setFolderParentId] = useState<string | null>(null);

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [targetFolderIdForNote, setTargetFolderIdForNote] = useState<string | null>(null);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');

  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);

  if (!sidebarOpen) return null;

  // Handle file upload from disk (.md, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        createNote(file.name, targetFolderIdForNote || null, text);
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTargetFolderIdForNote(null);
  };

  // Drag and drop local files from OS onto browser sidebar
  const handleFileDropFromOs = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    // If dragging an existing internal note
    if (draggedNoteId) {
      moveNoteToFolder(draggedNoteId, folderId);
      setDraggedNoteId(null);
      return;
    }

    // If dragging external files from OS
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        try {
          const content = await file.text();
          createNote(file.name, folderId, content);
        } catch (err) {
          console.error('Failed to read dropped file', err);
        }
      }
    }
  };

  // Filter notes based on category and search query
  const filteredNotes = notes.filter((note) => {
    // Search query filter
    const matchesSearch =
      searchQuery.trim() === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category filter
    if (filterCategory === 'favs') return note.isFavorite;
    if (filterCategory === 'recent') {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000 * 7; // Last 7 days
      return note.updatedAt > dayAgo;
    }
    return true;
  });

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), folderParentId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setFolderParentId(null);
    }
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim()) {
      let title = newNoteTitle.trim();
      if (!title.includes('.')) title += '.md';
      createNote(title, targetFolderIdForNote);
      setNewNoteTitle('');
      setIsCreatingNote(false);
      setTargetFolderIdForNote(null);
    }
  };

  const handleRenameFolderSubmit = (id: string) => {
    if (editingFolderName.trim()) {
      renameFolder(id, editingFolderName.trim());
      setEditingFolderId(null);
    }
  };

  const handleRenameNoteSubmit = (id: string) => {
    if (editingNoteTitle.trim()) {
      let title = editingNoteTitle.trim();
      if (!title.includes('.')) title += '.md';
      renameNote(id, title);
      setEditingNoteId(null);
    }
  };

  // Render Note List Item
  const renderNoteItem = (note: Note, depth: number = 0) => {
    const isActive = note.id === activeNoteId;
    const isMd = note.title.endsWith('.md');
    const isEditing = editingNoteId === note.id;

    if (isEditing) {
      return (
        <form
          key={note.id}
          onSubmit={(e) => {
            e.preventDefault();
            handleRenameNoteSubmit(note.id);
          }}
          className="px-2 py-1 flex items-center gap-1"
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
        >
          <input
            type="text"
            value={editingNoteTitle}
            onChange={(e) => setEditingNoteTitle(e.target.value)}
            onBlur={() => handleRenameNoteSubmit(note.id)}
            autoFocus
            className="w-full bg-[#0b0d13] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none"
          />
        </form>
      );
    }

    return (
      <div
        key={note.id}
        draggable
        onDragStart={() => setDraggedNoteId(note.id)}
        onDragEnd={() => setDraggedNoteId(null)}
        onClick={() => setActiveNoteId(note.id)}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs transition-colors my-0.5 ${
          isActive
            ? 'bg-[#182030] text-white font-medium border-l-2 border-blue-500'
            : 'text-slate-300 hover:bg-[#141824] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1 mr-1">
          {isMd ? (
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
          ) : (
            <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
          )}
          <span className="truncate">{note.title}</span>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(note.id);
            }}
            className={`p-1 rounded hover:bg-[#1e2738] ${
              note.isFavorite ? 'text-amber-400 opacity-100' : 'text-slate-400 hover:text-amber-400'
            }`}
            title={note.isFavorite ? 'Favorited' : 'Favorite'}
          >
            <Star className={`w-3 h-3 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingNoteId(note.id);
              setEditingNoteTitle(note.title);
            }}
            className="p-1 rounded hover:bg-[#1e2738] text-slate-400 hover:text-slate-100"
            title="Rename"
          >
            <Edit3 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Hapus catatan "${note.title}"?`)) {
                deleteNote(note.id);
              }
            }}
            className="p-1 rounded hover:bg-[#1e2738] text-slate-400 hover:text-rose-400"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Render Folder Tree Item
  const renderFolder = (folder: Folder, depth: number = 0) => {
    const isExpanded = expandedFolderIds.includes(folder.id);
    const childNotes = filteredNotes.filter((n) => n.folderId === folder.id);
    const childFolders = folders.filter((f) => f.parentId === folder.id);
    const isEditing = editingFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameFolderSubmit(folder.id);
            }}
            className="px-2 py-1 flex items-center gap-1"
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
          >
            <input
              type="text"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onBlur={() => handleRenameFolderSubmit(folder.id)}
              autoFocus
              className="w-full bg-[#0b0d13] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none"
            />
          </form>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverFolderId(folder.id);
            }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => handleFileDropFromOs(e, folder.id)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs transition-colors my-0.5 ${
              isDragOver
                ? 'bg-blue-950/60 border border-blue-500'
                : 'text-slate-200 hover:bg-[#141824]'
            }`}
          >
            {/* Folder Toggle & Name */}
            <div
              onClick={() => toggleFolderExpanded(folder.id)}
              className="flex items-center gap-1.5 truncate min-w-0 flex-1 mr-1"
            >
              <span className="text-slate-400 hover:text-slate-200 p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>

              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <FolderIcon className="w-4 h-4 text-amber-400/90 shrink-0" />
              )}

              <span className="truncate font-medium">{folder.name}</span>
              <span className="text-[10px] text-slate-400 ml-1 font-mono">
                ({childNotes.length})
              </span>
            </div>

            {/* Folder Hover Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetFolderIdForNote(folder.id);
                  setIsCreatingNote(true);
                  if (!isExpanded) toggleFolderExpanded(folder.id);
                }}
                className="p-1 rounded hover:bg-[#1e2738] text-slate-300 hover:text-white"
                title="New file in this folder"
              >
                <FilePlus className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolderId(folder.id);
                  setEditingFolderName(folder.name);
                }}
                className="p-1 rounded hover:bg-[#1e2738] text-slate-300 hover:text-white"
                title="Rename folder"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Hapus folder "${folder.name}"? Catatan di dalamnya akan dipindah ke root.`)) {
                    deleteFolder(folder.id);
                  }
                }}
                className="p-1 rounded hover:bg-[#1e2738] text-slate-300 hover:text-rose-400"
                title="Delete folder"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Expanded Folder Contents */}
        {isExpanded && (
          <div className="flex flex-col">
            {childFolders.map((sub) => renderFolder(sub, depth + 1))}
            {childNotes.map((n) => renderNoteItem(n, depth + 1))}
            {childFolders.length === 0 && childNotes.length === 0 && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 16}px` }}
                className="py-1 text-[11px] text-slate-400 italic"
              >
                Empty folder (drag files here)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Top level folders and root notes
  const rootFolders = folders.filter((f) => f.parentId === null);
  const rootNotes = filteredNotes.filter((n) => n.folderId === null);

  return (
    <aside className="w-64 sm:w-72 bg-[#0e1118] border-r border-[#1e2636] flex flex-col h-full shrink-0 select-none z-20">
      {/* Hidden File Input for uploading from disk */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.txt,.markdown,.text"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-[#1e2636]">
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Explorer
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setTargetFolderIdForNote(null);
              setIsCreatingNote(true);
            }}
            className="p-1.5 rounded hover:bg-[#182030] text-slate-300 hover:text-white transition-colors"
            title="New File"
          >
            <FilePlus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFolderParentId(null);
              setIsCreatingFolder(true);
            }}
            className="p-1.5 rounded hover:bg-[#182030] text-slate-300 hover:text-amber-400 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-[#182030] text-slate-300 hover:text-blue-400 transition-colors"
            title="Upload Files (.md, .txt)"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141822] border border-[#222a3a] focus:border-blue-500 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (All, Recent, Favs) */}
      <div className="px-2.5 pb-2">
        <div className="grid grid-cols-3 bg-[#121620] p-0.5 rounded-md border border-[#222a3a] text-[11px] text-center font-medium">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`py-1 rounded transition-colors ${
              filterCategory === 'all'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#182030]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('recent')}
            className={`py-1 rounded transition-colors ${
              filterCategory === 'recent'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#182030]'
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('favs')}
            className={`py-1 rounded transition-colors ${
              filterCategory === 'favs'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#182030]'
            }`}
          >
            Favs
          </button>
        </div>
      </div>

      {/* New Folder Creation Inline Form */}
      {isCreatingFolder && (
        <form
          onSubmit={handleCreateFolderSubmit}
          className="mx-2.5 mb-2 p-2 bg-[#141824] border border-blue-500/50 rounded-md flex flex-col gap-1.5"
        >
          <span className="text-[11px] text-blue-400 font-medium">Create New Folder</span>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              className="w-full bg-[#0b0d13] border border-[#283245] focus:border-blue-500 rounded px-2 py-1 text-xs text-slate-100 outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-1 hover:bg-[#202838] text-slate-300 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* New Note Creation Inline Form */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateNoteSubmit}
          className="mx-2.5 mb-2 p-2 bg-[#141824] border border-blue-500/50 rounded-md flex flex-col gap-1.5"
        >
          <span className="text-[11px] text-blue-400 font-medium">Create New Note</span>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="e.g. My Note.md"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              autoFocus
              className="w-full bg-[#0b0d13] border border-[#283245] focus:border-blue-500 rounded px-2 py-1 text-xs text-slate-100 outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="px-2 py-1 hover:bg-[#202838] text-slate-300 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Explorer Tree Section */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverFolderId('root');
        }}
        onDragLeave={() => setDragOverFolderId(null)}
        onDrop={(e) => handleFileDropFromOs(e, null)}
        className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scroll"
      >
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 px-2 py-1.5 uppercase tracking-wider">
          <span>Workspaces</span>
          <span className="text-[10px] text-slate-400 font-normal">Drag files to move</span>
        </div>

        {/* Folders */}
        {rootFolders.map((folder) => renderFolder(folder, 0))}

        {/* Root Notes */}
        {rootNotes.map((note) => renderNoteItem(note, 0))}

        {/* If empty */}
        {rootFolders.length === 0 && rootNotes.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 px-4">
            No notes found. Click <span className="text-blue-400 font-medium">+ File</span> or drag `.md` / `.txt` files here to start.
          </div>
        )}
      </div>

      {/* Bottom Drop Zone / Helper */}
      <div className="p-2.5 border-t border-[#1e2636] text-xs font-medium text-slate-300 flex items-center justify-between bg-[#0b0d13]">
        <span>Total: {notes.length} notes</span>
        <span>{folders.length} folders</span>
      </div>
    </aside>
  );
};
