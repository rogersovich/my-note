import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNoteStore } from './store/useNoteStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EditorToolbar } from './components/EditorToolbar';
import { CodeEditor } from './components/CodeEditor';
import type { CodeEditorHandle } from './components/CodeEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import type { MarkdownPreviewHandle } from './components/MarkdownPreview';
import { StatusBar } from './components/StatusBar';
import { FirebaseModal } from './components/FirebaseModal';
import { ConfirmModal } from './components/ConfirmModal';
import { subscribeAuth, subscribeToUserData } from './services/firebase';
import { Upload } from 'lucide-react';

export const App: React.FC = () => {
  const {
    viewMode,
    syncScrollEnabled,
    currentUser,
    setCurrentUser,
    setCloudNotes,
    setCloudFolders,
    toggleSidebar,
    setViewMode,
    createMultipleNotes,
    openTabIds,
    activeNoteId,
    setActiveNoteId,
    closeTab,
  } = useNoteStore();

  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const editorRef = useRef<CodeEditorHandle>(null);
  const previewRef = useRef<MarkdownPreviewHandle>(null);
  const isScrollingSync = useRef(false);

  // Subscribe to Firebase Auth and Firestore on mount
  useEffect(() => {
    const unsubAuth = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, [setCurrentUser]);

  // When currentUser changes, subscribe to their Firestore notes and folders in realtime!
  useEffect(() => {
    if (!currentUser) return;

    const unsubFirestore = subscribeToUserData(
      currentUser.uid,
      (cloudNotes) => {
        setCloudNotes(cloudNotes);
      },
      (cloudFolders) => {
        setCloudFolders(cloudFolders);
      }
    );

    return () => unsubFirestore();
  }, [currentUser, setCloudNotes, setCloudFolders]);

  // Synchronized scrolling handlers
  const handleEditorScroll = useCallback(
    (percentage: number) => {
      if (!syncScrollEnabled || isScrollingSync.current) return;
      isScrollingSync.current = true;
      previewRef.current?.scrollToPercentage(percentage);
      setTimeout(() => {
        isScrollingSync.current = false;
      }, 50);
    },
    [syncScrollEnabled]
  );

  const handlePreviewScroll = useCallback(
    (percentage: number) => {
      if (!syncScrollEnabled || isScrollingSync.current) return;
      isScrollingSync.current = true;
      editorRef.current?.scrollToPercentage(percentage);
      setTimeout(() => {
        isScrollingSync.current = false;
      }, 50);
    },
    [syncScrollEnabled]
  );

  const handleToolbarInsert = (syntax: string) => {
    editorRef.current?.insertSyntax(syntax);
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Prevent browser save dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }

      // Ctrl+Shift+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+Shift+P: Toggle Preview / Split
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setViewMode(viewMode === 'preview' ? 'split' : 'preview');
      }

      // Ctrl+W or Alt+W: Close active tab
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') ||
        (e.altKey && e.key.toLowerCase() === 'w')
      ) {
        e.preventDefault();
        if (activeNoteId) {
          closeTab(activeNoteId);
        }
      }

      // Tab switching shortcuts:
      // Next: Ctrl+Tab (when available), Ctrl+PageDown, Alt+ArrowRight
      // Prev: Ctrl+Shift+Tab (when available), Ctrl+PageUp, Alt+ArrowLeft
      const isNextTab =
        ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Tab') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'PageDown') ||
        (e.altKey && e.key === 'ArrowRight');

      const isPrevTab =
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'PageUp') ||
        (e.altKey && e.key === 'ArrowLeft');

      if (isNextTab) {
        e.preventDefault();
        if (openTabIds.length > 1) {
          const currentIndex = activeNoteId ? openTabIds.indexOf(activeNoteId) : -1;
          const nextIndex = (currentIndex + 1) % openTabIds.length;
          setActiveNoteId(openTabIds[nextIndex]);
        }
      } else if (isPrevTab) {
        e.preventDefault();
        if (openTabIds.length > 1) {
          const currentIndex = activeNoteId ? openTabIds.indexOf(activeNoteId) : -1;
          const prevIndex = (currentIndex - 1 + openTabIds.length) % openTabIds.length;
          setActiveNoteId(openTabIds[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, setViewMode, viewMode, openTabIds, activeNoteId, setActiveNoteId, closeTab]);

  const [isDraggingOverApp, setIsDraggingOverApp] = useState(false);
  const dragCounter = useRef(0);

  const resetDragState = useCallback(() => {
    dragCounter.current = 0;
    setIsDraggingOverApp(false);
  }, []);

  const handleFileImport = useCallback(
    async (files: FileList | File[], folderId: string | null = null) => {
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      const parsedFiles = await Promise.all(
        fileList.map(async (file) => {
          try {
            const content = await file.text();
            return { title: file.name, content };
          } catch (err) {
            console.error('Failed to read dropped file:', file.name, err);
            return null;
          }
        })
      );

      const validFiles = parsedFiles.filter(
        (f): f is { title: string; content: string } => f !== null
      );
      if (validFiles.length > 0) {
        createMultipleNotes(validFiles, folderId);
      }
    },
    [createMultipleNotes]
  );

  useEffect(() => {
    // 1. MUST preventDefault on window dragover so browser never opens the file in a new tab
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.types) return;
      const types = Array.from(e.dataTransfer.types);
      // Only react to OS files, ignore internal note dragging
      if (!types.includes('Files') || types.includes('application/json-mynote-ids')) {
        return;
      }
      dragCounter.current += 1;
      setIsDraggingOverApp(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      // If leaving the window entirely
      if (dragCounter.current <= 0 || !e.relatedTarget || (e.clientX === 0 && e.clientY === 0)) {
        resetDragState();
      }
    };

    // Capture phase drop: ALWAYS prevent browser default navigation immediately and reset UI
    const handleCaptureDrop = (e: DragEvent) => {
      e.preventDefault();
      resetDragState();
    };

    // Bubble phase drop: if drop was not consumed by Sidebar (stopPropagation), import into root workspace
    const handleBubbleDrop = async (e: DragEvent) => {
      e.preventDefault();
      resetDragState();

      if (
        e.dataTransfer?.types &&
        Array.from(e.dataTransfer.types).includes('application/json-mynote-ids')
      ) {
        return;
      }

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        await handleFileImport(e.dataTransfer.files, null);
      }
    };

    const handleWindowDragEnd = () => {
      resetDragState();
    };

    const handleWindowMouseUp = () => {
      resetDragState();
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetDragState();
      }
    };

    window.addEventListener('dragover', handleWindowDragOver, false);
    window.addEventListener('dragenter', handleWindowDragEnter, false);
    window.addEventListener('dragleave', handleWindowDragLeave, false);
    window.addEventListener('drop', handleCaptureDrop, true); // capture: guarantees browser never opens file
    window.addEventListener('drop', handleBubbleDrop, false); // bubble: handles root note creation
    window.addEventListener('dragend', handleWindowDragEnd, false);
    window.addEventListener('mouseup', handleWindowMouseUp, false);
    window.addEventListener('keydown', handleWindowKeyDown, false);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver, false);
      window.removeEventListener('dragenter', handleWindowDragEnter, false);
      window.removeEventListener('dragleave', handleWindowDragLeave, false);
      window.removeEventListener('drop', handleCaptureDrop, true);
      window.removeEventListener('drop', handleBubbleDrop, false);
      window.removeEventListener('dragend', handleWindowDragEnd, false);
      window.removeEventListener('mouseup', handleWindowMouseUp, false);
      window.removeEventListener('keydown', handleWindowKeyDown, false);
    };
  }, [resetDragState, handleFileImport]);

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#0b0d13] text-slate-100 overflow-hidden font-sans relative"
    >
      {/* Top Header & TabBar */}
      <Header onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)} />

      {/* Main Workspace Area (Sidebar + Editor + Preview) */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Explorer Sidebar */}
        <Sidebar />

        {/* Center / Right Editor & Preview Area */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-[#0e1118] relative">
          {/* Drop Files Overlay - covers only the editor/preview workspace so Sidebar is always clear */}
          {isDraggingOverApp && (
            <div 
              className="absolute inset-0 z-50 bg-[#0b0d13]/85 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-dashed border-blue-500 m-3 rounded-lg pointer-events-none animate-in fade-in duration-75"
            >
              <div className="bg-[#121620] border border-[#222a3a] px-6 py-5 rounded-lg flex flex-col items-center text-center shadow-2xl max-w-sm">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Lepaskan File untuk Impor</h3>
                <p className="text-xs text-slate-300">
                  Lepaskan di sini untuk membuat catatan baru di workspace, atau arahkan ke folder di sidebar.
                </p>
              </div>
            </div>
          )}
          {/* Editor Formatting Toolbar (visible in Split & Editor modes) */}
          {viewMode !== 'preview' && (
            <EditorToolbar onInsert={handleToolbarInsert} />
          )}

          {/* Split View Container */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Editor Panel */}
            {viewMode !== 'preview' && (
              <div
                className={`h-full flex flex-col ${
                  viewMode === 'split' ? 'w-1/2 border-r border-[#1e2636]' : 'w-full'
                }`}
              >
                <CodeEditor
                  ref={editorRef}
                  onScrollPercentage={handleEditorScroll}
                />
              </div>
            )}

            {/* Live Markdown Preview Panel */}
            {viewMode !== 'editor' && (
              <div
                className={`h-full flex flex-col ${
                  viewMode === 'split' ? 'w-1/2' : 'w-full'
                }`}
              >
                <MarkdownPreview
                  ref={previewRef}
                  onScrollPercentage={handlePreviewScroll}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
      <ConfirmModal />
    </div>
  );
};

export default App;
