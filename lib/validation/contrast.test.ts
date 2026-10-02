import { describe, it, expect } from 'vitest';
import { getContrastRatio, formatContrastRatio } from './contrast';

describe('WCAG Contrast Ratio Reference Tests', () => {
  it('computes black (#000000) against white (#FFFFFF) to 21:1', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(formatContrastRatio(ratio)).toBe('21:1');
    expect(ratio).toBeCloseTo(21, 2);
  });

  it('computes #2B5F8A against white (#FFFFFF) to 6.8:1 (verified WCAG relative luminance)', () => {
    const ratio = getContrastRatio('#2B5F8A', '#FFFFFF');
    expect(formatContrastRatio(ratio)).toBe('6.8:1');
  });
});
