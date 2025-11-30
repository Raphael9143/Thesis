import React from 'react';
import { render } from '@testing-library/react';
import useBoxMeasurements from '../useBoxMeasurements';

function makeEl(w = 100, h = 50, left = 10, top = 20) {
  return {
    offsetWidth: w,
    offsetHeight: h,
    getBoundingClientRect: () => ({ left, top, width: w, height: h }),
  };
}

function Host({ onReady }) {
  const boxRefs = React.useRef({});
  const containerRef = React.useRef({ getBoundingClientRect: () => ({ left: 0, top: 0 }) });
  const positions = { A: { x: 5, y: 5 } };
  boxRefs.current['A'] = makeEl(120, 80, 10, 20);
  const { centerOf, getRect } = useBoxMeasurements({
    boxRefs,
    positions,
    containerRef,
    BOX_W: 200,
    BOX_MIN_H: 60,
  });
  React.useEffect(() => {
    if (onReady) onReady({ centerOf, getRect });
  }, [centerOf, getRect, onReady]);
  return null;
}

test('centerOf and getRect compute values', () => {
  let api;
  render(<Host onReady={(a) => (api = a)} />);
  expect(api).toBeDefined();
  const c = api.centerOf('A');
  expect(typeof c.x).toBe('number');
  const r = api.getRect('A');
  expect(r).toHaveProperty('left');
});
