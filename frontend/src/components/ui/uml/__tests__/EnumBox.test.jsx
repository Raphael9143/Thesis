import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EnumBox from '../editor/EnumBox';

describe('EnumBox', () => {
  const en = { name: 'E1', values: ['v1', 'v2'] };
  const pos = { x: 0, y: 0 };

  it('shows enum values and calls onStartEdit when edit clicked', () => {
    const onStartEdit = vi.fn();
    render(
      <EnumBox
        en={en}
        pos={pos}
        boxRefs={{ current: {} }}
        startDrag={() => {}}
        editingName={null}
        onStartEdit={onStartEdit}
      />
    );

    expect(screen.getByText('v1')).toBeTruthy();
    expect(screen.getByText('v2')).toBeTruthy();

    fireEvent.click(screen.getByTitle('Edit'));
    expect(onStartEdit).toHaveBeenCalledWith('E1');
  });

  it('in edit mode calls onUpdateValue when value input changes', () => {
    const onUpdateValue = vi.fn();
    render(
      <EnumBox
        en={en}
        pos={pos}
        boxRefs={{ current: {} }}
        startDrag={() => {}}
        editingName={en.name}
        editValue={en.name}
        setEditValue={() => {}}
        onStartEdit={() => {}}
        onUpdateValue={onUpdateValue}
        newEnum={{ value: '', adding: false }}
      />
    );

    const inputs = screen.getAllByDisplayValue('v1');
    // ensure there is at least one input showing v1
    expect(inputs.length).toBeGreaterThan(0);
    fireEvent.change(inputs[0], { target: { value: 'v1-new' } });
    expect(onUpdateValue).toHaveBeenCalledWith(0, 'v1-new');
  });
});
