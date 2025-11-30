import { ButtonHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'default', size = 'md', className, disabled, ...props }, ref) => {
    const variantClass = variant === 'danger' ? styles.danger : '';
    const sizeClass = size === 'sm' ? styles.sm : '';

    return (
      <button
        ref={ref}
        type="button"
        className={`${styles.button} ${variantClass} ${sizeClass} ${className || ''}`}
        disabled={disabled}
        {...props}
      >
        <Icon size={size === 'sm' ? 14 : 16} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
