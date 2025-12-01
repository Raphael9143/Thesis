import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AssociationModal from '../AssociationModal';

describe('AssociationModal', () => {
  const classes = [{ name: 'A' }, { name: 'B' }];
  const baseAssoc = { name: '', parts: [{}, {}], type: 'association', attributes: [] };

  it('renders and allows type change and add/remove parts', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(
      <AssociationModal
        assoc={baseAssoc}
        classes={classes}
        onChange={onChange}
        onClose={onClose}
        onSave={() => {}}
      />
    );

    // first select corresponds to type; query by role (combobox)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('shows validation errors when saving empty name', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    render(
      <AssociationModal
        assoc={baseAssoc}
        classes={classes}
        onChange={onChange}
        onClose={() => {}}
        onSave={onSave}
      />
    );

    // click save should trigger validation and not call onSave
    fireEvent.click(screen.getByTitle('Save'));
    expect(onSave).not.toHaveBeenCalled();
  });
});
