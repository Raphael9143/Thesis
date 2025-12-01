import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConstraintModal from '../ConstraintModal';

describe('ConstraintModal', () => {
  it('renders and calls onCreate with text', () => {
    const onChange = vi.fn();
    const onCancel = vi.fn();
    const onCreate = vi.fn();
    render(
      <ConstraintModal
        draft={{ expression: 'x>0' }}
        onChange={onChange}
        onCancel={onCancel}
        onCreate={onCreate}
      />
    );

    expect(screen.getByText('New Constraint')).toBeTruthy();
    fireEvent.click(screen.getByText('Create'));
    expect(onCreate).toHaveBeenCalled();
  });
});
