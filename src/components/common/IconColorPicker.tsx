import { useState, useRef, useEffect, useMemo } from 'react';
import {
  PROMPT_COLORS,
  type PromptIconName,
  type PromptColorName,
} from '../../config/constants';
import { searchIcons } from '../../config/iconData';
import { useIconPickerPreferences } from '../../hooks/useIconPickerPreferences';
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
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { preferences, addRecentIcon, setLastColor } = useIconPickerPreferences();

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    return searchIcons(searchQuery) as PromptIconName[];
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opening icon tab
  useEffect(() => {
    if (isOpen && activeTab === 'icon' && searchInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, activeTab]);

  const handleIconSelect = (iconName: PromptIconName) => {
    onIconChange(iconName);
    addRecentIcon(iconName);
  };

  const handleColorSelect = (colorName: PromptColorName) => {
    onColorChange(colorName);
    setLastColor(colorName);
  };

  const currentColor = PROMPT_COLORS[color];
  const { recentIcons } = preferences;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: currentColor }}
        title="Change icon and color"
        data-testid="icon-picker"
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
            <div className={styles.iconPanel}>
              {/* Sticky header with recent icons and search */}
              <div className={styles.stickyHeader}>
                {recentIcons.length > 0 && (
                  <div className={styles.recentSection}>
                    <span className={styles.recentLabel}>Recent</span>
                    <div className={styles.recentGrid}>
                      {recentIcons.map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          className={`${styles.iconOption} ${iconName === icon ? styles.selected : ''}`}
                          onClick={() => handleIconSelect(iconName as PromptIconName)}
                          title={iconName}
                          style={{ color: currentColor }}
                        >
                          <Icon name={iconName as PromptIconName} size={20} />
                        </button>
                      ))}
                    </div>
                    <div className={styles.separator} />
                  </div>
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Scrollable icon grid */}
              <div className={styles.iconGrid}>
                {filteredIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    className={`${styles.iconOption} ${iconName === icon ? styles.selected : ''}`}
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                    style={{ color: currentColor }}
                    data-testid={`icon-option-${iconName}`}
                  >
                    <Icon name={iconName} size={20} />
                  </button>
                ))}
                {filteredIcons.length === 0 && (
                  <div className={styles.noResults}>No icons found</div>
                )}
              </div>
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
                    onClick={() => handleColorSelect(colorName)}
                    title={colorName}
                    style={{ backgroundColor: colorValue }}
                    data-testid={`color-option-${colorName}`}
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
