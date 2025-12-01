import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UMLHeader from '../UMLHeader';

describe('UMLHeader', () => {
  it('shows model name and calls onClose', () => {
    const onClose = vi.fn();
    render(<UMLHeader model={{ model: 'MyModel' }} onClose={onClose} />);
    expect(screen.getByText('MyModel')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Close preview'));
    expect(onClose).toHaveBeenCalled();
  });
});
