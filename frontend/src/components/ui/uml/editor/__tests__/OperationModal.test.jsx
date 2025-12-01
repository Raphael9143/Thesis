import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OperationModal from '../OperationModal';

describe('OperationModal', () => {
  it('renders and calls onCreate', () => {
    const onChange = vi.fn();
    const onCancel = vi.fn();
    const onCreate = vi.fn();
    render(
      <OperationModal
        draft={{ name: 'op' }}
        onChange={onChange}
        onCancel={onCancel}
        onCreate={onCreate}
      />
    );
    fireEvent.click(screen.getByText('Create'));
    expect(onCreate).toHaveBeenCalled();
  });
});
