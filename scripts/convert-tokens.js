#!/usr/bin/env node

/**
 * Design Tokens to CSS Custom Properties Converter
 *
 * Converts a GTC (Global, Theme, Component) design token system from
 * design-tokens-tokenlint.json into a production-ready tokens.css stylesheet.
 *
 * Rules & Features:
 * 1. Resolves all alias reference chains (single-level and multi-level).
 * 2. Preserves GTC naming hierarchy in kebab-case CSS custom properties.
 * 3. Dual color output: sRGB hex fallback first, modern OKLCH inside @supports.
 * 4. Dual theme states: light mode under :root, dark mode under .dark.
 * 5. Mode-independent non-color tokens output once under :root.
 * 6. Clean annotations distinguishing raw primitives from UI roles.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. File Discovery & Loading
// ---------------------------------------------------------------------------

function findTokensFile() {
  // Allow passing path as CLI argument
  if (process.argv[2] && fs.existsSync(process.argv[2])) {
    return path.resolve(process.argv[2]);
  }

  const searchLocations = [
    path.join(process.cwd(), 'design-tokens-tokenlint.json'),
    path.join(process.cwd(), 'Context file', 'design-tokens-tokenlint.json'),
    path.join(__dirname, '..', 'design-tokens-tokenlint.json'),
    path.join(__dirname, '..', 'Context file', 'design-tokens-tokenlint.json'),
  ];

  for (const loc of searchLocations) {
    if (fs.existsSync(loc)) {
      return path.resolve(loc);
    }
  }

  // Recursive fallback search in cwd
  function searchDir(dir, depth = 0) {
    if (depth > 3) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === 'design-tokens-tokenlint.json') {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = searchDir(fullPath, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const found = searchDir(process.cwd());
  if (found) return path.resolve(found);

  throw new Error('Could not locate design-tokens-tokenlint.json in the project.');
}

// ---------------------------------------------------------------------------
// 2. Token Tree Traversal & Alias Resolution
// ---------------------------------------------------------------------------

function getByPath(root, pathStr) {
  const parts = pathStr.split('.');
  let curr = root;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function resolveTerminal(root, refOrVal, mode = 'light', visited = new Set()) {
  let curr = refOrVal;
  let lastToken = null;

  while (typeof curr === 'string' && curr.startsWith('{') && curr.endsWith('}')) {
    const targetPath = curr.slice(1, -1);
    if (visited.has(targetPath)) {
      throw new Error(`Circular token alias reference detected at: ${targetPath}`);
    }
    visited.add(targetPath);

    const targetToken = getByPath(root, targetPath);
    if (!targetToken) {
      throw new Error(`Cannot resolve alias reference: ${targetPath}`);
    }

    lastToken = targetToken;

    if ('$value' in targetToken) {
      const val = targetToken.$value;
      if (val && typeof val === 'object' && !Array.isArray(val) && (val.light || val.dark)) {
        curr = val[mode] || val.light;
      } else {
        curr = val;
      }
    } else {
      curr = targetToken;
    }
  }

  return { value: curr, token: lastToken };
}

function pathToVar(pathStr) {
  const parts = pathStr.split('.').map(part => {
    return part.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  });
  return '--' + parts.join('-');
}

function walkTokens(obj, currentPath = []) {
  const leaves = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object') {
      if ('$value' in val) {
        leaves.push({
          path: [...currentPath, key].join('.'),
          token: val,
        });
      } else {
        leaves.push(...walkTokens(val, [...currentPath, key]));
      }
    }
  }
  return leaves;
}

// ---------------------------------------------------------------------------
// 3. Token Value Formatting
// ---------------------------------------------------------------------------

function formatNonColorValue(root, tokenObj) {
  let val = tokenObj.$value;
  let type = tokenObj.$type;

  // Resolve alias if needed
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    const res = resolveTerminal(root, val, 'light');
    val = res.value;
    if (res.token && res.token.$type) type = res.token.$type;
  }

  if (type === 'cubicBezier' && Array.isArray(val)) {
    return `cubic-bezier(${val.join(', ')})`;
  }

  if (type === 'shadow' && typeof val === 'object' && val !== null) {
    const { offsetX, offsetY, blur, spread, color, opacity } = val;
    // Resolve color reference inside shadow (e.g. {global.color.neutral.0})
    resolveTerminal(root, color, 'light');
    // Shadows reference global.color.neutral.0 (#000000)
    return `${offsetX} ${offsetY} ${blur} ${spread} rgba(0, 0, 0, ${opacity})`;
  }

  if (Array.isArray(val)) {
    return val.join(' ');
  }

  return String(val);
}

function resolveColorValue(root, tokenObj, mode, formatType) {
  let targetRef = tokenObj.$value;
  if (targetRef && typeof targetRef === 'object' && !Array.isArray(targetRef)) {
    targetRef = targetRef[mode] || targetRef.light;
  }

  const res = resolveTerminal(root, targetRef, mode);
  const terminal = res.token || tokenObj;

  if (formatType === 'hex') {
    return terminal.$extensions?.fallback || res.value;
  }
  return res.value;
}

// ---------------------------------------------------------------------------
// 4. CSS Generator
// ---------------------------------------------------------------------------

function generateTokensCss(tokens) {
  const allTokens = walkTokens(tokens);

  // Group tokens by category
  const globalNonColor = [];
  const globalColor = [];
  const themeTokens = [];
  const componentTokens = [];
  const foundationTokens = [];

  for (const item of allTokens) {
    const [grp, cat] = item.path.split('.');
    if (grp === 'global') {
      if (cat === 'color') {
        globalColor.push(item);
      } else {
        globalNonColor.push(item);
      }
    } else if (grp === 'theme') {
      themeTokens.push(item);
    } else if (grp === 'component') {
      componentTokens.push(item);
    } else if (grp === 'foundations') {
      foundationTokens.push(item);
    }
  }

  const lines = [];

  lines.push('/**',
    ' * Tokenlint Design System — CSS Custom Properties',
    ' * ',
    ' * Architecture: GTC (Global, Theme, Component)',
    ' * ',
    ' * CRITICAL DESIGN SYSTEM RULES:',
    ' * 1. Global (--global-*) tokens are raw primitives. NEVER use them directly on UI elements.',
    ' * 2. Theme (--theme-*) tokens are semantic color roles for UI styling (support light & dark).',
    ' * 3. Component (--component-*) tokens are component structural values (spacing, radius, size).',
    ' * 4. Modern browsers use OKLCH; older browsers automatically fall back to sRGB hex.',
    ' * ',
    ' * Auto-generated by scripts/convert-tokens.js. Do not edit directly.',
    ' */',
    ''
  );

  // -------------------------------------------------------------------------
  // :root Selector (Mode-Independent Non-Colors + sRGB Fallback Colors)
  // -------------------------------------------------------------------------
  lines.push(':root {');

  // Sub-categorize Global Non-Color tokens for clean grouping
  const nonColorGroups = {
    'Size Units & Spacing': [],
    'Radius': [],
    'Typography': [],
    'Motion & Easing': [],
    'Shadows / Elevation': [],
    'Opacity': [],
    'Borders': [],
    'Z-Index': [],
    'Breakpoints': [],
  };

  for (const item of globalNonColor) {
    const cat = item.path.split('.')[1];
    if (cat === 'size-unit') nonColorGroups['Size Units & Spacing'].push(item);
    else if (cat === 'radius') nonColorGroups['Radius'].push(item);
    else if (cat === 'typography') nonColorGroups['Typography'].push(item);
    else if (cat === 'motion') nonColorGroups['Motion & Easing'].push(item);
    else if (cat === 'shadow') nonColorGroups['Shadows / Elevation'].push(item);
    else if (cat === 'opacity') nonColorGroups['Opacity'].push(item);
    else if (cat === 'border') nonColorGroups['Borders'].push(item);
    else if (cat === 'z-index') nonColorGroups['Z-Index'].push(item);
    else if (cat === 'breakpoint') nonColorGroups['Breakpoints'].push(item);
  }

  lines.push('  /* ==========================================================================');
  lines.push('     GLOBAL PRIMITIVES — Non-Color (Mode-Independent)');
  lines.push('     Note: Primitives must not be applied directly to UI elements.');
  lines.push('     ========================================================================== */');

  for (const [groupName, items] of Object.entries(nonColorGroups)) {
    if (items.length === 0) continue;
    lines.push('');
    lines.push(`  /* ${groupName} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = formatNonColorValue(tokens, item.token);
      lines.push(`  ${varName}: ${val};`);
    }
  }

  // Component Tokens
  lines.push('');
  lines.push('  /* ==========================================================================');
  lines.push('     COMPONENT TOKENS — Structural (Spacing, Radius, Elevation, Sizing)');
  lines.push('     Directly consumable by component implementations.');
  lines.push('     ========================================================================== */');

  const componentByComp = {};
  for (const item of componentTokens) {
    const compName = item.path.split('.')[1];
    if (!componentByComp[compName]) componentByComp[compName] = [];
    componentByComp[compName].push(item);
  }

  for (const [compName, items] of Object.entries(componentByComp)) {
    lines.push('');
    lines.push(`  /* Component: ${compName} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = formatNonColorValue(tokens, item.token);
      lines.push(`  ${varName}: ${val};`);
    }
  }

  // Foundations Tokens (if present)
  if (foundationTokens.length > 0) {
    lines.push('');
    lines.push('  /* ==========================================================================');
    lines.push('     FOUNDATIONS — Icon Sizing & Dimensions');
    lines.push('     ========================================================================== */');
    for (const item of foundationTokens) {
      const varName = pathToVar(item.path);
      const val = formatNonColorValue(tokens, item.token);
      lines.push(`  ${varName}: ${val};`);
    }
  }

  // Global Color Primitives (Hex Fallback)
  lines.push('');
  lines.push('  /* ==========================================================================');
  lines.push('     GLOBAL PRIMITIVES — Colors (sRGB Hex Fallback)');
  lines.push('     Raw tonal palette. Primitives must not be applied directly to UI elements.');
  lines.push('     ========================================================================== */');

  const globalColorScales = {};
  for (const item of globalColor) {
    const scale = item.path.split('.')[2];
    if (!globalColorScales[scale]) globalColorScales[scale] = [];
    globalColorScales[scale].push(item);
  }

  for (const [scale, items] of Object.entries(globalColorScales)) {
    lines.push('');
    lines.push(`  /* Color Primitive: ${scale} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'light', 'hex');
      lines.push(`  ${varName}: ${val};`);
    }
  }

  // Theme Color Roles - Light Mode (Hex Fallback)
  lines.push('');
  lines.push('  /* ==========================================================================');
  lines.push('     THEME ROLES — Light Mode (sRGB Hex Fallback)');
  lines.push('     Use these semantic roles directly in UI component styling.');
  lines.push('     ========================================================================== */');

  const themeCategories = {};
  for (const item of themeTokens) {
    const cat = item.path.split('.')[1];
    if (!themeCategories[cat]) themeCategories[cat] = [];
    themeCategories[cat].push(item);
  }

  for (const [cat, items] of Object.entries(themeCategories)) {
    lines.push('');
    lines.push(`  /* Theme: ${cat} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'light', 'hex');
      lines.push(`  ${varName}: ${val};`);
    }
  }

  lines.push('}');
  lines.push('');

  // -------------------------------------------------------------------------
  // .dark Selector (Dark Mode - sRGB Hex Fallback)
  // -------------------------------------------------------------------------
  lines.push('/* ==========================================================================');
  lines.push('   THEME ROLES — Dark Mode (sRGB Hex Fallback)');
  lines.push('   ========================================================================== */');
  lines.push('.dark {');

  for (const [cat, items] of Object.entries(themeCategories)) {
    lines.push(`  /* Theme: ${cat} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'dark', 'hex');
      lines.push(`  ${varName}: ${val};`);
    }
  }

  lines.push('}');
  lines.push('');

  // -------------------------------------------------------------------------
  // @supports (color: oklch(0 0 0)) (Modern Browser Enhancement)
  // -------------------------------------------------------------------------
  lines.push('/* ==========================================================================');
  lines.push('   OKLCH COLOR ENHANCEMENT');
  lines.push('   Modern browsers use high-gamut, perceptually uniform OKLCH values.');
  lines.push('   ========================================================================== */');
  lines.push('@supports (color: oklch(0 0 0)) {');

  // OKLCH :root (Global primitives + Theme light roles)
  lines.push('  :root {');
  lines.push('    /* Global Color Primitives (OKLCH) */');
  for (const [scale, items] of Object.entries(globalColorScales)) {
    lines.push(`    /* ${scale} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'light', 'oklch');
      lines.push(`    ${varName}: ${val};`);
    }
  }

  lines.push('');
  lines.push('    /* Theme Roles — Light Mode (OKLCH) */');
  for (const [cat, items] of Object.entries(themeCategories)) {
    lines.push(`    /* Theme: ${cat} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'light', 'oklch');
      lines.push(`    ${varName}: ${val};`);
    }
  }
  lines.push('  }');
  lines.push('');

  // OKLCH .dark (Theme dark roles)
  lines.push('  .dark {');
  lines.push('    /* Theme Roles — Dark Mode (OKLCH) */');
  for (const [cat, items] of Object.entries(themeCategories)) {
    lines.push(`    /* Theme: ${cat} */`);
    for (const item of items) {
      const varName = pathToVar(item.path);
      const val = resolveColorValue(tokens, item.token, 'dark', 'oklch');
      lines.push(`    ${varName}: ${val};`);
    }
  }
  lines.push('  }');

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 5. Execution & File Writing
// ---------------------------------------------------------------------------

function main() {
  try {
    const tokensFilePath = findTokensFile();
    console.log(`[Tokenlint] Loading design tokens from: ${tokensFilePath}`);

    const rawData = fs.readFileSync(tokensFilePath, 'utf8');
    const tokens = JSON.parse(rawData);

    console.log('[Tokenlint] Resolving aliases and generating CSS custom properties...');
    const cssOutput = generateTokensCss(tokens);

    // Target output files
    const rootTokensPath = path.resolve(process.cwd(), 'tokens.css');
    fs.writeFileSync(rootTokensPath, cssOutput, 'utf8');
    console.log(`[Tokenlint] Successfully generated: ${rootTokensPath}`);

    // If styles directory exists or is configured in structure.md, also write styles/tokens.css
    const stylesDir = path.resolve(process.cwd(), 'styles');
    if (fs.existsSync(stylesDir)) {
      const stylesTokensPath = path.join(stylesDir, 'tokens.css');
      fs.writeFileSync(stylesTokensPath, cssOutput, 'utf8');
      console.log(`[Tokenlint] Also mirrored to: ${stylesTokensPath}`);
    }

    console.log('[Tokenlint] Done! CSS custom properties are ready for use.');
  } catch (err) {
    console.error(`[Tokenlint Error] ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findTokensFile,
  generateTokensCss,
  pathToVar,
  resolveTerminal,
  resolveColorValue,
  formatNonColorValue,
};
