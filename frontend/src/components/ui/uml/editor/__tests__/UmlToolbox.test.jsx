import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UmlToolbox from '../UmlToolbox';

describe('UmlToolbox', () => {
  it('renders toolbox items', () => {
    const onToolDragStart = () => {};
    render(<UmlToolbox onToolDragStart={onToolDragStart} />);
    expect(screen.getByTitle('Add Class')).toBeTruthy();
    expect(screen.getByTitle('Add Enumeration')).toBeTruthy();
  });
});
