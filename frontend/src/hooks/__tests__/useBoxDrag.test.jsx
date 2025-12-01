import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import useBoxDrag from '../useBoxDrag';

function Host({ onReady }) {
  const positionsRef = React.useRef({ P: { x: 10, y: 20 } });
  const containerRef = React.useRef({});
  const setPositions = () => {};
  const api = useBoxDrag({ setPositions, containerRef, positionsRef });
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('startDrag callable without throwing when event target has no special closest', () => {
  let api;
  render(<Host onReady={(a) => (api = a)} />);
  const fakeEvent = {
    target: { closest: () => null },
    clientX: 10,
    clientY: 20,
    touches: null,
    pointerId: undefined,
    currentTarget: { setPointerCapture: () => {} },
  };
  expect(() => api.startDrag('P', fakeEvent)).not.toThrow();
});
