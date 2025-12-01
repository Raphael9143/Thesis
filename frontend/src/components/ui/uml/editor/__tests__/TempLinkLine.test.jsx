import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TempLinkLine from '../TempLinkLine';

describe('TempLinkLine', () => {
  it('renders nothing when no linkDrag', () => {
    const { container } = render(<TempLinkLine linkDrag={null} centerOf={() => null} />);
    expect(container.querySelector('line')).toBeNull();
  });

  it('renders a line when linkDrag and center available', () => {
    const linkDrag = { from: 'A', x: 50, y: 60 };
    const centerOf = () => ({ x: 10, y: 10 });
    const { container } = render(<TempLinkLine linkDrag={linkDrag} centerOf={centerOf} />);
    expect(container.querySelector('line')).not.toBeNull();
  });
});
