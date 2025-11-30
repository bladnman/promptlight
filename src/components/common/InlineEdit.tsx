import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styles from './InlineEdit.module.css';

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'title' | 'body';
  onBlur?: () => void;
  className?: string;
}

export function InlineEdit({
  value,
  onChange,
  placeholder = '',
  variant = 'body',
  onBlur,
  className,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when value prop changes (e.g., from external update)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      if (editValue !== value) {
        onChange(editValue);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setEditValue(value); // Revert
    }
  };

  const variantClass = variant === 'title' ? styles.title : styles.body;
  const isEmpty = !value && !editValue;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={`${styles.input} ${variantClass} ${className || ''}`}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={`${styles.display} ${variantClass} ${isEmpty ? styles.placeholder : ''} ${className || ''}`}
      onClick={handleClick}
      role="textbox"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {value || placeholder}
    </div>
  );
}
