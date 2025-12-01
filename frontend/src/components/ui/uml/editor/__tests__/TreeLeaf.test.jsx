import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TreeLeaf from '../TreeLeaf';

describe('TreeLeaf', () => {
  it('renders label and responds to click', () => {
    const onClick = vi.fn();
    render(<TreeLeaf label="Leaf1" onClick={onClick} />);
    expect(screen.getByText('Leaf1')).toBeTruthy();
    fireEvent.click(screen.getByText('Leaf1'));
    expect(onClick).toHaveBeenCalled();
  });
});
