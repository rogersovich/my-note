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
import { Tooltip } from './Tooltip';
import { useConfirmStore } from '../store/useConfirmStore';

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

  const { confirm: confirmAction } = useConfirmStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

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
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${activeNote.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 85%; }
    blockquote { border-left: 4px solid #3b82f6; margin-left: 0; padding-left: 16px; color: #64748b; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <div id="content">
    <pre>${activeNote.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeNote.title.replace(/\.[^/.]+$/, '') + '.html';
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrintPdf = () => {
    window.print();
    setShowExportMenu(false);
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
  };

  const triggerLogoutConfirm = () => {
    confirmAction({
      title: 'Konfirmasi Keluar',
      message: 'Yakin ingin logout dari akun Google? Catatan Anda tetap tersimpan aman di cloud Firebase.',
      confirmText: 'Ya, Keluar',
      variant: 'warning',
      onConfirm: handleLogout,
    });
  };

  return (
    <header className="bg-[#0b0d13] border-b border-[#1e2636] flex flex-col shrink-0 select-none z-30">
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between h-12 px-3 gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <Tooltip content="Toggle Sidebar" shortcut="Ctrl+Shift+B" position="bottom">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-1.5 rounded-md hover:bg-[#1a202c] transition-colors ${
                sidebarOpen ? 'text-blue-400' : 'text-slate-300'
              }`}
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="flex items-center gap-2">
            <img 
              src="/favicon-32x32.png" 
              alt="MyNote Logo" 
              className="w-7 h-7 rounded-md border border-[#2c374d] object-contain bg-[#161c27] p-0.5"
            />
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
          <Tooltip content="Tampilan Split (Editor & Preview)" shortcut="Ctrl+Shift+P" position="bottom">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'split'
                  ? 'bg-[#2563eb] text-white font-medium'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
          </Tooltip>

          <Tooltip content="Tampilan Editor Saja" position="bottom">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'editor'
                  ? 'bg-[#2563eb] text-white font-medium'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
              }`}
            >
              <SquarePen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Editor</span>
            </button>
          </Tooltip>

          <Tooltip content="Tampilan Preview Saja" position="bottom">
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-[#2563eb] text-white font-medium'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a202e]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
          </Tooltip>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Synced Scroll Toggle */}
          <Tooltip content={`Sinkronisasi Scroll: ${syncScrollEnabled ? 'Aktif' : 'Nonaktif'}`} position="bottom">
            <button
              type="button"
              onClick={toggleSyncScroll}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                syncScrollEnabled
                  ? 'bg-[#182030] text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#182030]'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncScrollEnabled ? 'text-blue-400' : 'text-slate-400'}`} />
            </button>
          </Tooltip>

          {/* Font Size Adjust */}
          <div className="hidden sm:flex items-center bg-[#141822] border border-[#222a3a] rounded-md px-1.5 py-0.5 text-xs text-slate-300">
            <span className="text-[10px] text-slate-400 mr-1 select-none font-semibold">Aa</span>
            <Tooltip content="Perkecil Font" position="bottom">
              <button
                type="button"
                onClick={() => setFontSize(fontSize - 1)}
                className="px-1.5 py-0.5 hover:text-white text-slate-300 font-bold hover:bg-[#182030] rounded transition-colors"
              >
                -
              </button>
            </Tooltip>
            <span className="px-1.5 font-mono text-[11px] text-slate-100 font-semibold">{fontSize}px</span>
            <Tooltip content="Perbesar Font" position="bottom">
              <button
                type="button"
                onClick={() => setFontSize(fontSize + 1)}
                className="px-1.5 py-0.5 hover:text-white text-slate-300 font-bold hover:bg-[#182030] rounded transition-colors"
              >
                +
              </button>
            </Tooltip>
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <Tooltip content="Opsi Ekspor Catatan" position="bottom">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141822] hover:bg-[#182030] border border-[#222a3a] rounded-md text-xs text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>
            </Tooltip>

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
          <Tooltip 
            content={
              syncStatus === 'synced'
                ? 'Tersinkronisasi ke Cloud Firebase'
                : syncStatus === 'saving'
                ? 'Menyimpan perubahan...'
                : syncStatus === 'local'
                ? 'Tersimpan di Browser Lokal (Klik untuk Sinkronisasi Cloud)'
                : 'Terjadi Kendala Sinkronisasi'
            }
            position="bottom"
          >
            <div
              onClick={onOpenFirebaseModal}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141822] border border-[#222a3a] hover:border-blue-500/60 transition-colors cursor-pointer text-xs"
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
          </Tooltip>

          {/* User Profile or Connect Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              <Tooltip content={currentUser.displayName || currentUser.email || 'Akun Pengguna'} position="bottom">
                {currentUser.photoURL && !avatarImgError ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarImgError(true)}
                    className="w-7 h-7 rounded-full border border-blue-500/40 object-cover cursor-pointer"
                  />
                ) : (
                  <div 
                    className="w-7 h-7 rounded-full bg-[#1a2130] text-slate-100 font-bold text-xs flex items-center justify-center border border-[#2e3a52] cursor-pointer"
                  >
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Tooltip>
              <Tooltip content="Keluar (Logout)" position="bottom">
                <button
                  type="button"
                  onClick={triggerLogoutConfirm}
                  className="p-1.5 rounded-md hover:bg-[#1a202e] text-slate-300 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip content="Hubungkan Firebase untuk Sinkronisasi Realtime" position="bottom">
              <button
                type="button"
                onClick={onOpenFirebaseModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-medium transition-colors border border-blue-500/30 shadow-none"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Cloud</span>
              </button>
            </Tooltip>
          )}

          {/* Settings icon */}
          <Tooltip content="Pengaturan & Firebase" position="bottom">
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className="p-1.5 rounded-md hover:bg-[#1a202e] text-slate-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tab Bar Sub-Header */}
      <TabBar />
    </header>
  );
};
