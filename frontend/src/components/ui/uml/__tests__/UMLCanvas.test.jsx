import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UMLCanvas from '../UMLCanvas';

describe('UMLCanvas', () => {
  it('renders a line for a binary association', () => {
    const classes = [
      { name: 'A', superclasses: [] },
      { name: 'B', superclasses: [] },
    ];
    const associations = [{ parts: [{ class: 'A' }, { class: 'B' }], type: 'association' }];

    const centerOf = (name) => (name === 'A' ? { x: 10, y: 10 } : { x: 100, y: 10 });
    const getRect = () => null; // avoid intersectBorder complexity

    const { container } = render(
      <UMLCanvas
        associations={associations}
        classes={classes}
        centerOf={centerOf}
        getRect={getRect}
      />
    );

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders associationclass box and text when attributes provided', () => {
    const classes = [
      { name: 'A', superclasses: [] },
      { name: 'B', superclasses: [] },
    ];
    const associations = [
      {
        parts: [{ class: 'A' }, { class: 'B' }],
        type: 'associationclass',
        name: 'MyAssoc',
        attributes: [{ name: 'a' }],
      },
    ];

    const centerOf = (name) => (name === 'A' ? { x: 10, y: 10 } : { x: 100, y: 10 });
    const getRect = () => null;

    const { container } = render(
      <UMLCanvas
        associations={associations}
        classes={classes}
        centerOf={centerOf}
        getRect={getRect}
      />
    );

    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts.some((t) => t && t.includes('MyAssoc'))).toBeTruthy();
  });
});
