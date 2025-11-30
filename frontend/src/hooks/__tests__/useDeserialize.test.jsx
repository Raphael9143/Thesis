import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../../services/userAPI', () => ({
  default: {
    deserializeClass: vi.fn(async (d) => ({ success: true, data: { ok: true, passed: d } })),
  },
}));

import useDeserialize from '../useDeserialize';
import userAPI from '../../../services/userAPI';

function Capture({ onReady }) {
  const api = useDeserialize();
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('deserializeClass calls userAPI and returns data', async () => {
  let api;
  render(<Capture onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());

  let result;
  await act(async () => {
    result = await api.deserializeClass({ foo: 'b' });
  });

  expect(userAPI.deserializeClass).toHaveBeenCalled();
  expect(result).toHaveProperty('success', true);
});
