import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import type React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useNoteStore } from '../store/useNoteStore';
import { insertMarkdownSyntax } from '../utils/editorUtils';

export interface CodeEditorHandle {
  insertSyntax: (syntax: string) => void;
  scrollToPercentage: (percentage: number) => void;
}

interface CodeEditorProps {
  onScrollPercentage?: (percentage: number) => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ onScrollPercentage }, ref) => {
    const { activeNoteId, notes, updateNoteContent, fontSize, syncScrollEnabled } = useNoteStore();
    const cmRef = useRef<ReactCodeMirrorRef>(null);

    const activeNote = notes.find((n) => n.id === activeNoteId);
    const content = activeNote ? activeNote.content : '';

    const handleContentChange = useCallback(
      (value: string) => {
        if (activeNoteId) {
          updateNoteContent(activeNoteId, value);
        }
      },
      [activeNoteId, updateNoteContent]
    );

    useImperativeHandle(ref, () => ({
      insertSyntax: (syntax: string) => {
        const view = cmRef.current?.view;
        if (!view) return;

        const state = view.state;
        const mainSelection = state.selection.main;
        const from = mainSelection.from;
        const to = mainSelection.to;

        const { newText, newCursorPos } = insertMarkdownSyntax(content, syntax, from, to);
        if (activeNoteId) {
          updateNoteContent(activeNoteId, newText);
          setTimeout(() => {
            view.dispatch({
              selection: { anchor: newCursorPos },
              scrollIntoView: true,
            });
            view.focus();
          }, 10);
        }
      },
      scrollToPercentage: (percentage: number) => {
        const view = cmRef.current?.view;
        if (!view) return;
        const scroller = view.scrollDOM;
        if (scroller) {
          const maxScroll = scroller.scrollHeight - scroller.clientHeight;
          scroller.scrollTop = maxScroll * percentage;
        }
      },
    }));

    const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (!syncScrollEnabled || !onScrollPercentage) return;
      const target = e.currentTarget;
      const maxScroll = target.scrollHeight - target.clientHeight;
      if (maxScroll > 0) {
        const percentage = target.scrollTop / maxScroll;
        onScrollPercentage(percentage);
      }
    };

    if (!activeNote) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-500 bg-[#0d1117] text-sm">
          Select or create a note to start editing
        </div>
      );
    }

    return (
      <div 
        className="flex-1 h-full overflow-hidden flex flex-col bg-[#0b0e14]"
        style={{
          '--editor-font-size': `${fontSize}px`,
        } as React.CSSProperties}
        onScrollCapture={handleEditorScroll}
      >
        <CodeMirror
          ref={cmRef}
          value={content}
          height="100%"
          extensions={[markdown()]}
          theme={oneDark}
          onChange={handleContentChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          style={{
            fontSize: `${fontSize}px`,
            height: '100%',
          }}
        />
      </div>
    );
  }
);
