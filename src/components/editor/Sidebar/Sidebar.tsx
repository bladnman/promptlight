import { useMemo, useState, useCallback } from 'react';
import { Plus, PanelLeftClose, Menu } from 'lucide-react';
import { useEditorStore } from '../../../stores/editorStore';
import { useDerivedFolders } from '../../../hooks/useDerivedFolders';
import { SearchInput } from './SearchInput';
import { FolderSection } from './FolderSection';
import { NewFolderInput } from './NewFolderInput';
import { FolderContextMenu } from './FolderContextMenu';
import { FolderEditDialog } from './FolderEditDialog';
import styles from './Sidebar.module.css';

interface ContextMenuState {
  folder: string;
  position: { x: number; y: number };
}

export function Sidebar() {
  const {
    prompts,
    selectedPromptId,
    sidebarCollapsed,
    searchFilter,
    collapsedFolders,
    isAddingFolder,
    editingFolder,
    toggleSidebar,
    toggleFolderCollapsed,
    loadPrompt,
    createNew,
    startAddingFolder,
    startEditingFolder,
    cancelEditingFolder,
    deleteFolder,
  } = useEditorStore();

  // Derive visible folders from prompts (hides empty folders)
  const folders = useDerivedFolders(prompts);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleFolderContextMenu = useCallback((folder: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      folder,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRenameFolder = useCallback(() => {
    if (contextMenu) {
      startEditingFolder(contextMenu.folder);
    }
  }, [contextMenu, startEditingFolder]);

  const handleDeleteFolder = useCallback(() => {
    if (contextMenu) {
      deleteFolder(contextMenu.folder);
    }
  }, [contextMenu, deleteFolder]);

  // Group prompts by folder with filtering
  const { promptsByFolder, folderCounts } = useMemo(() => {
    const groups: Record<string, typeof prompts> = {};
    const counts: Record<string, { filtered: number; total: number }> = {};

    // Initialize all folders
    folders.forEach((folder) => {
      groups[folder] = [];
      counts[folder] = { filtered: 0, total: 0 };
    });

    // Count totals per folder
    prompts.forEach((prompt) => {
      if (counts[prompt.folder]) {
        counts[prompt.folder].total++;
      }
    });

    // Filter and group prompts
    const filterLower = searchFilter.toLowerCase();
    const filtered = searchFilter
      ? prompts.filter(
          (p) =>
            p.name.toLowerCase().includes(filterLower) ||
            p.description.toLowerCase().includes(filterLower)
        )
      : prompts;

    filtered.forEach((prompt) => {
      if (groups[prompt.folder]) {
        groups[prompt.folder].push(prompt);
        counts[prompt.folder].filtered++;
      }
    });

    // If not filtering, set filtered = total
    if (!searchFilter) {
      Object.keys(counts).forEach((folder) => {
        counts[folder].filtered = counts[folder].total;
      });
    }

    return { promptsByFolder: groups, folderCounts: counts };
  }, [prompts, folders, searchFilter]);

  const isFiltering = searchFilter.length > 0;

  if (sidebarCollapsed) {
    return (
      <div className={styles.collapsed}>
        <button
          className={styles.expandButton}
          onClick={toggleSidebar}
          title="Show sidebar"
        >
          <Menu size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <h2 className={styles.title}>Prompts</h2>
          <div className={styles.actions}>
            <button
              className={styles.newButton}
              onClick={createNew}
              title="New prompt (Cmd+N)"
            >
              <Plus size={14} />
              New
            </button>
            <button
              className={styles.collapseButton}
              onClick={toggleSidebar}
              title="Hide sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </header>

        <SearchInput />

        <div className={styles.folderActions}>
          <button
            className={styles.addFolderButton}
            onClick={startAddingFolder}
            title="Add new folder"
          >
            <Plus size={14} />
            Add Folder
          </button>
        </div>

        {isAddingFolder && <NewFolderInput />}

        <div className={styles.list}>
          {folders.length === 0 ? (
            <div className={styles.empty}>No prompts yet</div>
          ) : (
            folders.map((folder) => (
              <FolderSection
                key={folder}
                folderName={folder}
                prompts={promptsByFolder[folder] || []}
                filteredCount={folderCounts[folder]?.filtered || 0}
                totalCount={folderCounts[folder]?.total || 0}
                isCollapsed={collapsedFolders[folder] || false}
                isFiltering={isFiltering}
                onToggleCollapse={() => toggleFolderCollapsed(folder)}
                selectedPromptId={selectedPromptId}
                onSelectPrompt={loadPrompt}
                onFolderContextMenu={(e) => handleFolderContextMenu(folder, e)}
              />
            ))
          )}
        </div>
      </aside>

      {contextMenu && (
        <FolderContextMenu
          folderName={contextMenu.folder}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
        />
      )}

      {editingFolder && (
        <FolderEditDialog
          folderName={editingFolder}
          onClose={cancelEditingFolder}
        />
      )}
    </>
  );
}
