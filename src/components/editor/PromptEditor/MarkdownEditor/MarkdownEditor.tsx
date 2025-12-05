import { useEffect, useRef, useCallback } from 'react';
import { ink, inkPlugin } from 'ink-mde';
import type { Instance } from 'ink-mde';
import { keymap, EditorView, ViewPlugin } from '@codemirror/view';
import { Prec, EditorSelection } from '@codemirror/state';
import styles from './MarkdownEditor.module.css';

// Debug logging for select-all issue (disabled in production)
const DEBUG_SELECT_ALL = false;
function logDebug(message: string, data?: unknown) {
  if (DEBUG_SELECT_ALL) {
    if (data !== undefined) {
      console.warn(`[MarkdownEditor] ${message}`, data);
    } else {
      console.warn(`[MarkdownEditor] ${message}`);
    }
  }
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Focus the editor on mount */
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your prompt content here...',
  autoFocus = false,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Instance | null>(null);
  const isInternalChange = useRef(false);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const autoFocusRef = useRef(autoFocus);

  // Keep refs in sync
  valueRef.current = value;
  onChangeRef.current = onChange;

  // Stable onChange callback - uses ref to avoid recreating editor on parent re-renders
  const handleChange = useCallback((doc: string) => {
    isInternalChange.current = true;
    onChangeRef.current(doc);
  }, []);

  // Initialize ink-mde editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content (handles React StrictMode double-mount)
    containerRef.current.innerHTML = '';

    // Create keyboard shortcuts for formatting and selection
    // Use Prec.highest to ensure our selectAll takes precedence over CodeMirror's default
    const formattingKeymap = Prec.highest(
      keymap.of([
        {
          key: 'Mod-a',
          run: () => {
            // Use ink-mde's native select API for maximum compatibility with WebKit
            const editor = editorRef.current;
            if (editor) {
              const doc = editor.getDoc();
              editor.select({ selection: { start: 0, end: doc.length } });
              return true;
            }
            return false;
          },
        },
        {
          key: 'Mod-b',
          run: () => {
            editorRef.current?.format('bold', {});
            return true;
          },
        },
        {
          key: 'Mod-i',
          run: () => {
            editorRef.current?.format('italic', {});
            return true;
          },
        },
      ])
    );

    // Wrap the keymap as an ink-mde plugin
    const keymapPlugin = inkPlugin({
      type: 'default',
      value: () => formattingKeymap,
    });

    // Track if we have a full-document selection active
    // When true, we re-apply selection on scroll to fix virtualization visual glitch
    let hasFullSelection = false;
    let fullSelectionDocLength = 0;

    // Plugin to re-apply full selection on scroll (fixes virtualization visual glitch)
    const selectionPersistPlugin = inkPlugin({
      type: 'default',
      value: () =>
        ViewPlugin.define((view) => {
          const onScroll = () => {
            if (hasFullSelection && fullSelectionDocLength > 0) {
              const state = view.state;
              const mainSel = state.selection.main;
              // Only re-apply if selection seems to have shrunk (virtualization issue)
              if (mainSel.anchor === 0 && mainSel.head < fullSelectionDocLength) {
                view.dispatch({
                  selection: EditorSelection.single(0, fullSelectionDocLength),
                });
              }
            }
          };
          view.scrollDOM.addEventListener('scroll', onScroll, { passive: true });
          return {
            destroy() {
              view.scrollDOM.removeEventListener('scroll', onScroll);
            },
          };
        }),
    });

    // Helper to set full selection state (called from select-all handler)
    const setFullSelectionState = (isFullSelection: boolean, docLength: number) => {
      hasFullSelection = isFullSelection;
      fullSelectionDocLength = docLength;
      logDebug('Full selection state:', { hasFullSelection, fullSelectionDocLength });
    };

    // Expose for use in selection handler
    (window as unknown as { __setFullSelectionState: typeof setFullSelectionState }).__setFullSelectionState = setFullSelectionState;

    editorRef.current = ink(containerRef.current, {
      doc: valueRef.current,
      hooks: {
        afterUpdate: handleChange,
      },
      interface: {
        toolbar: false,
        attribution: false,
        appearance: 'auto',
      },
      plugins: [keymapPlugin, selectionPersistPlugin],
      placeholder,
    });

    // Log when editor is initialized with content
    logDebug('=== EDITOR INITIALIZED ===');
    logDebug('Initial content:', valueRef.current);
    logDebug('Initial content length (chars):', valueRef.current.length);

    // Handle focus behavior
    if (autoFocusRef.current) {
      editorRef.current.focus();
    } else {
      // Prevent ink-mde from stealing focus when autoFocus is false
      // This fixes the issue where the body gets focus instead of title on new prompts
      setTimeout(() => {
        if (editorRef.current && document.activeElement?.closest('.ink-mde')) {
          (document.activeElement as HTMLElement)?.blur();
        }
      }, 0);
    }

    // WKWebView in Tauri intercepts Cmd+A at the native level before JavaScript.
    // We use multiple strategies to try to catch it:
    // 1. Document keydown with capture (works in regular browsers)
    // 2. beforeinput event (fires after native handling decides what to do)
    // 3. selectionchange event (to detect and fix partial selections)
    const container = containerRef.current;

    // Strategy 1: Standard keydown handler (may not fire in WKWebView for Cmd+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      logDebug('=== KEYDOWN EVENT ===', { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey });

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        logDebug('=== CMD+A PRESSED (keydown) ===');

        const activeElement = document.activeElement;
        const isInEditor = container?.contains(activeElement) || activeElement?.closest('.ink-mde');

        if (isInEditor) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          selectAllContent();
        }
      }
    };

    // Strategy 2: beforeinput event - fires when browser is about to modify content
    // This might fire even when WKWebView handles Cmd+A natively
    const handleBeforeInput = (e: InputEvent) => {
      logDebug('=== BEFOREINPUT EVENT ===', { inputType: e.inputType });

      // inputType for select-all is typically not fired, but let's log it
      if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
        return; // Let these through
      }
    };

    // Strategy 3: Listen for selection changes and AUTO-FIX partial selections
    // This fires AFTER WKWebView does its native select-all
    // If WKWebView selected from 0 to some partial point, we extend it to the end
    let lastSelectionTime = 0;
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) return;

      const activeElement = document.activeElement;
      const isInEditor = container?.contains(activeElement) || activeElement?.closest('.ink-mde');
      if (!isInEditor) return;

      // Debounce to avoid rapid-fire on selection changes
      const now = Date.now();
      if (now - lastSelectionTime < 100) return;
      lastSelectionTime = now;

      // Check if we have a partial selection that looks like a failed select-all
      const cmContent = container?.querySelector('.cm-content');
      if (cmContent) {
        const view = EditorView.findFromDOM(cmContent as HTMLElement);
        if (view) {
          const state = view.state;
          const mainSel = state.selection.main;
          const docLength = state.doc.length;

          // Detect partial selection: starts at 0, has significant content selected,
          // but doesn't reach the end. This is the signature of virtualization-broken select-all.
          // We use 100 chars as a threshold to avoid false positives from normal selections.
          const selectedLength = Math.abs(mainSel.head - mainSel.anchor);
          const isPartialSelectAll =
            mainSel.anchor === 0 &&
            mainSel.head > 100 &&
            mainSel.head < docLength &&
            selectedLength > 100;

          if (isPartialSelectAll) {
            logDebug('=== PARTIAL SELECTION DETECTED - AUTO-FIXING ===');
            logDebug('Current selection: 0 to ' + mainSel.head + ' (doc length: ' + docLength + ')');

            // Set state so scroll handler knows to maintain full selection
            const setFullSelectionState = (window as unknown as { __setFullSelectionState?: (isFull: boolean, len: number) => void }).__setFullSelectionState;
            if (setFullSelectionState) {
              setFullSelectionState(true, docLength);
            }

            // Use setTimeout to break out of the current event loop
            setTimeout(() => {
              // Re-get the view in case it changed
              const freshView = EditorView.findFromDOM(cmContent as HTMLElement);
              if (!freshView) {
                logDebug('ERROR: Could not find view for fix');
                return;
              }

              // Dispatch selection change with userEvent to ensure proper handling
              freshView.dispatch({
                selection: EditorSelection.single(0, docLength),
                userEvent: 'select',
              });

              freshView.requestMeasure();
              logDebug('Fixed selection via dispatch: 0 to ' + docLength);
            }, 10);
          } else if (mainSel.anchor !== 0 || mainSel.head !== docLength) {
            // Selection is not full-document, clear the persist state
            const setFullSelectionState = (window as unknown as { __setFullSelectionState?: (isFull: boolean, len: number) => void }).__setFullSelectionState;
            if (setFullSelectionState) {
              setFullSelectionState(false, 0);
            }
          }
        }
      }
    };

    // Helper function to select all content
    const selectAllContent = () => {
      const editor = editorRef.current;
      if (!editor) {
        logDebug('ERROR: No editor reference!');
        return;
      }

      const doc = editor.getDoc();
      logDebug('Selecting all: 0 to', doc.length);
      editor.select({ selection: { start: 0, end: doc.length } });

      // Verify selection after a tick
      setTimeout(() => {
        const selections = editor.selections();
        if (selections.length > 0) {
          const sel = selections[0];
          logDebug('Selected: start=' + sel.start + ', end=' + sel.end + ', total=' + doc.length);
        }
      }, 50);
    };

    // Attach handlers
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('beforeinput', handleBeforeInput as EventListener, true);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('beforeinput', handleBeforeInput as EventListener, true);
      document.removeEventListener('selectionchange', handleSelectionChange);
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [handleChange, placeholder]);

  // Sync external value changes to editor
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.getDoc() !== value) {
      logDebug('=== CONTENT LOADED/UPDATED ===');
      logDebug('New content:', value);
      logDebug('New content length (chars):', value.length);
      editorRef.current.update(value);
    }
  }, [value]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.editor} />
    </div>
  );
}
