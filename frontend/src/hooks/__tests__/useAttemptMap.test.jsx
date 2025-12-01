import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { test, expect } from 'vitest';
import { vi } from 'vitest';

vi.mock('../../../services/userAPI', () => ({
  default: {
    getAssignmentRemainingAttempts: vi.fn(async (id) => ({
      success: true,
      data: { remaining_attempts: id % 2 === 0 ? 3 : 1 },
    })),
    getExamRemainingAttempts: vi.fn(async () => ({
      success: true,
      data: { remaining_attempts: 0 },
    })),
  },
}));

import useAttemptMap from '../useAttemptMap';
import userAPI from '../../../services/userAPI';

function Capture({ type, ids, onReady }) {
  const api = useAttemptMap(type, ids);
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('fetches map for assignments', async () => {
  let api;
  render(<Capture type="assignment" ids={[2, 3]} onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  await waitFor(() => expect(api.loading).toBe(false));
  expect(api.attemptsMap[2]).toBeDefined();
  expect(userAPI.getAssignmentRemainingAttempts).toHaveBeenCalled();
});
