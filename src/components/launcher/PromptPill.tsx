import { useLauncherStore } from '../../stores/launcherStore';
import styles from './PromptPill.module.css';

interface PromptPillProps {
  name: string;
}

export function PromptPill({ name }: PromptPillProps) {
  const { unpromote } = useLauncherStore();

  return (
    <button
      type="button"
      className={styles.pill}
      onClick={unpromote}
      title="Click to unpromote"
    >
      {name}
    </button>
  );
}
