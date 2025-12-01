import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { test, expect } from 'vitest';
import { vi } from 'vitest';

vi.mock('../../../services/userAPI', () => ({
  default: {
    getAssignmentRemainingAttempts: vi.fn(async () => ({
      success: true,
      data: { remaining_attempts: 2 },
    })),
    getExamRemainingAttempts: vi.fn(async () => ({
      success: true,
      data: { remaining_attempts: 1 },
    })),
  },
}));

import useAttempt from '../useAttempt';
import userAPI from '../../../services/userAPI';

function Capture({ type, id, onReady }) {
  const api = useAttempt(type, id);
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('fetches assignment attempts on mount', async () => {
  let api;
  render(<Capture type="assignment" id={5} onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  await waitFor(() => expect(api.loading).toBe(false));
  expect(api.attempts).toEqual({ remaining_attempts: 2 });
  expect(userAPI.getAssignmentRemainingAttempts).toHaveBeenCalledWith(5);
});

test('refetch works for exam', async () => {
  let api;
  render(<Capture type="exam" id={9} onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  await act(async () => {
    await api.refetch();
  });
  expect(userAPI.getExamRemainingAttempts).toHaveBeenCalledWith(9);
});
