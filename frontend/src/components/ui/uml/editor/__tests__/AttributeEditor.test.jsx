import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AttributeEditor from '../AttributeEditor';

describe('AttributeEditor', () => {
  it('renders non-editing view', () => {
    render(<AttributeEditor attr={{ name: 'a', type: 'String' }} idx={0} editing={false} />);
    expect(screen.getByText('a : String')).toBeTruthy();
  });

  it('renders editing view and calls onUpdate/onDelete', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <AttributeEditor
        attr={{ name: 'a', type: 'String' }}
        idx={0}
        editing
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
    const input = screen.getByDisplayValue('a');
    fireEvent.change(input, { target: { value: 'b' } });
    expect(onUpdate).toHaveBeenCalled();
    // delete icon is an <i> element - select by class and click
    const trash = container.querySelector('.fa-trash');
    if (trash) fireEvent.click(trash);
    expect(onDelete).toHaveBeenCalled();
  });
});
