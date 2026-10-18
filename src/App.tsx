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
import { subscribeAuth, subscribeToUserData } from './services/firebase';

export const App: React.FC = () => {
  const {
    viewMode,
    syncScrollEnabled,
    currentUser,
    setCurrentUser,
    setCloudData,
    toggleSidebar,
    setViewMode,
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0d13] text-slate-100 overflow-hidden font-sans">
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

      {/* Firebase Cloud Sync Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};

export default App;
