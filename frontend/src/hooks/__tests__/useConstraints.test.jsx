import React from 'react';
import { test, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import useConstraints from '../useConstraints';

function Capture({ onReady }) {
  const api = useConstraints();
  React.useEffect(() => {
    if (onReady) onReady(api);
  }, [api, onReady]);
  return null;
}

test('openConstraintModal and createConstraint work and parse owner/type', async () => {
  let api;
  render(<Capture onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());

  act(() => {
    api.openConstraintModal();
  });

  let created;
  act(() => {
    created = api.createConstraint('pre:Owner x > 0');
  });

  await waitFor(() => {
    expect(api.constraints.length).toBe(1);
  });

  expect(created.ownerClass).toBe('Owner');
  expect(created.type).toBe('pre');
  expect(created.expression).toContain('x > 0');
});

test('deleteConstraint removes by id', async () => {
  let api;
  render(<Capture onReady={(a) => (api = a)} />);
  await waitFor(() => expect(api).toBeDefined());
  let created;
  act(() => {
    api.openConstraintModal();
    created = api.createConstraint('inv: A >= B');
  });
  await waitFor(() => expect(api.constraints.length).toBe(1));
  act(() => api.deleteConstraint(created.id));
  await waitFor(() => expect(api.constraints.length).toBe(0));
});
