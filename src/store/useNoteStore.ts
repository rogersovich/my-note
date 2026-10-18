import { create } from 'zustand';
import type { Note, Folder, ViewMode, SyncStatus, UserProfile } from '../types';
import { INITIAL_FOLDERS, INITIAL_NOTES } from '../data/initialData';
import { 
  syncNoteToFirestore, 
  deleteNoteFromFirestore, 
  syncFolderToFirestore, 
  deleteFolderFromFirestore,
  getStoredFirebaseConfig
} from '../services/firebase';

const STORAGE_NOTES = 'mynote_local_notes';
const STORAGE_FOLDERS = 'mynote_local_folders';
const STORAGE_TABS = 'mynote_open_tabs';
const STORAGE_ACTIVE_NOTE = 'mynote_active_note';

// BroadcastChannel for instant zero-quota multi-tab sync on same machine
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('mynote_sync_bus');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

function loadInitialNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTES;
}

function loadInitialFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_FOLDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FOLDERS;
}

function loadInitialTabs(): { tabs: string[]; active: string | null } {
  try {
    const rawTabs = localStorage.getItem(STORAGE_TABS);
    const rawActive = localStorage.getItem(STORAGE_ACTIVE_NOTE);
    const tabs = rawTabs ? JSON.parse(rawTabs) : ['note-welcome'];
    const active = rawActive || (tabs.length > 0 ? tabs[0] : null);
    return { tabs, active };
  } catch {
    return { tabs: ['note-welcome'], active: 'note-welcome' };
  }
}

interface NoteState {
  notes: Note[];
  folders: Folder[];
  openTabIds: string[];
  activeNoteId: string | null;
  expandedFolderIds: string[];
  
  // UI preferences
  viewMode: ViewMode;
  searchQuery: string;
  filterCategory: 'all' | 'recent' | 'favs';
  sidebarOpen: boolean;
  syncScrollEnabled: boolean;
  fontSize: number;
  syncStatus: SyncStatus;

