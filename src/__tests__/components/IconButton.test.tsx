import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Copy, Trash2 } from 'lucide-react';
import { IconButton } from '../../components/common/IconButton';

describe('IconButton', () => {
  describe('rendering', () => {
    it('renders the icon', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} title="Copy" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTitle('Copy')).toBeInTheDocument();
    });

    it('applies default variant class', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} title="Copy" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('danger');
    });

    it('applies danger variant class', () => {
      render(
        <IconButton icon={Trash2} onClick={vi.fn()} variant="danger" title="Delete" />
      );

      const button = screen.getByRole('button');
      // CSS modules hash class names
      expect(button.className).toMatch(/danger/);
    });

    it('applies custom className', () => {
      render(
        <IconButton icon={Copy} onClick={vi.fn()} className="custom-class" title="Copy" />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('sizes', () => {
    it('uses default size (md)', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} title="Copy" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('sm');
    });

    it('applies small size', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} size="sm" title="Copy" />);

      const button = screen.getByRole('button');
      // CSS modules hash class names
      expect(button.className).toMatch(/sm/);
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<IconButton icon={Copy} onClick={onClick} title="Copy" />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<IconButton icon={Copy} onClick={onClick} disabled title="Copy" />);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('shows disabled state', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} disabled title="Copy" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has button type', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} title="Copy" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('has title for tooltip', () => {
      render(<IconButton icon={Copy} onClick={vi.fn()} title="Copy to clipboard" />);

      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    });
  });
});
