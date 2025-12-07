import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock serialize/deserialize hooks to avoid network calls

vi.mock('../../../../hooks/useSerialize', () => ({
  default: () => ({
    serializeClass: vi.fn().mockResolvedValue('class-text'),
    serializeAssociation: vi.fn().mockResolvedValue('assoc-text'),
    serializeOperation: vi.fn().mockResolvedValue('op-text'),
    serializeQueryOperation: vi.fn().mockResolvedValue('qop-text'),
    serializeConstraint: vi.fn().mockResolvedValue('inv-text'),
    serializeEnum: vi.fn().mockResolvedValue('enum-text'),
    loading: false,
  }),
}));

vi.mock('../../../../hooks/useDeserialize', () => ({
  default: () => ({
    deserializeClass: vi.fn().mockResolvedValue({ name: 'C' }),
    deserializeAssociation: vi.fn().mockResolvedValue({}),
    deserializeOperation: vi.fn().mockResolvedValue({}),
    deserializeQueryOperation: vi.fn().mockResolvedValue({}),
    deserializeConstraint: vi.fn().mockResolvedValue({}),
    deserializeEnum: vi.fn().mockResolvedValue({}),
    loading: false,
  }),
}));

import ModelTreePane from '../ModelTreePane';

describe('ModelTreePane', () => {
  it('renders root and sections', () => {
    const classes = [{ name: 'C', attributes: [] }];
    render(
      <ModelTreePane
        modelName="M"
        classes={classes}
        associations={[]}
        constraints={[]}
        enumerations={[]}
        onSelect={() => {}}
        onUpdateNode={() => {}}
      />
    );
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText(/Classes/)).toBeTruthy();
  });
});
