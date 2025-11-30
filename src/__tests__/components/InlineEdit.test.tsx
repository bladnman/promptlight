import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEdit } from '../../components/common/InlineEdit';

describe('InlineEdit', () => {
  describe('display mode', () => {
    it('renders value as text when not editing', () => {
      render(<InlineEdit value="Test Value" onChange={vi.fn()} />);

      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('renders placeholder when value is empty', () => {
      render(
        <InlineEdit value="" onChange={vi.fn()} placeholder="Enter text..." />
      );

      expect(screen.getByText('Enter text...')).toBeInTheDocument();
    });

    it('applies title variant styling', () => {
      render(<InlineEdit value="Title" onChange={vi.fn()} variant="title" />);

      const element = screen.getByText('Title');
      // CSS modules hash class names, so check for partial match
      expect(element.className).toMatch(/title/);
    });

    it('applies body variant styling by default', () => {
      render(<InlineEdit value="Body text" onChange={vi.fn()} />);

      const element = screen.getByText('Body text');
      // CSS modules hash class names, so check for partial match
      expect(element.className).toMatch(/body/);
    });
  });

  describe('edit mode', () => {
    it('enters edit mode on click', async () => {
      const user = userEvent.setup();
      render(<InlineEdit value="Test" onChange={vi.fn()} />);

      await user.click(screen.getByText('Test'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('Test');
    });

    it('enters edit mode on Enter key', async () => {
      const user = userEvent.setup();
      render(<InlineEdit value="Test" onChange={vi.fn()} />);

      const display = screen.getByRole('textbox');
      display.focus();
      await user.keyboard('{Enter}');

      // Should now be an input
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('focuses and selects input when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<InlineEdit value="Test" onChange={vi.fn()} />);

      await user.click(screen.getByText('Test'));

      const input = screen.getByRole('textbox');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('committing changes', () => {
    it('calls onChange on blur', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<InlineEdit value="Original" onChange={onChange} />);

      await user.click(screen.getByText('Original'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'New Value');
      fireEvent.blur(screen.getByRole('textbox'));

      expect(onChange).toHaveBeenCalledWith('New Value');
    });

    it('calls onChange on Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<InlineEdit value="Original" onChange={onChange} />);

      await user.click(screen.getByText('Original'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'New Value{Enter}');

      expect(onChange).toHaveBeenCalledWith('New Value');
    });

    it('does not call onChange if value unchanged', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<InlineEdit value="Same" onChange={onChange} />);

      await user.click(screen.getByText('Same'));
      fireEvent.blur(screen.getByRole('textbox'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('cancelling changes', () => {
    it('reverts on Escape key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<InlineEdit value="Original" onChange={onChange} />);

      await user.click(screen.getByText('Original'));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'Changed');
      await user.keyboard('{Escape}');

      // Should exit edit mode without calling onChange
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('calls onBlur callback when provided', async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      render(<InlineEdit value="Test" onChange={vi.fn()} onBlur={onBlur} />);

      await user.click(screen.getByText('Test'));
      fireEvent.blur(screen.getByRole('textbox'));

      expect(onBlur).toHaveBeenCalled();
    });
  });
});
