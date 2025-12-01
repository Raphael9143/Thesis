import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UMLRoles from '../UMLRoles';

describe('UMLRoles', () => {
  it('renders role labels and calls startRoleDrag', () => {
    const startRoleDrag = vi.fn();
    const associations = [
      {
        parts: [
          { class: 'C1', role: 'r1' },
          { class: 'C2', role: 'r2' },
        ],
      },
    ];
    const rolePositions = { '0:0': { x: 10, y: 10 }, '0:1': { x: 20, y: 20 } };

    render(
      <UMLRoles
        rolePositions={rolePositions}
        associations={associations}
        startRoleDrag={startRoleDrag}
      />
    );

    expect(screen.getByText('r1')).toBeTruthy();
    expect(screen.getByText('r2')).toBeTruthy();

    fireEvent.mouseDown(screen.getByText('r1'));
    expect(startRoleDrag).toHaveBeenCalled();
  });
});
