import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportModal from '../ExportModal';

describe('ExportModal', () => {
  const content = 'model MyModel { }';

  beforeEach(() => {
    // provide a clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders fileContent and calls onClose when overlay clicked', () => {
    const onClose = vi.fn();
    render(<ExportModal fileContent={content} onClose={onClose} />);

    expect(screen.getByLabelText('USE model output').textContent).toContain('MyModel');

    // clicking the overlay (dialog) should call onClose
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('copies to clipboard when copy icon clicked', async () => {
    const onClose = vi.fn();
    render(<ExportModal fileContent={content} onClose={onClose} />);

    const copyBtn = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyBtn);

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content));
  });
});
