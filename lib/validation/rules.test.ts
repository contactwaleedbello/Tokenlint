import { describe, it, expect } from 'vitest';
import { parseTokensFile } from './parser';
import {
  REQUIRED_ROLES,
  CONTRAST_THRESHOLD,
  checkRequiredRoles,
  checkContrastPairs,
  checkMissingPrimitiveReferences,
  checkUnreferencedPrimitives,
  validateTokens,
} from './rules';
import fs from 'fs';
import path from 'path';

describe('Phase 3 — Validation Rules & Checks', () => {
  // Helper to build parsed data from JSON string
  const parseJson = (obj: any) => {
    const res = parseTokensFile(JSON.stringify(obj));
    if (!res.success) throw new Error('Fixture parse failed: ' + res.error);
    return res.data;
  };

  // ---------------------------------------------------------------------------
  // Check 1: Required-role presence (Error)
  // ---------------------------------------------------------------------------
  describe('Check 1: Required-role presence (Error)', () => {
    it('fails when required roles are missing, reporting Error with messaging.md format', () => {
      // Missing 'Secondary Container' and others
      const data = parseJson({
        color: {
          'primitive-blue': { $type: 'color', $value: '#005459' },
          primary: { $type: 'color', $value: '{color.primitive-blue}' },
        },
      });

      const issues = checkRequiredRoles(data);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((i) => i.severity === 'error')).toBe(true);

      const secondaryContainerIssue = issues.find((i) =>
        i.message.includes('Secondary Container')
      );
      expect(secondaryContainerIssue).toBeDefined();
      expect(secondaryContainerIssue?.severity).toBe('error');
      // Format per messaging.md
      expect(secondaryContainerIssue?.message).toBe(
        "The Secondary Container role is missing from this file. Components that rely on it won't have a defined color."
      );
    });

    it('passes when all 20 required roles are present', () => {
      // Build a minimal file containing all 20 required roles
      const tokensObj: Record<string, any> = {
        primitive: {
          color: { $type: 'color', $value: '#000000' },
        },
      };

      for (const roleName of REQUIRED_ROLES) {
        tokensObj[roleName] = {
          $type: 'color',
          $value: '{primitive.color}',
        };
      }

      const data = parseJson(tokensObj);
      const issues = checkRequiredRoles(data);
      expect(issues).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Check 2: On-X/X contrast (Error)
  // ---------------------------------------------------------------------------
  describe('Check 2: On-X/X contrast (Error)', () => {
    it('fails when an On-X/X pair contrast ratio is below 4.5:1, matching exact messaging.md format', () => {
      // Primary #777777 vs On-Primary #888888 -> contrast ratio is ~1.3:1 (< 4.5:1)
      const data = parseJson({
        color: {
          c1: { $type: 'color', $value: '#777777' },
          c2: { $type: 'color', $value: '#888888' },
          Primary: { $type: 'color', $value: '{color.c1}' },
          'On-Primary': { $type: 'color', $value: '{color.c2}' },
        },
      });

      const issues = checkContrastPairs(data);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].checkId).toBe('contrast-pairs');

      // Exact format: "Primary (#777777) vs On-Primary (#888888): 1.3:1, fails AA, needs 4.5:1."
      expect(issues[0].message).toBe(
        'Primary (#777777) vs On-Primary (#888888): 1.3:1, fails AA, needs 4.5:1.'
      );
    });

    it('passes when all defined On-X/X pairs meet or exceed the 4.5:1 threshold', () => {
      // Primary #000000 vs On-Primary #FFFFFF -> 21:1 (>= 4.5:1)
      const data = parseJson({
        color: {
          black: { $type: 'color', $value: '#000000' },
          white: { $type: 'color', $value: '#FFFFFF' },
          Primary: { $type: 'color', $value: '{color.black}' },
          'On-Primary': { $type: 'color', $value: '{color.white}' },
        },
      });

      const issues = checkContrastPairs(data);
      expect(issues).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Check 3: Role referencing a missing primitive (Warning)
  // ---------------------------------------------------------------------------
  describe('Check 3: Role referencing a missing primitive (Warning)', () => {
    it('fails when a role points to a non-existent primitive, reporting Warning with messaging.md format', () => {
      const data = parseJson({
        color: {
          'On-Primary': {
            $type: 'color',
            $value: '{global.color.primary-100}',
          },
        },
      });

      const issues = checkMissingPrimitiveReferences(data);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe('warning');
      expect(issues[0].checkId).toBe('missing-primitive-reference');

      // Format per messaging.md:
      // "The On-Primary role points to a primitive called 'primary-100', but no primitive with that name exists in this file."
      expect(issues[0].message).toBe(
        "The On-Primary role points to a primitive called 'global.color.primary-100', but no primitive with that name exists in this file."
      );
    });

    it('passes when every role reference resolves to a defined primitive', () => {
      const data = parseJson({
        global: {
          color: {
            'primary-100': { $type: 'color', $value: '#FFFFFF' },
          },
        },
        theme: {
          'On-Primary': {
            $type: 'color',
            $value: '{global.color.primary-100}',
          },
        },
      });

      const issues = checkMissingPrimitiveReferences(data);
      expect(issues).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Check 4: Unreferenced primitive (Info)
  // ---------------------------------------------------------------------------
  describe('Check 4: Unreferenced primitive (Info)', () => {
    it('reports Info when a primitive is defined but never referenced by any role', () => {
      const data = parseJson({
        global: {
          color: {
            'neutral-85': { $type: 'color', $value: '#D8D8D8' },
            'neutral-100': { $type: 'color', $value: '#FFFFFF' },
          },
        },
        theme: {
          'On-Primary': {
            $type: 'color',
            $value: '{global.color.neutral-100}',
          },
        },
      });

      const issues = checkUnreferencedPrimitives(data);
      expect(issues.length).toBe(1);
      expect(issues[0].severity).toBe('info');
      expect(issues[0].checkId).toBe('unreferenced-primitives');

      // Format per messaging.md:
      // "The primitive 'neutral-85' is defined in this file but isn't used by any role. This isn't a problem, just worth knowing."
      expect(issues[0].message).toBe(
        "The primitive 'neutral-85' is defined in this file but isn't used by any role. This isn't a problem, just worth knowing."
      );
    });

    it('passes with 0 Info issues when every primitive is referenced by at least one role', () => {
      const data = parseJson({
        global: {
          color: {
            'neutral-100': { $type: 'color', $value: '#FFFFFF' },
          },
        },
        theme: {
          'On-Primary': {
            $type: 'color',
            $value: '{global.color.neutral-100}',
          },
        },
      });

      const issues = checkUnreferencedPrimitives(data);
      expect(issues).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Full Validation Coordinator
  // ---------------------------------------------------------------------------
  describe('validateTokens Coordinator', () => {
    it('groups all issues correctly into errors, warnings, and info tiers', () => {
      const data = parseJson({
        global: {
          color: {
            unreferenced: { $type: 'color', $value: '#123456' },
            used: { $type: 'color', $value: '#000000' },
          },
        },
        theme: {
          Primary: { $type: 'color', $value: '{global.color.used}' },
          'On-Primary': { $type: 'color', $value: '{global.color.missing}' },
        },
      });

      const report = validateTokens(data);

      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(Array.isArray(report.info)).toBe(true);

      expect(report.errors.every((e) => e.severity === 'error')).toBe(true);
      expect(report.warnings.every((w) => w.severity === 'warning')).toBe(true);
      expect(report.info.every((i) => i.severity === 'info')).toBe(true);

      // Total issues equals sum of 3 tiers
      expect(report.totalIssues).toBe(
        report.errors.length + report.warnings.length + report.info.length
      );
    });

    it('runs cleanly against project design-tokens-tokenlint.json without crash', () => {
      const rootTokensPath = path.resolve(__dirname, '../../design-tokens-tokenlint.json');
      const content = fs.readFileSync(rootTokensPath, 'utf8');
      const parseRes = parseTokensFile(content);

      expect(parseRes.success).toBe(true);
      if (parseRes.success) {
        const report = validateTokens(parseRes.data);
        expect(report).toBeDefined();
        expect(report.totalIssues).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
