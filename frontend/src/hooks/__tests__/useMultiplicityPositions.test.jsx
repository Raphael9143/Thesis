import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import useMultiplicityPositions from '../useMultiplicityPositions';

const utils = {
  perpOffset: (p) => ({ x: p.x + 1, y: p.y + 1 }),
  offsetAlong: (c, t) => ({ x: (c.x + t.x) / 2, y: (c.y + t.y) / 2 }),
  intersectBorder: (rect, center) => ({ x: center.x + 5, y: center.y + 5 }),
};

function Host({ onReady }) {
  const associations = [{ parts: [{ class: 'A' }, { class: 'B' }] }];
  const centerOf = (n) => ({ x: n === 'A' ? 10 : 50, y: 20 });
  const getRect = () => ({ left: 0, top: 0, width: 10, height: 10 });
  const mp = useMultiplicityPositions(associations, centerOf, getRect, utils);
  React.useEffect(() => {
    if (onReady) onReady(mp);
  }, [mp, onReady]);
  return null;
}

test('computes multiplicity positions for associations', () => {
  let mp;
  render(<Host onReady={(m) => (mp = m)} />);
  expect(mp).toBeDefined();
  // expect key like '0:0' present
  const keys = Object.keys(mp);
  expect(keys.length).toBeGreaterThan(0);
});
