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
    setCloudData,
    toggleSidebar,
    setViewMode,
    createMultipleNotes,
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
        // Merge cloud notes into store
        setCloudData(cloudNotes, []);
      },
      (cloudFolders) => {
        // Merge cloud folders into store
        setCloudData([], cloudFolders);
      }
    );

    return () => unsubFirestore();
  }, [currentUser, setCloudData]);

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
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+P: Toggle Preview / Split
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setViewMode(viewMode === 'preview' ? 'split' : 'preview');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, setViewMode, viewMode]);

  const [isDraggingOverApp, setIsDraggingOverApp] = useState(false);
  const dragCounter = useRef(0);
  const isDroppingRef = useRef(false);

  const resetDragState = useCallback(() => {
    dragCounter.current = 0;
    setIsDraggingOverApp(false);
  }, []);

  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      if (isDroppingRef.current) return;
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
      dragCounter.current -= 1;
      // If leaving the window entirely
      if (dragCounter.current <= 0 || !e.relatedTarget || (e.clientX === 0 && e.clientY === 0)) {
        resetDragState();
      }
    };

    const handleWindowDrop = () => {
      isDroppingRef.current = true;
      resetDragState();
      setTimeout(() => {
        isDroppingRef.current = false;
      }, 300);
    };

    const handleWindowDragEnd = () => {
      resetDragState();
    };

    const handleWindowMouseUp = () => {
      resetDragState();
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop, true); // capture phase catches all drops
    window.addEventListener('dragend', handleWindowDragEnd);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop, true);
      window.removeEventListener('dragend', handleWindowDragEnd);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [resetDragState]);

  const handleAppDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    isDroppingRef.current = true;
    resetDragState();
    setTimeout(() => {
      isDroppingRef.current = false;
    }, 300);

    // If it's internal notes, let Sidebar handle it
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('application/json-mynote-ids')) {
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
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

      const validFiles = parsedFiles.filter((f): f is { title: string; content: string } => f !== null);
      if (validFiles.length > 0) {
        createMultipleNotes(validFiles, null);
      }
    }
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleAppDrop}
      className="flex flex-col h-screen w-screen bg-[#0b0d13] text-slate-100 overflow-hidden font-sans relative"
    >
      {/* Drop Files Overlay */}
      {isDraggingOverApp && (
        <div 
          onClick={resetDragState}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleAppDrop}
          className="absolute inset-0 z-50 bg-[#0b0d13]/85 flex flex-col items-center justify-center border-2 border-dashed border-blue-500 m-3 rounded-lg cursor-pointer animate-in fade-in duration-75"
        >
          <div 
            className="bg-[#121620] border border-[#222a3a] px-6 py-5 rounded-lg flex flex-col items-center text-center shadow-2xl max-w-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Lepaskan File untuk Impor</h3>
            <p className="text-xs text-slate-300 mb-3">
              File .md atau .txt akan ditambahkan otomatis ke workspace catatan Anda.
            </p>
            <button
              type="button"
              onClick={resetDragState}
              className="px-3 py-1 rounded bg-[#182030] hover:bg-[#202a40] text-slate-300 hover:text-white text-xs border border-[#28354c] transition-colors"
            >
              Tutup / Batal
            </button>
          </div>
        </div>
      )}
      {/* Top Header & TabBar */}
      <Header onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)} />

      {/* Main Workspace Area (Sidebar + Editor + Preview) */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Explorer Sidebar */}
        <Sidebar />

        {/* Center / Right Editor & Preview Area */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-[#0e1118]">
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
