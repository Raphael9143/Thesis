import React from 'react';
import { render } from '@testing-library/react';
import useLinkDrag from '../useLinkDrag';

function Host({ onReady, onAddAssociation }) {
  const positionsRef = React.useRef({ A: { x: 0, y: 0 } });
  const containerRef = React.useRef({ getBoundingClientRect: () => ({ left: 0, top: 0 }) });
  const api = useLinkDrag({ positionsRef, containerRef, onAddAssociation });
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('addAssociation normalizes object and assigns id/type', () => {
  let api;
  const results = [];
  const collector = (a) => results.push(a);
  render(<Host onReady={(a) => (api = a)} onAddAssociation={collector} />);
  expect(api).toBeDefined();
  api.addAssociation({ parts: [{ class: 'A' }] });
  expect(results.length).toBe(1);
  expect(results[0].type).toBeDefined();
  expect(results[0].id).toBeDefined();
});
