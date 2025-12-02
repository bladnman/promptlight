import { useState, useEffect, useRef } from 'react';
import { ink, inkPlugin } from 'ink-mde';
import type { Instance } from 'ink-mde';
import { keymap } from '@codemirror/view';

/**
 * Test harness for verifying ink-mde whitespace preservation.
 * Access via: npm run dev:vite then navigate to http://localhost:1420/?window=test
 */
export function MarkdownEditorTest() {
  const [content, setContent] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create keyboard shortcuts for bold (Cmd+B) and italic (Cmd+I)
    const formattingKeymap = keymap.of([
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
    ]);

    // Wrap the keymap as an ink-mde plugin
    const keymapPlugin = inkPlugin({
      type: 'default',
      value: () => formattingKeymap,
    });

    editorRef.current = ink(containerRef.current, {
      doc: '',
      hooks: {
        afterUpdate: (doc: string) => {
          setContent(doc);
        },
      },
      interface: {
        toolbar: false,
        attribution: false, // Hide "powered by ink-mde"
        appearance: 'auto',
      },
      plugins: [keymapPlugin],
    });

    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  // Escape string for display (show \n, \t, etc.)
  const escapeForDisplay = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n\n') // Show \n and add actual newline for readability
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');
  };

  // Count trailing newlines
  const trailingNewlines = (content.match(/\n+$/)?.[0] || '').length;

  // Count consecutive blank lines (two or more \n in a row)
  const consecutiveBlankLines = (content.match(/\n\n+/g) || []).length;

  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      padding: '24px',
      height: '100vh',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, sans-serif',
      background: '#1a1a1a',
      color: '#e0e0e0',
    }}>
      {/* Editor Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <h3 style={{
          margin: 0,
          padding: '12px 16px',
          background: '#252525',
          borderBottom: '1px solid #333',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          ink-mde Editor
        </h3>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'auto',
          }}
        />
      </div>

      {/* Debug Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'auto',
      }}>
        {/* Raw Output */}
        <div style={{
          border: '1px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <h3 style={{
            margin: 0,
            padding: '12px 16px',
            background: '#252525',
            borderBottom: '1px solid #333',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            Raw Output (escaped)
          </h3>
          <pre style={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            fontFamily: 'Monaco, Consolas, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#1e1e1e',
            minHeight: '100px',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            {escapeForDisplay(content) || '(empty)'}
          </pre>
        </div>

        {/* JSON Output */}
        <div style={{
          border: '1px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <h3 style={{
            margin: 0,
            padding: '12px 16px',
            background: '#252525',
            borderBottom: '1px solid #333',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            JSON.stringify() Output
          </h3>
          <pre style={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            fontFamily: 'Monaco, Consolas, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#1e1e1e',
            minHeight: '60px',
            maxHeight: '150px',
            overflow: 'auto',
            color: '#9cdcfe',
          }}>
            {JSON.stringify(content)}
          </pre>
        </div>

        {/* Stats */}
        <div style={{
          border: '1px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <h3 style={{
            margin: 0,
            padding: '12px 16px',
            background: '#252525',
            borderBottom: '1px solid #333',
            fontSize: '14px',
            fontWeight: 600,
          }}>
            Whitespace Stats
          </h3>
          <div style={{
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '13px',
          }}>
            <div>
              <span style={{ color: '#888' }}>Total characters:</span>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>{content.length}</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Total lines:</span>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>{content.split('\n').length}</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Trailing newlines:</span>
              <span style={{
                marginLeft: '8px',
                fontWeight: 600,
                color: trailingNewlines > 0 ? '#4ec9b0' : '#888',
              }}>
                {trailingNewlines}
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Blank line groups:</span>
              <span style={{
                marginLeft: '8px',
                fontWeight: 600,
                color: consecutiveBlankLines > 0 ? '#4ec9b0' : '#888',
              }}>
                {consecutiveBlankLines}
              </span>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div style={{
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '16px',
          background: '#252525',
          fontSize: '13px',
          lineHeight: 1.6,
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#dcdcaa' }}>Test Cases:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Type text, press Enter 3 times at end → should show 3 trailing newlines</li>
            <li>Type "Line 1", Enter, Enter, Enter, "Line 2" → should show 2 blank line groups</li>
            <li>Leave editor, come back → whitespace should be preserved</li>
            <li>Paste text with trailing spaces → should be preserved</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
