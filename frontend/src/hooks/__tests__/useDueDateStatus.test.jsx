import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import useDueDateStatus from '../useDueDateStatus';

function Host({ due }) {
  const s = useDueDateStatus(due);
  return (
    <div>
      <span data-testid="formatted">{s.formatted}</span>
      <span data-testid="days">{String(s.daysLeft)}</span>
      <span data-testid="status">{s.status}</span>
    </div>
  );
}

test('no due date returns placeholder', () => {
  const { getByTestId } = render(<Host due={null} />);
  expect(getByTestId('formatted').textContent).toBe('No due date');
  expect(getByTestId('days').textContent).toBe('null');
  expect(getByTestId('status').textContent).toBe('normal');
});

test('past due date returns Expired', () => {
  const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const { getByTestId } = render(<Host due={past} />);
  expect(getByTestId('formatted').textContent).toBe('Expired');
  expect(getByTestId('days').textContent).toBe('null');
  expect(getByTestId('status').textContent).toBe('expired');
});

test('near future returns urgent', () => {
  const twoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const { getByTestId } = render(<Host due={twoDays} />);
  expect(getByTestId('status').textContent).toBe('urgent');
});
