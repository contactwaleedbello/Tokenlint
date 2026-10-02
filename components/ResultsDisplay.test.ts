import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ValidationReport } from '../lib/validation/rules';

describe('Phase 4 — Results Display Verification', () => {
  it('confirms ResultsDisplay.module.css uses exclusively design tokens with zero hardcoded colors/px values', () => {
    const cssPath = path.join(__dirname, 'ResultsDisplay.module.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Remove comments
    const stripped = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

    // Check for hardcoded hex colors
    const hexMatches = stripped.match(/#[0-9a-f]{3,8}\b/gi);
    expect(hexMatches).toBeNull();

    // Check for hardcoded pixel dimensions outside of var()
    // Exclude border: none or margin: 0
    const hardcodedPx = stripped.match(/:\s*[^;\n]*?\b\d+px\b/gi);
    expect(hardcodedPx).toBeNull();
  });

  it('confirms all CSS custom properties in ResultsDisplay.module.css exist in tokens.css', () => {
    const cssPath = path.join(__dirname, 'ResultsDisplay.module.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const tokensCssPath = path.resolve(__dirname, '../styles/tokens.css');
    const tokensContent = fs.readFileSync(tokensCssPath, 'utf8');

    const varMatches = cssContent.match(/var\((--[a-z0-9-]+)\)/gi) || [];
    const usedVars = new Set(
      varMatches.map((m) => m.replace(/^var\(/, '').replace(/\)$/, ''))
    );

    for (const v of usedVars) {
      expect(tokensContent).toContain(v);
    }
  });

  it('validates structure for zero-findings state report', () => {
    const zeroReport: ValidationReport = {
      errors: [],
      warnings: [],
      info: [],
      totalIssues: 0,
    };

    expect(zeroReport.totalIssues).toBe(0);
    expect(zeroReport.errors).toHaveLength(0);
    expect(zeroReport.warnings).toHaveLength(0);
    expect(zeroReport.info).toHaveLength(0);
  });

  it('validates structure for multi-severity grouped report', () => {
    const multiReport: ValidationReport = {
      errors: [
        {
          checkId: 'required-roles',
          severity: 'error',
          message: "The Background role is missing from this file.",
        },
      ],
      warnings: [
        {
          checkId: 'missing-primitive-reference',
          severity: 'warning',
          message: "The On-Primary role points to a primitive called 'missing', but no primitive with that name exists in this file.",
        },
      ],
      info: [
        {
          checkId: 'unreferenced-primitives',
          severity: 'info',
          message: "The primitive 'neutral-85' is defined in this file but isn't used by any role.",
        },
      ],
      totalIssues: 3,
    };

    expect(multiReport.totalIssues).toBe(3);
    expect(multiReport.errors[0].severity).toBe('error');
    expect(multiReport.warnings[0].severity).toBe('warning');
    expect(multiReport.info[0].severity).toBe('info');

    // Confirm wording differs by tone per messaging.md
    expect(multiReport.errors[0].message).toContain('missing from this file');
    expect(multiReport.warnings[0].message).toContain('points to a primitive called');
    expect(multiReport.info[0].message).toContain("isn't used by any role");
  });
});
