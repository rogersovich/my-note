import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Copy
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
    moveNotesToFolder,
    createMultipleNotes,
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

  const [draggedNoteIds, setDraggedNoteIds] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>(activeNoteId ? [activeNoteId] : []);
  const [lastClickedNoteId, setLastClickedNoteId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);

  // Sync selectedNoteIds with activeNoteId if single-select
  useEffect(() => {
    if (activeNoteId && (!selectedNoteIds.length || (selectedNoteIds.length === 1 && !selectedNoteIds.includes(activeNoteId)))) {
      setSelectedNoteIds([activeNoteId]);
    }
  }, [activeNoteId]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'note' | 'folder' | 'empty';
    targetId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'empty',
    targetId: null,
  });

  // Close context menu on outside click, window resize, or Escape
  useEffect(() => {
    if (!contextMenu.isOpen) return;

    const handleClose = () => {
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.isOpen]);

  if (!sidebarOpen) return null;

  // Handle file upload from disk (.md, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const parsedFiles = await Promise.all(
      fileList.map(async (file) => {
        try {
          const content = await file.text();
          return { title: file.name, content };
        } catch (err) {
          console.error('Failed to read file:', file.name, err);
          return null;
        }
      })
    );

    const validFiles = parsedFiles.filter((f): f is { title: string; content: string } => f !== null);
    if (validFiles.length > 0) {
      createMultipleNotes(validFiles, targetFolderIdForNote || null);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTargetFolderIdForNote(null);
  };

  // Drag and drop local files from OS or move multiple notes internally
  const handleFileDropFromOs = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    // 1. If dragging existing internal notes
    let notesToMove = draggedNoteIds;
    if (notesToMove.length === 0) {
      try {
        const raw = e.dataTransfer.getData('application/json-mynote-ids');
        if (raw) notesToMove = JSON.parse(raw);
      } catch {}
    }

    if (notesToMove.length > 0) {
      moveNotesToFolder(notesToMove, folderId);
      setDraggedNoteIds([]);
      return;
    }

    // 2. If dragging external files from OS
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      const parsedFiles = await Promise.all(
        fileList.map(async (file) => {
          try {
            const content = await file.text();
            return { title: file.name, content };
          } catch (err) {
            console.error('Failed to read dropped file', err);
            return null;
          }
        })
      );

      const validFiles = parsedFiles.filter((f): f is { title: string; content: string } => f !== null);
      if (validFiles.length > 0) {
        createMultipleNotes(validFiles, folderId);
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
    const isSelected = selectedNoteIds.includes(note.id);
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
        onDragStart={(e) => {
          let toDrag: string[];
          if (selectedNoteIds.includes(note.id)) {
            toDrag = selectedNoteIds;
          } else {
            toDrag = [note.id];
            setSelectedNoteIds([note.id]);
          }
          setDraggedNoteIds(toDrag);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify(toDrag));
          e.dataTransfer.setData('application/json-mynote-ids', JSON.stringify(toDrag));
        }}
        onDragEnd={() => {
          setDraggedNoteIds([]);
          setDragOverFolderId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!draggedNoteIds.includes(note.id)) {
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFileDropFromOs(e, note.folderId);
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            setSelectedNoteIds((prev) => {
              const exists = prev.includes(note.id);
              const next = exists ? prev.filter((id) => id !== note.id) : [...prev, note.id];
              if (!exists) {
                setActiveNoteId(note.id);
              } else if (next.length > 0) {
                setActiveNoteId(next[next.length - 1]);
              }
              return next;
            });
            setLastClickedNoteId(note.id);
          } else if (e.shiftKey && lastClickedNoteId) {
            const currentIndex = filteredNotes.findIndex((n) => n.id === note.id);
            const lastIndex = filteredNotes.findIndex((n) => n.id === lastClickedNoteId);
            if (currentIndex !== -1 && lastIndex !== -1) {
              const start = Math.min(currentIndex, lastIndex);
              const end = Math.max(currentIndex, lastIndex);
              const rangeIds = filteredNotes.slice(start, end + 1).map((n) => n.id);
              setSelectedNoteIds(rangeIds);
              setActiveNoteId(note.id);
            }
          } else {
            setSelectedNoteIds([note.id]);
            setActiveNoteId(note.id);
            setLastClickedNoteId(note.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!selectedNoteIds.includes(note.id)) {
            setSelectedNoteIds([note.id]);
            setActiveNoteId(note.id);
            setLastClickedNoteId(note.id);
          }
          setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            type: 'note',
            targetId: note.id,
          });
        }}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs transition-colors my-0.5 ${
          isActive
            ? 'bg-[#182030] text-white font-medium border-l-2 border-blue-500'
            : isSelected
            ? 'bg-[#141b29] text-blue-200 font-medium border-l-2 border-blue-400'
            : 'text-slate-300 hover:bg-[#141824] hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1 mr-1">
          {isMd ? (
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : isSelected ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
          ) : (
            <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : isSelected ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
          )}
          <span className="truncate">{note.title}</span>
          {isSelected && selectedNoteIds.length > 1 && (
            <span className="shrink-0 px-1 py-0.2 text-[9px] font-mono bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
              sel
            </span>
          )}
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
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                isOpen: true,
                x: e.clientX,
                y: e.clientY,
                type: 'folder',
                targetId: folder.id,
              });
            }}
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
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => handleFileDropFromOs(e, folder.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'folder',
                    targetId: folder.id,
                  });
                }}
                style={{ paddingLeft: `${(depth + 1) * 14 + 16}px` }}
                className={`py-1 text-[11px] italic cursor-pointer transition-colors ${
                  dragOverFolderId === folder.id
                    ? 'text-blue-300 bg-blue-950/40 rounded'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Klik kanan atau seret file ke sini untuk menambah file"
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
    <aside 
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          isOpen: true,
          x: e.clientX,
          y: e.clientY,
          type: 'empty',
          targetId: null,
        });
      }}
      className="w-64 sm:w-72 bg-[#0e1118] border-r border-[#1e2636] flex flex-col h-full shrink-0 select-none z-20"
    >
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
            onContextMenu={(e) => e.stopPropagation()}
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
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            type: 'empty',
            targetId: null,
          });
        }}
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
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            type: 'empty',
            targetId: null,
          });
        }}
        className="p-2.5 border-t border-[#1e2636] text-xs font-medium text-slate-300 flex items-center justify-between bg-[#0b0d13]"
      >
        <span>Total: {notes.length} notes</span>
        <span>{folders.length} folders</span>
      </div>

      {/* Context Menu Popup */}
      {contextMenu.isOpen && (
        <div
          className="fixed z-50 bg-[#121620] border border-[#2b3548] rounded-lg shadow-2xl py-1 text-xs text-slate-200 min-w-[190px] animate-in fade-in duration-75 select-none"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 250)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 210)}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.type === 'note' && (() => {
            const currentNote = notes.find((n) => n.id === contextMenu.targetId);
            if (!currentNote) return null;

            const isMultiSelected = selectedNoteIds.includes(currentNote.id) && selectedNoteIds.length > 1;

            if (isMultiSelected) {
              return (
                <div className="flex flex-col">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-blue-300 border-b border-[#1e2636] truncate">
                    {selectedNoteIds.length} Catatan Dipilih
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      moveNotesToFolder(selectedNoteIds, null);
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                  >
                    <FolderIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pindahkan ke Root</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      selectedNoteIds.forEach((id) => toggleFavorite(id));
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Toggle Favorit Semua</span>
                  </button>

                  <div className="h-[1px] bg-[#1e2636] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                      if (confirm(`Hapus ${selectedNoteIds.length} catatan terpilih?`)) {
                        selectedNoteIds.forEach((id) => deleteNote(id));
                        setSelectedNoteIds([]);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus {selectedNoteIds.length} Catatan</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="flex flex-col">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#1e2636] truncate">
                  {currentNote.title}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setActiveNoteId(currentNote.id);
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Buka Catatan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    let dupTitle = currentNote.title;
                    if (dupTitle.includes('.')) {
                      dupTitle = dupTitle.replace(/(\.[^.]+)$/, ' (Copy)$1');
                    } else {
                      dupTitle = `${dupTitle} (Copy)`;
                    }
                    const newId = createNote(dupTitle, currentNote.folderId, currentNote.content);
                    setActiveNoteId(newId);
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duplikasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingNoteId(currentNote.id);
                    setEditingNoteTitle(currentNote.title);
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ubah Nama</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleFavorite(currentNote.id);
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <Star className={`w-3.5 h-3.5 ${currentNote.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                  <span>{currentNote.isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}</span>
                </button>

                <div className="h-[1px] bg-[#1e2636] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    if (confirm(`Hapus catatan "${currentNote.title}"?`)) {
                      deleteNote(currentNote.id);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Catatan</span>
                </button>
              </div>
            );
          })()}

          {contextMenu.type === 'folder' && (() => {
            const currentFolder = folders.find((f) => f.id === contextMenu.targetId);
            if (!currentFolder) return null;

            return (
              <div className="flex flex-col">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#1e2636] truncate">
                  {currentFolder.name}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTargetFolderIdForNote(currentFolder.id);
                    setIsCreatingNote(true);
                    if (!expandedFolderIds.includes(currentFolder.id)) {
                      toggleFolderExpanded(currentFolder.id);
                    }
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>File Baru di Sini</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFolderParentId(currentFolder.id);
                    setIsCreatingFolder(true);
                    if (!expandedFolderIds.includes(currentFolder.id)) {
                      toggleFolderExpanded(currentFolder.id);
                    }
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subfolder Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingFolderId(currentFolder.id);
                    setEditingFolderName(currentFolder.name);
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ubah Nama Folder</span>
                </button>

                <div className="h-[1px] bg-[#1e2636] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    if (confirm(`Hapus folder "${currentFolder.name}"? Catatan di dalamnya akan dipindah ke root.`)) {
                      deleteFolder(currentFolder.id);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Folder</span>
                </button>
              </div>
            );
          })()}

          {contextMenu.type === 'empty' && (
            <div className="flex flex-col">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#1e2636]">
                Root Explorer (Di Luar Folder)
              </div>

              <button
                type="button"
                onClick={() => {
                  setTargetFolderIdForNote(null);
                  setIsCreatingNote(true);
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                <span>File Baru di Root</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFolderParentId(null);
                  setIsCreatingFolder(true);
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Folder Baru di Root</span>
              </button>

              <div className="h-[1px] bg-[#1e2636] my-1" />

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-slate-200 hover:text-white hover:bg-[#182030] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload File (.md, .txt)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
