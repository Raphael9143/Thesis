import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UMLClasses from '../UMLClasses';

describe('UMLClasses', () => {
  it('renders classes and enum values', () => {
    const classes = [{ name: 'C1', attributes: [{ name: 'a', type: 'String' }] }];
    const enums = [{ name: 'E1', values: ['v1'] }];
    const boxRefs = { current: {} };
    const positions = { C1: { x: 0, y: 0 }, 'enum:E1': { x: 10, y: 20 } };
    const startDrag = () => {};

    render(
      <UMLClasses
        classes={classes}
        enums={enums}
        positions={positions}
        boxRefs={boxRefs}
        startDrag={startDrag}
        BOX_W={220}
        BOX_MIN_H={60}
      />
    );

    expect(screen.getByText('C1')).toBeTruthy();
    // attributes may be split across text nodes, match with regex
    expect(screen.getByText(/a\s*:\s*String/)).toBeTruthy();
    // enumeration label may contain surrounding text, match by regex
    expect(screen.getByText(/E1/)).toBeTruthy();
    expect(screen.getByText(/v1/)).toBeTruthy();
  });
});
