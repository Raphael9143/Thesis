import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChoicePopup from '../ChoicePopup';

describe('ChoicePopup', () => {
  const choice = { x: 10, y: 10, from: 'A', to: 'B' };

  it('renders and picks types', () => {
    const onPickType = vi.fn();
    const onGeneralization = vi.fn();
    const onCancel = vi.fn();
    render(
      <ChoicePopup
        choice={choice}
        onPickType={onPickType}
        onGeneralization={onGeneralization}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByTitle('Association'));
    expect(onPickType).toHaveBeenCalledWith('association');
    fireEvent.click(screen.getByTitle('Generalization'));
    expect(onGeneralization).toHaveBeenCalled();
  });
});
