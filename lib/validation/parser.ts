/**
 * Tokenlint File Parser & Schema Validator
 *
 * Implements States 1-3 from AGENTS.md:
 * - State 2: Invalid JSON detection with plain-language error.
 * - State 3: W3C Design Tokens schema mismatch detection with distinct error.
 * - Valid State: Structured output extracting defined primitives and roles for Phase 3 checks.
 */

export interface TokenNode {
  path: string;
  name: string;
  value: any;
  type?: string;
  description?: string;
  extensions?: Record<string, any>;
  rawToken: Record<string, any>;
}

export interface DefinedPrimitive extends TokenNode {
  isPrimitive: true;
}

export interface DefinedRole extends TokenNode {
  isRole: true;
  references: string[];
}

export interface ParsedTokensData {
  raw: Record<string, any>;
  allTokens: Map<string, TokenNode>;
  primitives: Map<string, DefinedPrimitive>;
  roles: Map<string, DefinedRole>;
  primitivesList: DefinedPrimitive[];
  rolesList: DefinedRole[];
}

export type ParseResult =
  | {
      success: true;
      state: 'valid';
      data: ParsedTokensData;
    }
  | {
      success: false;
      state: 'invalid-json';
      error: string;
    }
  | {
      success: false;
      state: 'schema-mismatch';
      error: string;
    };

export const ERROR_MESSAGES = {
  INVALID_JSON:
    "This file could not be read because it is not valid JSON. Please check the file formatting and syntax, and try again.",
  SCHEMA_MISMATCH:
    "This file does not match the W3C Design Tokens format. Valid tokens files must define token objects containing a '$value' field or composite groups with a '$type' property.",
} as const;

/**
 * Extracts alias references from a token value.
 * W3C references look like "{global.color.primary.40}".
 */
export function extractReferences(val: any): string[] {
  const refs: string[] = [];

  if (typeof val === 'string') {
    const trimmed = val.trim();
    const match = trimmed.match(/^\{([^}]+)\}$/);
    if (match) {
      refs.push(match[1]);
    }
  } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    for (const v of Object.values(val)) {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        const match = trimmed.match(/^\{([^}]+)\}$/);
        if (match) {
          refs.push(match[1]);
        }
      }
    }
  }

  return refs;
}

/**
 * Recursively walks a parsed JSON object and collects all token nodes (objects containing $value).
 */
export function walkTokenLeaves(
  obj: Record<string, any>,
  currentPath: string[] = []
): TokenNode[] {
  const leaves: TokenNode[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('$value' in val) {
        const fullPath = [...currentPath, key].join('.');
        leaves.push({
          path: fullPath,
          name: key,
          value: val.$value,
          type: val.$type,
          description: val.$description,
          extensions: val.$extensions,
          rawToken: val,
        });
      } else {
        leaves.push(...walkTokenLeaves(val, [...currentPath, key]));
      }
    }
  }

  return leaves;
}

/**
 * Checks whether an object contains any valid W3C Design Tokens structure.
 * According to W3C Design Tokens Community Group specification, tokens are objects
 * containing a '$value' property, and groups can declare a '$type' property.
 */
export function hasW3CDTSStructure(jsonObj: any): boolean {
  if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
    return false;
  }

  // Check recursively for at least one token with $value or composite token with $type
  let found = false;

  function inspect(node: any): void {
    if (found || !node || typeof node !== 'object') return;

    if (!Array.isArray(node) && '$value' in node) {
      found = true;
      return;
    }

    if (!Array.isArray(node) && '$type' in node && Object.keys(node).length > 1) {
      // Could be a group or composite token with $type
      for (const [k, v] of Object.entries(node)) {
        if (!k.startsWith('$') && v && typeof v === 'object') {
          if ('$value' in (v as any)) {
            found = true;
            return;
          }
        }
      }
    }

    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (v && typeof v === 'object') {
        inspect(v);
        if (found) return;
      }
    }
  }

  inspect(jsonObj);
  return found;
}

/**
 * Parses and validates raw file content.
 */
export function parseTokensFile(content: string): ParseResult {
  // State 2: Invalid JSON Check
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      success: false,
      state: 'invalid-json',
      error: ERROR_MESSAGES.INVALID_JSON,
    };
  }

  // State 3: Schema Mismatch Check
  if (!hasW3CDTSStructure(parsed)) {
    return {
      success: false,
      state: 'schema-mismatch',
      error: ERROR_MESSAGES.SCHEMA_MISMATCH,
    };
  }

  // Successful parse: extract all leaf tokens
  const leaves = walkTokenLeaves(parsed);

  const allTokens = new Map<string, TokenNode>();
  const primitives = new Map<string, DefinedPrimitive>();
  const roles = new Map<string, DefinedRole>();
  const primitivesList: DefinedPrimitive[] = [];
  const rolesList: DefinedRole[] = [];

  for (const node of leaves) {
    allTokens.set(node.path, node);
    const refs = extractReferences(node.value);

    // Classification:
    // A Role is a named value that references a primitive (or another token).
    // A Primitive is a raw, unmapped value.
    // In GTC systems: 'global.*' are raw primitives, 'theme.*' and 'component.*' are roles.
    const isExplicitGlobal = node.path.startsWith('global.') || node.path.startsWith('foundations.');
    const isExplicitThemeOrComponent = node.path.startsWith('theme.') || node.path.startsWith('component.');

    if (isExplicitGlobal) {
      const primitive: DefinedPrimitive = { ...node, isPrimitive: true };
      primitives.set(node.path, primitive);
      primitivesList.push(primitive);
    } else if (isExplicitThemeOrComponent || refs.length > 0) {
      const role: DefinedRole = { ...node, isRole: true, references: refs };
      roles.set(node.path, role);
      rolesList.push(role);
    } else {
      // Default: tokens without references are raw primitives
      const primitive: DefinedPrimitive = { ...node, isPrimitive: true };
      primitives.set(node.path, primitive);
      primitivesList.push(primitive);
    }
  }

  return {
    success: true,
    state: 'valid',
    data: {
      raw: parsed,
      allTokens,
      primitives,
      roles,
      primitivesList,
      rolesList,
    },
  };
}
