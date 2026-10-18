import React, { useState } from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { 
  Columns2, 
  SquarePen, 
  Eye, 
  RotateCw, 
  Download, 
  Settings, 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  LogIn, 
  LogOut, 
  Menu,
  ChevronDown
} from 'lucide-react';
import { TabBar } from './TabBar';
import { logoutFirebase } from '../services/firebase';

interface HeaderProps {
  onOpenFirebaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFirebaseModal }) => {
  const {
    viewMode,
    setViewMode,
    syncScrollEnabled,
    toggleSyncScroll,
    fontSize,
    setFontSize,
    syncStatus,
    currentUser,
    setCurrentUser,
    activeNoteId,
    notes,
    toggleSidebar,
    sidebarOpen,
  } = useNoteStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeNote.title.endsWith('.md') ? activeNote.title : `${activeNote.title}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportHtml = () => {
    if (!activeNote) return;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeNote.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #24292e; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
    code { font-family: monospace; background: #f6f8fa; padding: 2px 4px; border-radius: 3px; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
    th { background: #f6f8fa; }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${activeNote.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeNote.title.replace(/\.[^/.]+$/, '')}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrintPdf = () => {
    window.print();
    setShowExportMenu(false);
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="flex flex-col bg-[#0d1117] border-b border-[#21262d] select-none z-30">
      {/* Top Main Navbar */}
      <div className="flex items-center justify-between h-12 px-3 gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-md hover:bg-[#1a202c] transition-colors ${
              sidebarOpen ? 'text-blue-400' : 'text-slate-300'
            }`}
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#161c27] border border-[#2c374d] flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-xs tracking-wide text-slate-100 flex items-center gap-1.5">
                Markdown Viewer
                <span className="text-[10px] px-1.5 py-0.2 bg-[#171c26] text-slate-300 border border-[#2b3548] rounded font-normal">
                  v2.0
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center / Actions */}
        <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-md border border-[#222838]">
          {/* View Mode Switches */}
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              viewMode === 'split'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
            }`}
            title="Split View (Editor + Preview)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              viewMode === 'editor'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
            }`}
            title="Editor Only"
          >
            <SquarePen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              viewMode === 'preview'
                ? 'bg-[#2563eb] text-white font-medium'
                : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
            }`}
            title="Preview Only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Preview</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Synced Scroll Toggle */}
          <button
            type="button"
            onClick={toggleSyncScroll}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
              syncScrollEnabled
                ? 'bg-[#182030] text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-[#182030]'
            }`}
            title={`Sync Scrolling: ${syncScrollEnabled ? 'Enabled' : 'Disabled'}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncScrollEnabled ? 'text-blue-400' : 'text-slate-400'}`} />
          </button>

          {/* Font Size Adjust */}
          <div 
            className="hidden sm:flex items-center bg-[#141822] border border-[#222a3a] rounded-md px-1.5 py-0.5 text-xs text-slate-300"
            title="Ukuran Font Teks (Editor & Preview)"
          >
            <span className="text-[10px] text-slate-400 mr-1 select-none font-semibold">Aa</span>
            <button
              type="button"
              onClick={() => setFontSize(fontSize - 1)}
              className="px-1.5 py-0.5 hover:text-white text-slate-300 font-bold hover:bg-[#182030] rounded transition-colors"
              title="Perkecil Ukuran Font (-)"
            >
              -
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-100 font-semibold">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize(fontSize + 1)}
              className="px-1.5 py-0.5 hover:text-white text-slate-300 font-bold hover:bg-[#182030] rounded transition-colors"
              title="Perbesar Ukuran Font (+)"
            >
              +
            </button>
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141822] hover:bg-[#182030] border border-[#222a3a] rounded-md text-xs text-slate-200 transition-colors"
              title="Export Options"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {showExportMenu && (
              <div 
                className="absolute right-0 mt-1 w-44 bg-[#141822] border border-[#2b3548] rounded-lg shadow-xl py-1 z-50 text-xs text-slate-200"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3 py-2 hover:bg-[#182030] flex items-center justify-between"
                >
                  <span>Markdown (.md)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Source</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="w-full text-left px-3 py-2 hover:bg-[#182030] flex items-center justify-between"
                >
                  <span>HTML Document</span>
                  <span className="text-[10px] text-slate-400 font-mono">Standalone</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="w-full text-left px-3 py-2 hover:bg-[#182030] flex items-center justify-between border-t border-[#1e2636]"
                >
                  <span>Print / Save PDF</span>
                  <span className="text-[10px] text-slate-400 font-mono">Print dialog</span>
                </button>
              </div>
            )}
          </div>

          {/* Cloud Sync Status Indicator */}
          <div
            onClick={onOpenFirebaseModal}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141822] border border-[#222a3a] hover:border-blue-500/60 transition-colors cursor-pointer text-xs"
            title="Realtime Cloud Status"
          >
            {syncStatus === 'synced' ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline text-[11px] text-emerald-400 font-medium">Synced</span>
              </>
            ) : syncStatus === 'saving' ? (
              <>
                <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="hidden md:inline text-[11px] text-amber-400 font-medium">Saving...</span>
              </>
            ) : syncStatus === 'local' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden md:inline text-[11px] text-slate-300">Local Only</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline text-[11px] text-rose-400">Sync Error</span>
              </>
            )}
          </div>

          {/* User Profile or Connect Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              {currentUser.photoURL && !avatarImgError ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarImgError(true)}
                  className="w-7 h-7 rounded-full border border-blue-500/40 object-cover"
                  title={currentUser.displayName || currentUser.email || 'Logged in'}
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-full bg-[#1a2130] text-slate-100 font-bold text-xs flex items-center justify-center border border-[#2e3a52]"
                  title={currentUser.displayName || currentUser.email || 'Logged in'}
                >
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="p-1.5 rounded-md hover:bg-[#1a202e] text-slate-300 hover:text-rose-400 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-medium transition-colors border border-blue-500/30 shadow-none"
              title="Connect Firebase to sync realtime"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect Cloud</span>
            </button>
          )}

          {/* Settings icon */}
          <button
            type="button"
            onClick={onOpenFirebaseModal}
            className="p-1.5 rounded-md hover:bg-[#1a202e] text-slate-300 hover:text-white transition-colors"
            title="Settings & Firebase"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Bar Sub-Header */}
      <TabBar />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#121620] border border-[#2b3548] rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-300">Yakin ingin logout dari akun Google?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-[#0b0d13] p-3 rounded-lg border border-[#1e2636] leading-relaxed">
              Catatan kamu tetap tersimpan aman di cloud Firebase. Kamu bisa login kembali kapan saja untuk sinkronisasi.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-1.5 rounded-md hover:bg-[#182030] text-xs text-slate-300 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium shadow-none transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
