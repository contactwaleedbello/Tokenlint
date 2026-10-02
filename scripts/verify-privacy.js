/**
 * Phase 5 — Privacy Verification Script
 *
 * Instruments the full validation workflow to observe and detect:
 * 1. Any network calls (fetch, XMLHttpRequest, WebSocket, sendBeacon)
 * 2. Any persistent storage writes (localStorage, sessionStorage, IndexedDB, document.cookie)
 *
 * Implements the prove-it-first verification protocol:
 * - Plant deliberate violations and confirm the instrumentation catches them.
 * - Run on the real, unmodified codebase and verify zero network or storage activity.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

// ---------------------------------------------------------------------------
// 1. Instrumentation Harness
// ---------------------------------------------------------------------------

function setupPrivacyInstrumentation() {
  const networkEvents = [];
  const storageEvents = [];

  // --- Network Interceptions ---
  const origFetch = global.fetch;
  global.fetch = function (resource, init) {
    networkEvents.push({
      type: 'fetch',
      url: typeof resource === 'string' ? resource : resource?.url || String(resource),
      method: init?.method || 'GET',
    });
    return Promise.resolve({ ok: true, json: async () => ({}) });
  };

  const origSendBeacon = global.navigator?.sendBeacon;
  if (!global.navigator) global.navigator = {};
  global.navigator.sendBeacon = function (url, data) {
    networkEvents.push({
      type: 'sendBeacon',
      url: String(url),
      data,
    });
    return true;
  };

  class InstrumentedXHR {
    open(method, url) {
      this._method = method;
      this._url = url;
    }
    send(body) {
      networkEvents.push({
        type: 'XMLHttpRequest',
        url: this._url,
        method: this._method,
        body,
      });
    }
  }
  const origXHR = global.XMLHttpRequest;
  global.XMLHttpRequest = InstrumentedXHR;

  class InstrumentedWebSocket {
    constructor(url) {
      networkEvents.push({
        type: 'WebSocket',
        url: String(url),
      });
    }
  }
  const origWS = global.WebSocket;
  global.WebSocket = InstrumentedWebSocket;

  // --- Storage Interceptions ---
  const origLocalStorage = global.localStorage;
  global.localStorage = {
    setItem: (key, value) => {
      storageEvents.push({ storage: 'localStorage', key, value });
    },
    getItem: () => null,
    removeItem: () => {},
    clear: () => {},
  };

  const origSessionStorage = global.sessionStorage;
  global.sessionStorage = {
    setItem: (key, value) => {
      storageEvents.push({ storage: 'sessionStorage', key, value });
    },
    getItem: () => null,
    removeItem: () => {},
    clear: () => {},
  };

  let cookieStore = '';
  if (!global.document) global.document = {};
  Object.defineProperty(global.document, 'cookie', {
    configurable: true,
    get: () => cookieStore,
    set: (val) => {
      storageEvents.push({ storage: 'cookie', value: val });
      cookieStore = val;
    },
  });

  const origIndexedDB = global.indexedDB;
  global.indexedDB = {
    open: (name, version) => {
      storageEvents.push({ storage: 'indexedDB', name, version });
      return {};
    },
  };

  return {
    networkEvents,
    storageEvents,
    teardown: () => {
      global.fetch = origFetch;
      if (origSendBeacon) global.navigator.sendBeacon = origSendBeacon;
      global.XMLHttpRequest = origXHR;
      global.WebSocket = origWS;
      global.localStorage = origLocalStorage;
      global.sessionStorage = origSessionStorage;
      global.indexedDB = origIndexedDB;
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Full Validation Pass Execution
// ---------------------------------------------------------------------------

function runValidationPass(tokensContent, injectedHook) {
  // Load validation engine
  // Use compiled or TS runtime / dynamic require
  const { parseTokensFile } = require('../lib/validation/parser');
  const { validateTokens } = require('../lib/validation/rules');

  if (injectedHook) {
    injectedHook();
  }

  const parseResult = parseTokensFile(tokensContent);
  if (!parseResult.success) {
    throw new Error('Parse failed: ' + parseResult.error);
  }

  const report = validateTokens(parseResult.data);
  return { parseResult, report };
}

// ---------------------------------------------------------------------------
// 3. Main Verification Suite
// ---------------------------------------------------------------------------

function main() {
  const tokensPath = path.resolve(__dirname, '../design-tokens-tokenlint.json');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  console.log('=== Step 1 & 2: Network Detection Proof (Planted Violation) ===');
  const monitor1 = setupPrivacyInstrumentation();

  // Plant harmless network call during validation pass
  runValidationPass(tokensContent, () => {
    fetch('https://telemetry.example.com/token-audit', {
      method: 'POST',
      body: JSON.stringify({ tokenCount: 368 }),
    });
  });

  const plantedNetworkCaught = monitor1.networkEvents.length > 0;
  console.log('Planted network call detected:', plantedNetworkCaught);
  console.log('Details:', monitor1.networkEvents);
  monitor1.teardown();

  if (!plantedNetworkCaught) {
    console.error('FATAL: Network instrumentation failed to catch planted violation!');
    process.exit(1);
  }

  console.log('\n=== Step 3: Network Detection on Real Unmodified Code ===');
  const monitor2 = setupPrivacyInstrumentation();

  // Run real validation pass with zero injection
  runValidationPass(tokensContent);

  const realNetworkCallCount = monitor2.networkEvents.length;
  console.log('Network calls detected on real code:', realNetworkCallCount);
  monitor2.teardown();

  console.log('\n=== Step 4A: Storage Detection Proof (Planted Violation) ===');
  const monitor3 = setupPrivacyInstrumentation();

  // Plant harmless storage write during validation pass
  runValidationPass(tokensContent, () => {
    localStorage.setItem('tokenlint_cached_session', 'dummy_hash');
  });

  const plantedStorageCaught = monitor3.storageEvents.length > 0;
  console.log('Planted storage write detected:', plantedStorageCaught);
  console.log('Details:', monitor3.storageEvents);
  monitor3.teardown();

  if (!plantedStorageCaught) {
    console.error('FATAL: Storage instrumentation failed to catch planted violation!');
    process.exit(1);
  }

  console.log('\n=== Step 4B: Storage Detection on Real Unmodified Code ===');
  const monitor4 = setupPrivacyInstrumentation();

  // Run real validation pass with zero injection
  runValidationPass(tokensContent);

  const realStorageWriteCount = monitor4.storageEvents.length;
  console.log('Storage writes detected on real code:', realStorageWriteCount);
  monitor4.teardown();

  console.log('\n=== Step 5: Error-Reporting & Crash-Reporting Audit ===');
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
  );
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const knownErrorReportingPackages = [
    '@sentry/nextjs',
    '@sentry/browser',
    '@sentry/node',
    'logrocket',
    'bugsnag',
    '@datadog/browser-rum',
    'rollbar',
    'mixpanel',
  ];

  const foundReporting = knownErrorReportingPackages.filter((pkg) => pkg in allDeps);
  console.log('Error/crash reporting dependencies found:', foundReporting);

  return {
    plantedNetworkCaught,
    realNetworkClean: realNetworkCallCount === 0,
    plantedStorageCaught,
    realStorageClean: realStorageWriteCount === 0,
    errorReportingExists: foundReporting.length > 0,
  };
}

if (require.main === module) {
  main();
}

module.exports = {
  setupPrivacyInstrumentation,
  runValidationPass,
};
