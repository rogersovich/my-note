import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  children: React.ReactElement<any>;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  position = 'bottom',
  delay = 180,
  disabled = false,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tipWidth = tooltipEl ? tooltipEl.offsetWidth : 90;
    const tipHeight = tooltipEl ? tooltipEl.offsetHeight : 24;
    const gap = 6;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tipHeight - gap;
        left = rect.left + rect.width / 2 - tipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tipHeight / 2;
        left = rect.left - tipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Clamp inside viewport
    const padding = 8;
    left = Math.max(padding, Math.min(window.innerWidth - tipWidth - padding, left));
    top = Math.max(padding, Math.min(window.innerHeight - tipHeight - padding, top));

    setCoords({ top, left });
  }, [position]);

  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      calculateCoords();
      setIsVisible(true);
    }, delay);
  }, [disabled, content, delay, calculateCoords]);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (isVisible) {
      calculateCoords();
      const handleScroll = () => hideTooltip();
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isVisible, calculateCoords, hideTooltip]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!React.isValidElement(children)) {
    return children;
  }

  const childProps = children.props as any;

  const triggerElement = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef && typeof originalRef === 'object') {
        originalRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      childProps.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      childProps.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      childProps.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      childProps.onBlur?.(e);
      hideTooltip();
    },
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e);
      hideTooltip();
    },
  } as any);

  return (
    <>
      {triggerElement}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="fixed z-50 pointer-events-none px-2 py-1 bg-[#121620] border border-[#2b364a] rounded shadow-xl text-[11px] font-medium text-slate-100 flex items-center gap-1.5 select-none whitespace-nowrap animate-in fade-in duration-75"
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1 py-0.2 bg-[#1b2232] text-slate-300 rounded text-[9px] font-mono border border-[#2f3b52]">
                {shortcut}
              </kbd>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
