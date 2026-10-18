import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useConfirmStore } from '../store/useConfirmStore';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { isOpen, options, close } = useConfirmStore();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (options) {
          options.onConfirm();
          close();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, close]);

  if (!isOpen || !options) return null;

  const {
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    onConfirm,
  } = options;

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white font-medium';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white font-medium';
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white font-medium';
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-[#080a0f]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={close}
    >
      <div
        className="bg-[#121620] border border-[#263044] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header & Body */}
        <div className="p-5 flex gap-4 items-start">
          {renderIcon()}

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-semibold text-slate-100 leading-tight">
                {title}
              </h3>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a2233] transition-colors -mr-1 -mt-1"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-[#0e121a] border-t border-[#1e2636]">
          <button
            type="button"
            onClick={close}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-[#161c28] hover:bg-[#1e2738] border border-[#283246] transition-colors"
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-1.5 rounded-md text-xs transition-colors shadow-sm ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
