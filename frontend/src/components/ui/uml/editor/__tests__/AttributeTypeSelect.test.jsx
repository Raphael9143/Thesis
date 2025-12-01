import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AttributeTypeSelect from '../AttributeTypeSelect';

describe('AttributeTypeSelect', () => {
  it('calls onChange default when mounted with empty value', () => {
    const onChange = vi.fn();
    render(<AttributeTypeSelect value="" onChange={onChange} classes={[]} enums={[]} />);
    // useEffect triggers default 'String'
    // expect at least one call with 'String' (component may call with same value twice)
    expect(onChange.mock.calls.flat()).toContain('String');
  });

  it('allows selecting a different type', () => {
    const onChange = vi.fn();
    render(
      <AttributeTypeSelect
        value="String"
        onChange={onChange}
        classes={[{ name: 'C' }]}
        enums={[{ name: 'E' }]}
      />
    );
    const select = screen.getByDisplayValue('String');
    fireEvent.change(select, { target: { value: 'Integer' } });
    expect(onChange).toHaveBeenCalledWith('Integer');
  });
});