  // Auth & Cloud
  currentUser: UserProfile | null;
  isFirebaseConfigured: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: 'all' | 'recent' | 'favs') => void;
  toggleSidebar: () => void;
  toggleSyncScroll: () => void;
  setFontSize: (size: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setCurrentUser: (user: UserProfile | null) => void;
  setFirebaseConfigured: (status: boolean) => void;

  // Note actions
  setActiveNoteId: (id: string | null) => void;
  openTab: (noteId: string) => void;
  closeTab: (noteId: string) => void;
  createNote: (title?: string, folderId?: string | null, content?: string) => string;
  updateNoteContent: (id: string, content: string) => void;
  renameNote: (id: string, newTitle: string) => void;
  deleteNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => void;
  moveNotesToFolder: (noteIds: string[], folderId: string | null) => void;
  createMultipleNotes: (files: { title: string; content?: string }[], folderId?: string | null) => string[];

  // Folder actions
  createFolder: (name: string, parentId?: string | null, color?: string) => string;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (folderId: string) => void;

  // Mass Cloud Sync
  setCloudData: (notes: Note[], folders: Folder[]) => void;
  initSyncListeners: () => void;
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const initialTabState = loadInitialTabs();

export const useNoteStore = create<NoteState>((set, get) => {
  // Listen to BroadcastChannel messages from other tabs
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NOTE_UPDATED') {
        const { id, content, updatedAt } = payload;
        set((state) => {
          const notes = state.notes.map((n) =>
            n.id === id ? { ...n, content, updatedAt } : n
          );
          localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
          return { notes };
        });
      } else if (type === 'NOTE_CREATED') {
        set((state) => {
          if (state.notes.some(n => n.id === payload.id)) return state;
          const notes = [payload, ...state.notes];
          localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
          return { notes };
        });
      } else if (type === 'NOTE_DELETED') {
        set((state) => {
          const notes = state.notes.filter(n => n.id !== payload.id);
          localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
          return { notes };
        });
      } else if (type === 'FOLDER_UPDATED') {
        set(() => {
          localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(payload));
          return { folders: payload };
        });
      }
    };
  }

  return {
    notes: loadInitialNotes(),
    folders: loadInitialFolders(),
    openTabIds: initialTabState.tabs,
    activeNoteId: initialTabState.active,
    expandedFolderIds: ['folder-workspace', 'folder-personal'],

    viewMode: 'split',
    searchQuery: '',
    filterCategory: 'all',
    sidebarOpen: true,
    syncScrollEnabled: true,
    fontSize: 14,
    syncStatus: 'local',

    currentUser: null,
    isFirebaseConfigured: !!getStoredFirebaseConfig(),

    setViewMode: (mode) => set({ viewMode: mode }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterCategory: (category) => set({ filterCategory: category }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    toggleSyncScroll: () => set((s) => ({ syncScrollEnabled: !s.syncScrollEnabled })),
    setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(22, size)) }),
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    setCurrentUser: (currentUser) => {
      set({ 
        currentUser, 
        syncStatus: currentUser ? 'synced' : 'local' 
      });

      // If user just logged in, assign user.uid to unowned local notes and sync them to Firestore
      if (currentUser) {
        const state = get();
        const updatedNotes = state.notes.map((note) => {
          if (!note.userId) {
            const withUser = { ...note, userId: currentUser.uid };
            syncNoteToFirestore(withUser);
            return withUser;
          }
          return note;
        });

        const updatedFolders = state.folders.map((folder) => {
          if (!folder.userId) {
            const withUser = { ...folder, userId: currentUser.uid };
            syncFolderToFirestore(withUser);
            return withUser;
          }
          return folder;
        });

        localStorage.setItem(STORAGE_NOTES, JSON.stringify(updatedNotes));
        localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(updatedFolders));
        set({ notes: updatedNotes, folders: updatedFolders });
      }
    },
    setFirebaseConfigured: (isFirebaseConfigured) => set({ isFirebaseConfigured }),

    setActiveNoteId: (id) => {
      set({ activeNoteId: id });
      if (id) {
        localStorage.setItem(STORAGE_ACTIVE_NOTE, id);
        get().openTab(id);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_NOTE);
      }
    },

    openTab: (noteId) => {
      set((state) => {
        if (!state.openTabIds.includes(noteId)) {
          const newTabs = [...state.openTabIds, noteId];
          localStorage.setItem(STORAGE_TABS, JSON.stringify(newTabs));
          return { openTabIds: newTabs, activeNoteId: noteId };
        }
        return { activeNoteId: noteId };
      });
      localStorage.setItem(STORAGE_ACTIVE_NOTE, noteId);
    },

    closeTab: (noteId) => {
      set((state) => {
        const newTabs = state.openTabIds.filter((id) => id !== noteId);
        localStorage.setItem(STORAGE_TABS, JSON.stringify(newTabs));
        let nextActive = state.activeNoteId;
        if (state.activeNoteId === noteId) {
          nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
        }
        if (nextActive) {
          localStorage.setItem(STORAGE_ACTIVE_NOTE, nextActive);
        } else {
          localStorage.removeItem(STORAGE_ACTIVE_NOTE);
        }
        return { openTabIds: newTabs, activeNoteId: nextActive };
      });
    },

    createNote: (title = 'Untitled.md', folderId = null, content = '') => {
      const id = 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const user = get().currentUser;
      const newNote: Note = {
        id,
        title,
        content: content || `# ${title.replace(/\\.[^/.]+$/, '')}\n\nStart typing here...`,
        folderId,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user ? user.uid : undefined,
      };

      set((state) => {
        const notes = [newNote, ...state.notes];
        const openTabIds = [...state.openTabIds, id];
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        localStorage.setItem(STORAGE_TABS, JSON.stringify(openTabIds));
        localStorage.setItem(STORAGE_ACTIVE_NOTE, id);
        return { notes, openTabIds, activeNoteId: id };
      });

      // Broadcast to other local tabs
      broadcastChannel?.postMessage({ type: 'NOTE_CREATED', payload: newNote });

      // Sync to cloud if user logged in
      if (user) {
        set({ syncStatus: 'saving' });
        syncNoteToFirestore(newNote)
          .then(() => set({ syncStatus: 'synced' }))
          .catch(() => set({ syncStatus: 'error' }));
      }

      return id;
    },

    createMultipleNotes: (files, folderId = null) => {
      if (files.length === 0) return [];
      const user = get().currentUser;
      const createdNotes: Note[] = [];
      const ids: string[] = [];

      files.forEach((file, index) => {
        const id = 'note-' + (Date.now() + index) + '-' + Math.random().toString(36).substring(2, 7);
        const title = file.title || 'Untitled.md';
        const content = file.content !== undefined 
          ? file.content 
          : `# ${title.replace(/\.[^/.]+$/, '')}\n\nStart typing here...`;

        const newNote: Note = {
          id,
          title,
          content,
          folderId,
          isFavorite: false,
          createdAt: Date.now() + index,
          updatedAt: Date.now() + index,
          userId: user ? user.uid : undefined,
        };
        createdNotes.push(newNote);
        ids.push(id);
      });

      const firstId = ids[0];

      set((state) => {
        const notes = [...createdNotes, ...state.notes];
        const newTabs = [...state.openTabIds];
        ids.forEach((id) => {
          if (!newTabs.includes(id)) newTabs.push(id);
        });
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        localStorage.setItem(STORAGE_TABS, JSON.stringify(newTabs));
        localStorage.setItem(STORAGE_ACTIVE_NOTE, firstId);
        return { notes, openTabIds: newTabs, activeNoteId: firstId };
      });

      // Broadcast and sync
      createdNotes.forEach((newNote) => {
        broadcastChannel?.postMessage({ type: 'NOTE_CREATED', payload: newNote });
        if (user) {
          syncNoteToFirestore(newNote).catch(console.error);
        }
      });

      return ids;
    },

    updateNoteContent: (id, content) => {
      const now = Date.now();
      let updatedNote: Note | null = null;

      // 1. Instant local update
      set((state) => {
        const notes = state.notes.map((n) => {
          if (n.id === id) {
            updatedNote = { ...n, content, updatedAt: now };
            return updatedNote;
          }
          return n;
        });
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        return { notes, syncStatus: 'saving' };
      });

      // 2. Broadcast immediately to other tabs on same machine
      if (updatedNote) {
        broadcastChannel?.postMessage({
          type: 'NOTE_UPDATED',
          payload: { id, content, updatedAt: now }
        });
      }

      // 3. Debounced save to Firestore (750ms) to conserve free tier quota
      const user = get().currentUser;
      if (user && updatedNote) {
        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
        saveDebounceTimer = setTimeout(async () => {
          try {
            if (updatedNote) {
              await syncNoteToFirestore(updatedNote);
              set({ syncStatus: 'synced' });
            }
          } catch (e) {
            console.error('Firestore save failed:', e);
            set({ syncStatus: 'error' });
          }
        }, 750);
      } else {
        set({ syncStatus: 'local' });
      }
    },

    renameNote: (id, newTitle) => {
      let updatedNote: Note | null = null;
      set((state) => {
        const notes = state.notes.map((n) => {
          if (n.id === id) {
            updatedNote = { ...n, title: newTitle, updatedAt: Date.now() };
            return updatedNote;
          }
          return n;
        });
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        return { notes };
      });

      if (updatedNote && get().currentUser) {
        syncNoteToFirestore(updatedNote);
      }
    },

    deleteNote: (id) => {
      set((state) => {
        const notes = state.notes.filter((n) => n.id !== id);
        const openTabIds = state.openTabIds.filter((tId) => tId !== id);
        let activeNoteId = state.activeNoteId;
        if (activeNoteId === id) {
          activeNoteId = openTabIds.length > 0 ? openTabIds[openTabIds.length - 1] : null;
        }
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        localStorage.setItem(STORAGE_TABS, JSON.stringify(openTabIds));
        if (activeNoteId) {
          localStorage.setItem(STORAGE_ACTIVE_NOTE, activeNoteId);
        } else {
          localStorage.removeItem(STORAGE_ACTIVE_NOTE);
        }
        return { notes, openTabIds, activeNoteId };
      });

      broadcastChannel?.postMessage({ type: 'NOTE_DELETED', payload: { id } });

      if (get().currentUser) {
        deleteNoteFromFirestore(id);
      }
    },

    toggleFavorite: (id) => {
      let updatedNote: Note | null = null;
      set((state) => {
        const notes = state.notes.map((n) => {
          if (n.id === id) {
            updatedNote = { ...n, isFavorite: !n.isFavorite };
            return updatedNote;
          }
          return n;
        });
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        return { notes };
      });

      if (updatedNote && get().currentUser) {
        syncNoteToFirestore(updatedNote);
      }
    },

    moveNoteToFolder: (noteId, folderId) => {
      get().moveNotesToFolder([noteId], folderId);
    },

    moveNotesToFolder: (noteIds, folderId) => {
      if (noteIds.length === 0) return;
      const idSet = new Set(noteIds);
      const updatedNotes: Note[] = [];

      set((state) => {
        const notes = state.notes.map((n) => {
          if (idSet.has(n.id)) {
            const updated = { ...n, folderId, updatedAt: Date.now() };
            updatedNotes.push(updated);
            return updated;
          }
          return n;
        });
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        return { notes };
      });

      if (get().currentUser) {
        updatedNotes.forEach((n) => syncNoteToFirestore(n).catch(console.error));
      }
    },

    createFolder: (name, parentId = null, color = '#3b82f6') => {
      const id = 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const user = get().currentUser;
      const newFolder: Folder = {
        id,
        name,
        parentId,
        createdAt: Date.now(),
        userId: user ? user.uid : undefined,
        color,
      };

      set((state) => {
        const folders = [...state.folders, newFolder];
        const expandedFolderIds = [...state.expandedFolderIds, id];
        localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
        return { folders, expandedFolderIds };
      });

      broadcastChannel?.postMessage({ type: 'FOLDER_UPDATED', payload: get().folders });

      if (user) {
        syncFolderToFirestore(newFolder);
      }

      return id;
    },

    renameFolder: (id, newName) => {
      let updatedFolder: Folder | null = null;
      set((state) => {
        const folders = state.folders.map((f) => {
          if (f.id === id) {
            updatedFolder = { ...f, name: newName };
            return updatedFolder;
          }
          return f;
        });
        localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
        return { folders };
      });

      if (updatedFolder && get().currentUser) {
        syncFolderToFirestore(updatedFolder);
      }
    },

    deleteFolder: (id) => {
      set((state) => {
        // Move notes inside this folder to root or keep them
        const notes = state.notes.map((n) =>
          n.folderId === id ? { ...n, folderId: null } : n
        );
        const folders = state.folders.filter((f) => f.id !== id && f.parentId !== id);
        localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
        localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
        return { folders, notes };
      });

      broadcastChannel?.postMessage({ type: 'FOLDER_UPDATED', payload: get().folders });

      if (get().currentUser) {
        deleteFolderFromFirestore(id);
      }
    },

    toggleFolderExpanded: (folderId) => {
      set((state) => {
        const exists = state.expandedFolderIds.includes(folderId);
        const expandedFolderIds = exists
          ? state.expandedFolderIds.filter((id) => id !== folderId)
          : [...state.expandedFolderIds, folderId];
        return { expandedFolderIds };
      });
    },

    setCloudData: (cloudNotes, cloudFolders) => {
      // Merge cloud data with state
      set((state) => {
        const existingNotesMap = new Map(state.notes.map(n => [n.id, n]));
        
        cloudNotes.forEach(cn => {
          const local = existingNotesMap.get(cn.id);
          // If cloud note is newer or doesn't exist locally
          if (!local || cn.updatedAt >= local.updatedAt) {
            existingNotesMap.set(cn.id, cn);
          }
        });

        const mergedNotes = Array.from(existingNotesMap.values());
        
        // Ensure folders from cloud are represented
        const existingFoldersMap = new Map(state.folders.map(f => [f.id, f]));
        cloudFolders.forEach(cf => {
          existingFoldersMap.set(cf.id, cf);
        });
        const mergedFolders = Array.from(existingFoldersMap.values());

        localStorage.setItem(STORAGE_NOTES, JSON.stringify(mergedNotes));
        localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(mergedFolders));

        return {
          notes: mergedNotes,
          folders: mergedFolders,
          syncStatus: 'synced',
        };
      });
    },

    initSyncListeners: () => {
      // Handled in main / app component via subscribeAuth & subscribeToUserData
    },
  };
});
