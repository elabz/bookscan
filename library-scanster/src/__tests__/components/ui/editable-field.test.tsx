import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditableField } from '@/components/ui/editable-field';

describe('EditableField', () => {
  const defaultProps = {
    id: 'test-field',
    label: 'Test Label',
    value: '',
    onChange: vi.fn(),
    isLocked: false,
    onToggleLock: vi.fn(),
  };

  it('renders label and input', () => {
    render(<EditableField {...defaultProps} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<EditableField {...defaultProps} placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    render(<EditableField {...defaultProps} onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('shows edit button only when field has value', () => {
    const { rerender } = render(<EditableField {...defaultProps} value="" />);
    expect(screen.queryByTitle('Click to edit')).not.toBeInTheDocument();

    rerender(<EditableField {...defaultProps} value="some value" isLocked={true} />);
    expect(screen.getByTitle('Click to edit')).toBeInTheDocument();
  });

  it('disables input when locked with value', () => {
    render(<EditableField {...defaultProps} value="locked value" isLocked={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('keeps input enabled when locked but empty (auto-unlock for empty)', () => {
    render(<EditableField {...defaultProps} value="" isLocked={true} />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('enables input when unlocked with value', () => {
    render(<EditableField {...defaultProps} value="unlocked value" isLocked={false} />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('calls onToggleLock when edit button clicked', () => {
    const onToggleLock = vi.fn();
    render(
      <EditableField
        {...defaultProps}
        value="some value"
        isLocked={true}
        onToggleLock={onToggleLock}
      />
    );

    fireEvent.click(screen.getByTitle('Click to edit'));
    expect(onToggleLock).toHaveBeenCalledTimes(1);
  });

  it('renders textarea when type is textarea', () => {
    render(<EditableField {...defaultProps} type="textarea" />);
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('renders number input when type is number', () => {
    render(<EditableField {...defaultProps} type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});
