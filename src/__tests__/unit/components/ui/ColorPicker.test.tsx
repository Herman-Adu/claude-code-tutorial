/**
 * ColorPicker Component Tests
 *
 * Tests the ColorPicker component for selecting preset colors
 * and custom hex values.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ColorPicker,
  COLOR_CONFIG,
  getColorHex,
  getColorName,
} from '@/components/ui/ColorPicker';
import { LABEL_COLOR_PRESETS } from '@/lib/schemas';

// =============================================================================
// TEST SUITE
// =============================================================================

describe('ColorPicker', () => {
  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should render all preset color buttons', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      // Should have 8 preset color buttons
      const colorButtons = screen.getAllByRole('radio');
      expect(colorButtons).toHaveLength(8);
    });

    it('should show checkmark on selected preset color', () => {
      const onChange = vi.fn();
      const { container } = render(<ColorPicker value="blue" onChange={onChange} />);

      // Find the blue color button and check it has the selection indicator
      const blueButton = screen.getByLabelText('Blue');
      expect(blueButton).toHaveAttribute('aria-checked', 'true');

      // The checkmark SVG should be visible
      const checkmark = container.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });

    it('should not show custom input by default', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      expect(screen.queryByLabelText(/custom/i)).not.toBeInTheDocument();
    });

    it('should show custom input when showCustomInput is true', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} showCustomInput />);

      expect(screen.getByPlaceholderText('#RRGGBB')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ColorPicker value="blue" onChange={onChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render disabled state', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} disabled />);

      const buttons = screen.getAllByRole('radio');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Interaction Tests
  // ---------------------------------------------------------------------------

  describe('Interactions', () => {
    it('should call onChange when preset color is clicked', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      const redButton = screen.getByLabelText('Red');
      fireEvent.click(redButton);

      expect(onChange).toHaveBeenCalledWith('red');
    });

    it('should update selection when different color is clicked', () => {
      const onChange = vi.fn();
      const { rerender } = render(<ColorPicker value="blue" onChange={onChange} />);

      // Click green
      const greenButton = screen.getByLabelText('Green');
      fireEvent.click(greenButton);

      expect(onChange).toHaveBeenCalledWith('green');

      // Rerender with new value
      rerender(<ColorPicker value="green" onChange={onChange} />);

      // Green should now be selected
      expect(screen.getByLabelText('Green')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByLabelText('Blue')).toHaveAttribute('aria-checked', 'false');
    });

    it('should call onChange with hex value when valid hex is entered', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} showCustomInput />);

      const hexInput = screen.getByPlaceholderText('#RRGGBB');
      fireEvent.change(hexInput, { target: { value: '#ff5500' } });

      expect(onChange).toHaveBeenCalledWith('#ff5500');
    });

    it('should not call onChange for invalid hex input', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} showCustomInput />);

      const hexInput = screen.getByPlaceholderText('#RRGGBB');
      fireEvent.change(hexInput, { target: { value: '#invalid' } });

      // Should only have been called initially for preset selection
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not respond to clicks when disabled', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} disabled />);

      const redButton = screen.getByLabelText('Red');
      fireEvent.click(redButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should show color preview when valid hex is entered', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ColorPicker value="#ff5500" onChange={onChange} showCustomInput />
      );

      // Input should have the hex value
      const hexInput = screen.getByPlaceholderText('#RRGGBB');
      expect(hexInput).toHaveValue('#ff5500');

      // Preview element should be visible with the color
      const preview = container.querySelector('[style*="background-color"]');
      expect(preview).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Custom Hex Mode Tests
  // ---------------------------------------------------------------------------

  describe('Custom Hex Mode', () => {
    it('should start in custom mode when value is a hex color', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#ff5500" onChange={onChange} showCustomInput />);

      // No preset should be selected (all should be aria-checked="false")
      const presetButtons = screen.getAllByRole('radio');
      presetButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should switch from custom to preset mode when preset is clicked', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#ff5500" onChange={onChange} showCustomInput />);

      const blueButton = screen.getByLabelText('Blue');
      fireEvent.click(blueButton);

      expect(onChange).toHaveBeenCalledWith('blue');
    });

    it('should switch from preset to custom mode when hex is entered', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <ColorPicker value="blue" onChange={onChange} showCustomInput />
      );

      // Blue should be selected
      expect(screen.getByLabelText('Blue')).toHaveAttribute('aria-checked', 'true');

      // Enter custom hex
      const hexInput = screen.getByPlaceholderText('#RRGGBB');
      fireEvent.change(hexInput, { target: { value: '#123456' } });

      expect(onChange).toHaveBeenCalledWith('#123456');

      // Rerender with hex value
      rerender(<ColorPicker value="#123456" onChange={onChange} showCustomInput />);

      // Blue should no longer be selected
      expect(screen.getByLabelText('Blue')).toHaveAttribute('aria-checked', 'false');
    });

    it('should enforce max length on hex input', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} showCustomInput />);

      const hexInput = screen.getByPlaceholderText('#RRGGBB');
      expect(hexInput).toHaveAttribute('maxLength', '7');
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have accessible radiogroup', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-label', 'Select label color');
    });

    it('should have accessible labels for all colors', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      LABEL_COLOR_PRESETS.forEach((color) => {
        const expectedLabel = COLOR_CONFIG[color].name;
        expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument();
      });
    });

    it('should indicate selected state with aria-checked', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="green" onChange={onChange} />);

      expect(screen.getByLabelText('Green')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByLabelText('Blue')).toHaveAttribute('aria-checked', 'false');
    });

    it('should be keyboard navigable', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="blue" onChange={onChange} />);

      const colorButtons = screen.getAllByRole('radio');
      colorButtons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

describe('getColorHex', () => {
  it('should return hex for preset colors', () => {
    expect(getColorHex('red')).toBe('#ef4444');
    expect(getColorHex('blue')).toBe('#3b82f6');
    expect(getColorHex('green')).toBe('#22c55e');
  });

  it('should return hex as-is for hex values', () => {
    expect(getColorHex('#ff5500')).toBe('#ff5500');
    expect(getColorHex('#AABBCC')).toBe('#AABBCC');
  });

  it('should return default slate for unknown colors', () => {
    expect(getColorHex('unknown')).toBe('#94a3b8');
  });
});

describe('getColorName', () => {
  it('should return display name for preset colors', () => {
    expect(getColorName('red')).toBe('Red');
    expect(getColorName('blue')).toBe('Blue');
    expect(getColorName('green')).toBe('Green');
  });

  it('should return hex as-is for hex values', () => {
    expect(getColorName('#ff5500')).toBe('#ff5500');
  });

  it('should return the input for unknown colors', () => {
    expect(getColorName('unknown')).toBe('unknown');
  });
});

describe('COLOR_CONFIG', () => {
  it('should have all preset colors defined', () => {
    LABEL_COLOR_PRESETS.forEach((color) => {
      expect(COLOR_CONFIG[color]).toBeDefined();
      expect(COLOR_CONFIG[color].hex).toBeDefined();
      expect(COLOR_CONFIG[color].name).toBeDefined();
    });
  });

  it('should have valid hex values', () => {
    Object.values(COLOR_CONFIG).forEach((config) => {
      expect(config.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('should have capitalized display names', () => {
    Object.values(COLOR_CONFIG).forEach((config) => {
      expect(config.name[0]).toBe(config.name[0].toUpperCase());
    });
  });
});
