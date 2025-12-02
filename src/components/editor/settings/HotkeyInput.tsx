import { useState, useRef, useEffect, useCallback } from 'react';
import { backend } from '../../../services/backend';
import { Keyboard, X } from 'lucide-react';
import styles from './HotkeyInput.module.css';

interface HotkeyInputProps {
  value: string | null;
  onChange: (hotkey: string | null) => void;
  disabled?: boolean;
}

/** Key display mappings for visual tokens */
const KEY_DISPLAY: Record<string, string> = {
  // Modifiers - macOS style
  Meta: '\u2318', // ⌘
  Control: '\u2303', // ⌃
  Alt: '\u2325', // ⌥
  Shift: '\u21E7', // ⇧
  // Common keys
  Space: 'Space',
  Enter: '\u21B5', // ↵
  Tab: '\u21E5', // ⇥
  Escape: '\u238B', // ⎋
  Backspace: '\u232B', // ⌫
  Delete: '\u2326', // ⌦
  ArrowUp: '\u2191', // ↑
  ArrowDown: '\u2193', // ↓
  ArrowLeft: '\u2190', // ←
  ArrowRight: '\u2192', // →
};

/** Convert a KeyboardEvent to a hotkey string */
function keyboardEventToHotkey(e: KeyboardEvent): string | null {
  // Need at least one modifier for a global hotkey
  if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    return null;
  }

  // Don't allow just modifier keys
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
    return null;
  }

  const parts: string[] = [];

  // Build modifier string (use CommandOrControl for cross-platform)
  if (e.metaKey || e.ctrlKey) {
    parts.push('CommandOrControl');
  }
  if (e.altKey) {
    parts.push('Alt');
  }
  if (e.shiftKey) {
    parts.push('Shift');
  }

  // Add the key
  let key = e.key;

  // Normalize key names
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join('+');
}

/** Parse a hotkey string into display tokens */
function parseHotkeyToTokens(hotkey: string): string[] {
  const parts = hotkey.split('+');
  const tokens: string[] = [];

  for (const part of parts) {
    const partLower = part.toLowerCase();
    if (partLower === 'commandorcontrol' || partLower === 'command' || partLower === 'meta') {
      tokens.push(KEY_DISPLAY.Meta);
    } else if (partLower === 'control' || partLower === 'ctrl') {
      tokens.push(KEY_DISPLAY.Control);
    } else if (partLower === 'alt' || partLower === 'option') {
      tokens.push(KEY_DISPLAY.Alt);
    } else if (partLower === 'shift') {
      tokens.push(KEY_DISPLAY.Shift);
    } else {
      // Check for special key display
      const display = KEY_DISPLAY[part] || KEY_DISPLAY[part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()];
      tokens.push(display || part);
    }
  }

  return tokens;
}

/** Debounce delay before committing the hotkey (ms) */
const COMMIT_DELAY = 300;

export function HotkeyInput({ value, onChange, disabled }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [pendingHotkey, setPendingHotkey] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  // Track what we've committed so we can show it until value updates
  const [committedHotkey, setCommittedHotkey] = useState<string | null>(null);

  const inputRef = useRef<HTMLDivElement>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear commit timer on unmount
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  // When value updates to match what we committed, clear the committed state
  useEffect(() => {
    if (committedHotkey && value === committedHotkey) {
      setCommittedHotkey(null);
    }
  }, [value, committedHotkey]);

  const cancelRecording = useCallback(async () => {
    // Clear any pending commit
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    setIsRecording(false);
    setPendingHotkey(null);

    // Resume the global hotkey
    if (isPaused) {
      try {
        await backend.resumeHotkey();
      } catch (e) {
        console.error('Failed to resume hotkey:', e);
      }
      setIsPaused(false);
    }
  }, [isPaused]);

  const commitHotkey = useCallback(async (hotkey: string) => {
    // Clear timer
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    // Store what we're committing so we can display it until value updates
    setCommittedHotkey(hotkey);
    setIsRecording(false);
    setPendingHotkey(null);
    setIsPaused(false);

    // Call onChange - this will trigger setHotkey in the store,
    // which handles re-registering the new hotkey
    onChange(hotkey);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return;

      e.preventDefault();
      e.stopPropagation();

      // Escape cancels recording
      if (e.key === 'Escape') {
        cancelRecording();
        return;
      }

      // Cancel any pending commit since user is still pressing keys
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }

      const hotkey = keyboardEventToHotkey(e);
      if (hotkey) {
        setPendingHotkey(hotkey);
      }
    },
    [isRecording, cancelRecording]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording || !pendingHotkey) return;

      e.preventDefault();
      e.stopPropagation();

      // Clear any existing timer
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
      }

      // Check if all modifier keys are released
      const allModifiersReleased = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;

      if (allModifiersReleased) {
        // All keys released - commit after a short delay
        // This gives time for any rapid key adjustments
        commitTimerRef.current = setTimeout(() => {
          commitHotkey(pendingHotkey);
        }, COMMIT_DELAY);
      }
    },
    [isRecording, pendingHotkey, commitHotkey]
  );

  // Attach/detach keyboard listeners
  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', handleKeyUp, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  // Click outside to cancel recording
  useEffect(() => {
    if (!isRecording) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        cancelRecording();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRecording, cancelRecording]);

  const startRecording = async () => {
    if (disabled) return;

    // Pause the global hotkey FIRST, then wait for it to complete
    try {
      await backend.pauseHotkey();
      setIsPaused(true);
    } catch (e) {
      console.error('Failed to pause hotkey:', e);
      // Continue anyway - the global shortcut might interfere but we'll try
    }

    // Now safe to start recording
    setIsRecording(true);
    setPendingHotkey(null);
    setCommittedHotkey(null);
  };

  const clearHotkey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setCommittedHotkey(null);
    onChange(null);
  };

  // Show pending hotkey while recording, committed hotkey while saving, or current value
  const displayHotkey = pendingHotkey || committedHotkey || value;
  const tokens = displayHotkey ? parseHotkeyToTokens(displayHotkey) : [];

  return (
    <div
      ref={inputRef}
      className={`${styles.container} ${isRecording ? styles.recording : ''} ${disabled ? styles.disabled : ''}`}
      onClick={startRecording}
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-testid="hotkey-input"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startRecording();
        }
      }}
    >
      <div className={styles.content}>
        {isRecording ? (
          <span className={styles.recordingText}>
            {pendingHotkey ? (
              <span className={styles.tokens}>
                {tokens.map((token, i) => (
                  <span key={i} className={styles.token}>
                    {token}
                  </span>
                ))}
              </span>
            ) : (
              'Press shortcut...'
            )}
          </span>
        ) : displayHotkey ? (
          <span className={styles.tokens}>
            {tokens.map((token, i) => (
              <span key={i} className={styles.token}>
                {token}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.placeholder}>
            <Keyboard size={14} />
            Click to set hotkey
          </span>
        )}
      </div>

      {displayHotkey && !isRecording && !disabled && (
        <button
          className={styles.clearButton}
          onClick={clearHotkey}
          title="Clear hotkey"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
