import { useState, useRef, useEffect } from 'react';
import {
  PROMPT_ICONS,
  PROMPT_COLORS,
  type PromptIconName,
  type PromptColorName,
} from '../../config/constants';
import { Icon } from './Icon';
import styles from './IconColorPicker.module.css';

interface IconColorPickerProps {
  icon: PromptIconName;
  color: PromptColorName;
  onIconChange: (icon: PromptIconName) => void;
  onColorChange: (color: PromptColorName) => void;
}

export function IconColorPicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: IconColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'icon' | 'color'>('icon');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentColor = PROMPT_COLORS[color];

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: currentColor }}
        title="Change icon and color"
      >
        <Icon name={icon} size={20} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'icon' ? styles.active : ''}`}
              onClick={() => setActiveTab('icon')}
            >
              Icon
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'color' ? styles.active : ''}`}
              onClick={() => setActiveTab('color')}
            >
              Color
            </button>
          </div>

          {activeTab === 'icon' && (
            <div className={styles.iconGrid}>
              {PROMPT_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  className={`${styles.iconOption} ${iconName === icon ? styles.selected : ''}`}
                  onClick={() => {
                    onIconChange(iconName);
                    setIsOpen(false);
                  }}
                  title={iconName}
                  style={{ color: currentColor }}
                >
                  <Icon name={iconName} size={18} />
                </button>
              ))}
            </div>
          )}

          {activeTab === 'color' && (
            <div className={styles.colorGrid}>
              {(Object.entries(PROMPT_COLORS) as [PromptColorName, string][]).map(
                ([colorName, colorValue]) => (
                  <button
                    key={colorName}
                    type="button"
                    className={`${styles.colorOption} ${colorName === color ? styles.selected : ''}`}
                    onClick={() => {
                      onColorChange(colorName);
                      setIsOpen(false);
                    }}
                    title={colorName}
                    style={{ backgroundColor: colorValue }}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
