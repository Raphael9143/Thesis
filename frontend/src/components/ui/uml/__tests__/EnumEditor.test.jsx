import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EnumEditor from '../EnumEditor';

describe('EnumEditor', () => {
  const en = { name: 'E1', values: ['v1'] };

  it('renders enum and starts edit', () => {
    const onStartEdit = vi.fn();
    render(<EnumEditor en={en} editingName={null} editingType={null} onStartEdit={onStartEdit} />);
    expect(screen.getByText('<<enumeration>>')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Edit'));
    expect(onStartEdit).toHaveBeenCalled();
  });

  it('in edit mode shows inputs and can add value UI', () => {
    const onUpdateValue = vi.fn();
    const onStartAddValue = vi.fn();
    render(
      <EnumEditor
        en={en}
        editingName={en.name}
        editingType={'enum'}
        editValue={en.name}
        onUpdateValue={onUpdateValue}
        onStartAddValue={onStartAddValue}
        newEnum={{ adding: false, value: '' }}
      />
    );

    // v1 is rendered inside an input in edit mode, use display value
    expect(screen.getByDisplayValue('v1')).toBeTruthy();
    fireEvent.click(screen.getByText('+ value'));
    expect(onStartAddValue).toHaveBeenCalled();
  });
});
