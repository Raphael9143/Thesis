import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import useTitle from '../useTitle';
import PageInfoContext from '../../contexts/PageInfoContext';

function Host({ title, onReady }) {
  useTitle(title);
  React.useEffect(() => {
    onReady && onReady();
  }, [onReady]);
  return null;
}

test('useTitle calls setTitle from PageInfoContext', async () => {
  const setTitle = vi.fn();
  render(
    <PageInfoContext.Provider value={{ setTitle }}>
      <Host title="My Page" />
    </PageInfoContext.Provider>
  );

  await waitFor(() => {
    expect(setTitle).toHaveBeenCalledWith('My Page');
  });
});
