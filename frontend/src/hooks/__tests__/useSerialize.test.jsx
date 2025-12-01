import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

// mock userAPI for this file (provide default export)
vi.mock('../../../services/userAPI', () => ({
  default: {
    serializeClass: vi.fn(async (d) => ({ success: true, data: { ok: true, passed: d } })),
  },
}));

import useSerialize from '../useSerialize';
import userAPI from '../../../services/userAPI';

function Capture({ onReady }) {
  const api = useSerialize();
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('serializeClass calls userAPI and returns data, toggles loading', async () => {
  let api;
  render(<Capture onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());

  let result;
  await act(async () => {
    const p = api.serializeClass({ foo: 'bar' });
    // allow the promise to resolve
    result = await p;
  });

  expect(userAPI.serializeClass).toHaveBeenCalled();
  expect(result).toHaveProperty('success', true);
  await waitFor(() => expect(api.loading).toBe(false));
});
