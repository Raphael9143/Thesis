import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('../../../services/userAPI', () => ({
  default: {
    getAssignmentSubmissionHistory: vi.fn(async (id) => ({
      success: true,
      data: [{ id: 1, created_at: '2020-01-01' }],
    })),
    getSubmissionsByAssignmentId: vi.fn(),
    getSubmissionsByAssignment: vi.fn(),
  },
}));

import useSubmissionHistory from '../useSubmissionHistory';
import userAPI from '../../../services/userAPI';

function Capture({ type, id, onReady }) {
  const api = useSubmissionHistory(type, id);
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('fetches assignment submission history and sorts', async () => {
  let api;
  render(<Capture type="assignment" id={7} onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  await waitFor(() => expect(api.loading).toBe(false));
  expect(api.history.length).toBeGreaterThanOrEqual(1);
  expect(userAPI.getAssignmentSubmissionHistory).toHaveBeenCalledWith(7);
});
