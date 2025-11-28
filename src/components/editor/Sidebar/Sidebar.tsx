import { useEditorStore } from '../../../stores/editorStore';
import { PromptListItem } from './PromptListItem';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const {
    prompts,
    selectedPromptId,
    sidebarCollapsed,
    toggleSidebar,
    loadPrompt,
    createNew,
  } = useEditorStore();

  if (sidebarCollapsed) {
    return (
      <div className={styles.collapsed}>
        <button
          className={styles.expandButton}
          onClick={toggleSidebar}
          title="Show sidebar"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <h2 className={styles.title}>Prompts</h2>
        <div className={styles.actions}>
          <button
            className={styles.newButton}
            onClick={createNew}
            title="New prompt (Cmd+N)"
          >
            + New
          </button>
          <button
            className={styles.collapseButton}
            onClick={toggleSidebar}
            title="Hide sidebar"
          >
            ◀
          </button>
        </div>
      </header>

      <div className={styles.list}>
        {prompts.length === 0 ? (
          <div className={styles.empty}>No prompts yet</div>
        ) : (
          prompts.map((prompt) => (
            <PromptListItem
              key={prompt.id}
              prompt={prompt}
              isSelected={prompt.id === selectedPromptId}
              onClick={() => loadPrompt(prompt.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
