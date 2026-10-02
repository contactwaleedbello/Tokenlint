import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseTokensFile } from './parser';
import { validateTokens } from './rules';

describe('Phase 5 — Privacy Verification', () => {
  const tokensPath = path.resolve(__dirname, '../../design-tokens-tokenlint.json');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  it('proves network instrumentation catches a planted fetch call, then stays clean on real code', async () => {
    const intercepted: any[] = [];
    const origFetch = globalThis.fetch;

    globalThis.fetch = ((input: any, init: any) => {
      intercepted.push({ input, init });
      return Promise.resolve(new Response(JSON.stringify({})));
    }) as any;

    try {
      // 1. Planted violation pass
      intercepted.length = 0;
      const parse1 = parseTokensFile(tokensContent);
      expect(parse1.success).toBe(true);
      if (parse1.success) {
        validateTokens(parse1.data);
      }
      // Plant call
      await fetch('https://telemetry.example.com/api', { method: 'POST' });
      expect(intercepted).toHaveLength(1);
      expect(intercepted[0].input).toBe('https://telemetry.example.com/api');

      // 2. Real unmodified code pass (zero injection)
      intercepted.length = 0;
      const parse2 = parseTokensFile(tokensContent);
      expect(parse2.success).toBe(true);
      if (parse2.success) {
        validateTokens(parse2.data);
      }
      // Zero network activity
      expect(intercepted).toHaveLength(0);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('proves storage instrumentation catches a planted localStorage write, then stays clean on real code', () => {
    const storageWrites: any[] = [];
    const mockStorage = {
      setItem: (key: string, val: any) => storageWrites.push({ key, val }),
      getItem: () => null,
      removeItem: () => {},
      clear: () => {},
    };

    const origLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = mockStorage;

    try {
      // 1. Planted violation pass
      storageWrites.length = 0;
      const parse1 = parseTokensFile(tokensContent);
      expect(parse1.success).toBe(true);
      if (parse1.success) {
        validateTokens(parse1.data);
      }
      // Plant write
      (globalThis as any).localStorage.setItem('planted_key', 'dummy_value');
      expect(storageWrites).toHaveLength(1);
      expect(storageWrites[0].key).toBe('planted_key');

      // 2. Real unmodified code pass (zero injection)
      storageWrites.length = 0;
      const parse2 = parseTokensFile(tokensContent);
      expect(parse2.success).toBe(true);
      if (parse2.success) {
        validateTokens(parse2.data);
      }
      // Zero storage writes
      expect(storageWrites).toHaveLength(0);
    } finally {
      (globalThis as any).localStorage = origLocalStorage;
    }
  });

  it('confirms zero crash-reporting or error-tracking tools exist in project dependencies', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const trackingTools = [
      '@sentry/nextjs',
      '@sentry/browser',
      '@sentry/node',
      'logrocket',
      'bugsnag',
      '@datadog/browser-rum',
      'rollbar',
      'mixpanel',
      'firebase',
    ];

    const found = trackingTools.filter((t) => t in allDeps);
    expect(found).toHaveLength(0);
  });
});
