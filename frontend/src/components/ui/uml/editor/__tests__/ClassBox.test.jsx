import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClassBox from '../ClassBox';

describe('ClassBox', () => {
  const c = { name: 'C1', attributes: [{ name: 'a', type: 'String' }] };
  const pos = { x: 0, y: 0 };

  it('renders class name and edit button', () => {
    const onStartEdit = vi.fn();
    render(
      <ClassBox
        c={c}
        pos={pos}
        boxRefs={{ current: {} }}
        startDrag={() => {}}
        editingName={null}
        onStartEdit={onStartEdit}
        attrs={c.attributes}
        classes={[]}
        enums={[]}
        onDeleteClass={() => {}}
      />
    );

    expect(screen.getByText('C1')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Edit'));
    expect(onStartEdit).toHaveBeenCalledWith('C1');
  });
});
