import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  Check, 
  LogIn,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  initFirebase, 
  loginWithGoogle, 
  loginAnonymously
} from '../services/firebase';
import type { FirebaseConfig } from '../services/firebase';
import { useNoteStore } from '../store/useNoteStore';
import { useConfirmStore } from '../store/useConfirmStore';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, setFirebaseConfigured } = useNoteStore();
  const { confirm: confirmAction } = useConfirmStore();

  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appId, setAppId] = useState('');
  const [jsonConfigInput, setJsonConfigInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredFirebaseConfig();
      if (stored) {
        setApiKey(stored.apiKey || '');
        setAuthDomain(stored.authDomain || '');
        setProjectId(stored.projectId || '');
        setAppId(stored.appId || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasteJson = () => {
    try {
      // Try to find apiKey, projectId, etc. inside text
      let cleaned = jsonConfigInput.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim();
      }
      // If it has unquoted keys, format or regex extract
      const extractField = (field: string) => {
        const regex = new RegExp(`["']?${field}["']?\\s*:\\s*["']([^"']+)["']`);
        const match = cleaned.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extractField('apiKey');
      const extractedAuthDomain = extractField('authDomain');
      const extractedProjectId = extractField('projectId');
      const extractedAppId = extractField('appId');

      if (extractedApiKey && extractedProjectId) {
        setApiKey(extractedApiKey);
        setAuthDomain(extractedAuthDomain || `${extractedProjectId}.firebaseapp.com`);
        setProjectId(extractedProjectId);
        setAppId(extractedAppId);
        setJsonConfigInput('');
        setStatusMsg({ text: 'Konfigurasi berhasil diekstrak!', type: 'success' });
      } else {
        setStatusMsg({ text: 'Format config tidak dikenali. Pastikan menyertakan apiKey dan projectId.', type: 'error' });
      }
    } catch (e) {
      setStatusMsg({ text: 'Gagal membaca config JSON.', type: 'error' });
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey.trim() || !projectId.trim()) {
      setStatusMsg({ text: 'API Key dan Project ID wajib diisi!', type: 'error' });
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      appId: appId.trim(),
    };

    saveStoredFirebaseConfig(config);
    const res = initFirebase(config);
    if (res.app) {
      setFirebaseConfigured(true);
      setStatusMsg({ text: 'Firebase berhasil dikonfigurasi! Silakan login untuk mulai sync.', type: 'success' });
    } else {
      setStatusMsg({ text: 'Inisialisasi Firebase gagal. Periksa kembali API Key / Project ID.', type: 'error' });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
        setStatusMsg({ text: `Berhasil login sebagai ${user.displayName}!`, type: 'success' });
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Gagal login dengan Google', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonLogin = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const user = await loginAnonymously();
      if (user) {
        setCurrentUser(user);
        setStatusMsg({ text: 'Berhasil login sebagai Guest / Anonim!', type: 'success' });
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Gagal login anonim', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConfig = () => {
    confirmAction({
      title: 'Hapus Konfigurasi Firebase',
      message: 'Apakah Anda yakin ingin menghapus konfigurasi Firebase dari browser ini? Sinkronisasi cloud akan dinonaktifkan.',
      confirmText: 'Hapus Konfigurasi',
      variant: 'danger',
      onConfirm: () => {
        saveStoredFirebaseConfig(null);
        setApiKey('');
        setAuthDomain('');
        setProjectId('');
        setAppId('');
        setFirebaseConfigured(false);
        setCurrentUser(null);
        setStatusMsg({ text: 'Konfigurasi Firebase dihapus.', type: 'info' });
      },
    });
  };

  const copySecurityRules = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
    }
    match /folders/{folderId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}`;
    navigator.clipboard.writeText(rules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-[#121620] border border-[#2b3548] rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2636] bg-[#0e1118]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#182030] text-blue-400 border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Pengaturan Realtime Firebase (Free Spark Tier)
              </h2>
              <p className="text-[11px] text-slate-300">
                Sinkronisasi instan catatan antar 2 tab atau 2 laptop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#182030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scroll text-xs text-slate-300">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Current Auth Status */}
          <div className="p-3.5 rounded-lg bg-[#0e1118] border border-[#1e2636] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#182030] border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                {currentUser ? (currentUser.displayName || 'U')[0] : '?'}
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  {currentUser ? currentUser.displayName || currentUser.email : 'Belum Login'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {currentUser ? `UID: ${currentUser.uid.slice(0, 10)}...` : 'Catatan saat ini tersimpan di LocalStorage'}
                </p>
              </div>
            </div>

            {currentUser ? (
              <span className="px-2.5 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                Connected
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-medium transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Google Login
                </button>
                <button
                  type="button"
                  onClick={handleAnonLogin}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-200 border border-[#2a3447] rounded-md text-xs transition-colors"
                >
                  Guest
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Advanced Config */}
          <div className="border border-[#1e2636] rounded-lg bg-[#0e1118] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#141824] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Konfigurasi Firebase Proyek ({projectId || 'Terpasang'})</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <span>{showAdvancedConfig ? 'Sembunyikan' : 'Lihat Detail'}</span>
                {showAdvancedConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showAdvancedConfig && (
              <div className="p-3.5 border-t border-[#1e2636] space-y-3 bg-[#0c0f16]">
                {/* Quick Paste Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                    <span>Paste Objek `firebaseConfig` Baru</span>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      placeholder="const firebaseConfig = { apiKey: '...', projectId: '...' };"
                      value={jsonConfigInput}
                      onChange={(e) => setJsonConfigInput(e.target.value)}
                      className="flex-1 bg-[#0b0d13] border border-[#222a3a] focus:border-blue-500 rounded-md p-2 text-xs font-mono text-slate-200 outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={handlePasteJson}
                      className="px-3 bg-[#161c28] hover:bg-[#1f2738] text-blue-400 rounded-md text-xs font-medium border border-[#283244] transition-colors shrink-0"
                    >
                      Ekstrak
                    </button>
                  </div>
                </div>

                {/* Manual Form Fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-300">API Key (Masked)</label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showApiKey ? 'Tutup' : 'Lihat'}
                      </button>
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-[#0b0d13] border border-[#222a3a] focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">Project ID</label>
                    <input
                      type="text"
                      placeholder="my-note-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full bg-[#0b0d13] border border-[#222a3a] focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">Auth Domain (Opsional)</label>
                    <input
                      type="text"
                      placeholder="my-note-project.firebaseapp.com"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      className="w-full bg-[#0b0d13] border border-[#222a3a] focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">App ID (Opsional)</label>
                    <input
                      type="text"
                      placeholder="1:123456:web:abcd"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full bg-[#0b0d13] border border-[#222a3a] focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Firestore Security Rules helper */}
          <div className="p-3 bg-[#0e1118] border border-[#1e2636] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Rekomendasi Firestore Security Rules:
              </span>
              <button
                type="button"
                onClick={copySecurityRules}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedRules ? 'Tersalin' : 'Salin Rules'}
              </button>
            </div>
            <pre className="text-[10px] text-slate-300 font-mono bg-[#0b0d13] p-2.5 rounded border border-[#222a3a] overflow-x-auto">
{`allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);`}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e2636] bg-[#0e1118]">
          <button
            type="button"
            onClick={handleClearConfig}
            className="text-xs text-rose-400 hover:underline"
          >
            Reset Config
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 hover:bg-[#182030] text-slate-300 hover:text-white rounded-md text-xs transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium rounded-md text-xs transition-colors"
            >
              Simpan & Hubungkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
