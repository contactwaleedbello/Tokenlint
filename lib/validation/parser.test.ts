import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseTokensFile, ERROR_MESSAGES } from './parser';

describe('Phase 2 — File Intake and Error States', () => {
  const fixturesDir = path.join(__dirname, '__fixtures__');

  it('State 2: detects invalid JSON and produces its distinct plain-language message', () => {
    const invalidJsonPath = path.join(fixturesDir, 'invalid-json.json');
    const content = fs.readFileSync(invalidJsonPath, 'utf8');

    const result = parseTokensFile(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state).toBe('invalid-json');
      expect(result.error).toBe(ERROR_MESSAGES.INVALID_JSON);
      expect(result.error).toContain('not valid JSON');
    }
  });

  it('State 3: detects W3C Design Tokens schema mismatch and produces its distinct message', () => {
    const mismatchJsonPath = path.join(fixturesDir, 'schema-mismatch.json');
    const content = fs.readFileSync(mismatchJsonPath, 'utf8');

    const result = parseTokensFile(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state).toBe('schema-mismatch');
      expect(result.error).toBe(ERROR_MESSAGES.SCHEMA_MISMATCH);
      expect(result.error).toContain('W3C Design Tokens format');
      expect(result.error).toContain('$value');
    }
  });

  it('confirms State 2 and State 3 error messages are completely distinct', () => {
    expect(ERROR_MESSAGES.INVALID_JSON).not.toBe(ERROR_MESSAGES.SCHEMA_MISMATCH);
    expect(ERROR_MESSAGES.INVALID_JSON.length).toBeGreaterThan(0);
    expect(ERROR_MESSAGES.SCHEMA_MISMATCH.length).toBeGreaterThan(0);
  });

  it('State 4: produces structured output of primitives and roles on a valid tokens file', () => {
    const validJsonPath = path.join(fixturesDir, 'valid-tokens.json');
    const content = fs.readFileSync(validJsonPath, 'utf8');

    const result = parseTokensFile(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state).toBe('valid');
      expect(result.data.primitivesList.length).toBe(1);
      expect(result.data.rolesList.length).toBe(1);

      const prim = result.data.primitives.get('color.primitive-teal');
      expect(prim).toBeDefined();
      expect(prim?.value).toBe('#005459');
      expect(prim?.isPrimitive).toBe(true);

      const role = result.data.roles.get('color.primary');
      expect(role).toBeDefined();
      expect(role?.references).toEqual(['color.primitive-teal']);
      expect(role?.isRole).toBe(true);
    }
  });

  it('correctly parses full project design-tokens-tokenlint.json into structured primitives and roles', () => {
    const rootTokensPath = path.resolve(__dirname, '../../design-tokens-tokenlint.json');
    const content = fs.readFileSync(rootTokensPath, 'utf8');

    const result = parseTokensFile(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allTokens.size).toBe(368);
      expect(result.data.primitivesList.length).toBe(207);
      expect(result.data.rolesList.length).toBe(161);
      expect(result.data.primitives.has('global.color.primary.40')).toBe(true);
      expect(result.data.roles.has('theme.color.primary.color')).toBe(true);
    }
  });
});
