import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TreeSection from '../TreeSection';

describe('TreeSection', () => {
  it('renders title and children and calls onAdd', () => {
    const onToggle = vi.fn();
    const onAdd = vi.fn();
    render(
      <TreeSection title="T" isOpen={false} onToggle={onToggle} count={1} onAdd={onAdd}>
        <div>child</div>
      </TreeSection>
    );
    expect(screen.getByText('T (1)')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Add T'));
    expect(onAdd).toHaveBeenCalled();
  });
});
