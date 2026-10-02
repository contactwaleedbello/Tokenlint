/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio calculation.
 * Reference: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses a hex color string (#RGB, #RRGGBB, or without #) into 8-bit RGB components.
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, '').trim();

  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }

  throw new Error(`Invalid hex color: "${hex}"`);
}

/**
 * Converts an 8-bit sRGB color channel value (0-255) to linear light value per WCAG 2.1.
 */
export function sRGBChannelToLinear(channel: number): number {
  const sRGB = channel / 255;
  if (sRGB <= 0.04045) {
    return sRGB / 12.92;
  }
  return Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Computes the relative luminance of a color per WCAG 2.1 definition:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G and B are defined in linear light space.
 */
export function getRelativeLuminance(color: string | RGB): number {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;
  const R = sRGBChannelToLinear(rgb.r);
  const G = sRGBChannelToLinear(rgb.g);
  const B = sRGBChannelToLinear(rgb.b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes the WCAG contrast ratio between two colors:
 * (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter luminance and L2 is the darker luminance.
 */
export function getContrastRatio(color1: string | RGB, color2: string | RGB): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const L1 = Math.max(lum1, lum2);
  const L2 = Math.min(lum1, lum2);

  return (L1 + 0.05) / (L2 + 0.05);
}

/**
 * Formats a contrast ratio rounded to 1 decimal place (e.g. 21.0 -> "21:1", 6.76 -> "6.8:1").
 */
export function formatContrastRatio(ratio: number): string {
  const rounded = Math.round(ratio * 10) / 10;
  return `${rounded}:1`;
}
