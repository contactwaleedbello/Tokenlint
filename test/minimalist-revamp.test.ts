import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getContrastRatio } from '../lib/validation/contrast';

describe('Minimalist UI Revamp Verification', () => {
  const cssFiles = [
    path.resolve(__dirname, '../components/FileUploader.module.css'),
    path.resolve(__dirname, '../components/ResultsDisplay.module.css'),
    path.resolve(__dirname, '../app/page.module.css'),
  ];
  const tokensCss = fs.readFileSync(path.resolve(__dirname, '../styles/tokens.css'), 'utf8');

  it('confirms all CSS files use exclusively tokens with zero hardcoded hex colors or px values', () => {
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');

      // Check hex colors
      const hexMatches = stripped.match(/#[0-9a-f]{3,8}\b/gi);
      expect(hexMatches, `Found hardcoded hex in ${path.basename(file)}: ${hexMatches}`).toBeNull();

      // Check hardcoded px outside of var()
      const hardcodedPx = stripped.match(/:\s*[^;\n]*?\b\d+px\b/gi);
      expect(hardcodedPx, `Found hardcoded px in ${path.basename(file)}: ${hardcodedPx}`).toBeNull();
    }
  });

  it('confirms every CSS variable used exists in tokens.css (zero invented tokens)', () => {
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const varMatches = content.match(/var\((--[a-z0-9-]+)\)/gi) || [];
      const usedVars = new Set(
        varMatches.map((m) => m.replace(/^var\(/, '').replace(/\)$/, ''))
      );

      for (const v of usedVars) {
        expect(tokensCss, `Variable ${v} in ${path.basename(file)} not found in tokens.css`).toContain(v);
      }
    }
  });

  it('confirms WCAG AA (>= 4.5:1) contrast for all text and badge pairings in Light Mode', () => {
    // Light mode values from tokens.css
    const surfacePage = '#F2FDFF';
    const surfaceContainer = '#E5EFFF';
    const surfaceContainerHigh = '#D4DFEF';
    const textDefault = '#01030A';
    const textMuted = '#262E3B';
    const errorColor = '#910002';
    const warningColor = '#6D3A00';
    const successColor = '#00582D';

    // Pairings
    expect(getContrastRatio(textDefault, surfacePage)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textMuted, surfacePage)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textDefault, surfaceContainer)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textMuted, surfaceContainer)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textDefault, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(errorColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(warningColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(successColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
  });

  it('confirms WCAG AA (>= 4.5:1) contrast for all text and badge pairings in Dark Mode', () => {
    // Dark mode values from tokens.css (.dark)
    const surfacePage = '#01030A';
    const surfaceContainer = '#0F1621';
    const surfaceContainerHigh = '#262E3B';
    const textDefault = '#D4DFEF';
    const textMuted = '#959FAE';
    const errorColor = '#FF887F';
    const warningColor = '#ECB164';
    const successColor = '#7ED3A0';

    // Pairings
    expect(getContrastRatio(textDefault, surfacePage)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textMuted, surfacePage)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textDefault, surfaceContainer)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textMuted, surfaceContainer)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(textDefault, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(errorColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(warningColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(successColor, surfaceContainerHigh)).toBeGreaterThanOrEqual(4.5);
  });
});
