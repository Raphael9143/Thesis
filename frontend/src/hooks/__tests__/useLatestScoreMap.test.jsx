import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('../../../services/userAPI', () => ({
  default: {
    getAssignmentLatestScore: vi.fn(async (id) => ({
      success: true,
      data: { has_submission: true, score: id },
    })),
    getExamLatestScore: vi.fn(async (id) => ({
      success: true,
      data: { has_submission: false, score: null },
    })),
  },
}));

import useLatestScoreMap from '../useLatestScoreMap';
import userAPI from '../../../services/userAPI';

function Capture({ type, ids, onReady }) {
  const api = useLatestScoreMap(type, ids);
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('fills infoMap and scoresMap correctly', async () => {
  let api;
  render(<Capture type="assignment" ids={[1, 2]} onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  await waitFor(() => expect(api.loading).toBe(false));
  expect(api.infoMap[1].hasSubmission).toBe(true);
  expect(api.scoresMap[1]).toBe(1);
  expect(userAPI.getAssignmentLatestScore).toHaveBeenCalled();
});
