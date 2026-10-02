/**
 * Tokenlint Validation Rules
 *
 * Implements the four validation checks defined in AGENTS.md and PRD:
 * 1. Required-role presence (Error)
 * 2. On-X/X contrast (Error)
 * 3. Role referencing a missing primitive (Warning)
 * 4. Unreferenced primitive (Info)
 *
 * Constraints:
 * - Severities are locked: Error, Warning, Info.
 * - Required-role list is locked to the 20 M3-based roles in AGENTS.md Section 9.
 * - Contrast threshold is locked at 4.5:1 (WCAG AA, normal text).
 * - Messages strictly follow the wording patterns in messaging.md.
 */

import { ParsedTokensData, TokenNode, DefinedRole, DefinedPrimitive } from './parser';
import { getContrastRatio, formatContrastRatio } from './contrast';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  checkId: 'required-roles' | 'contrast-pairs' | 'missing-primitive-reference' | 'unreferenced-primitives';
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationReport {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  totalIssues: number;
}

/**
 * Locked list of 20 required roles per AGENTS.md Section 9.
 */
export const REQUIRED_ROLES = [
  'Primary',
  'On-Primary',
  'Primary Container',
  'On-Primary Container',
  'Secondary',
  'On-Secondary',
  'Secondary Container',
  'On-Secondary Container',
  'Tertiary',
  'On-Tertiary',
  'Tertiary Container',
  'On-Tertiary Container',
  'Error',
  'On-Error',
  'Error Container',
  'On-Error Container',
  'Surface',
  'On-Surface',
  'Outline',
  'Background',
] as const;

export type RequiredRoleName = (typeof REQUIRED_ROLES)[number];

/**
 * Locked On-X/X paired roles to check for WCAG contrast.
 */
export const CONTRAST_PAIRS: [RequiredRoleName, RequiredRoleName][] = [
  ['Primary', 'On-Primary'],
  ['Primary Container', 'On-Primary Container'],
  ['Secondary', 'On-Secondary'],
  ['Secondary Container', 'On-Secondary Container'],
  ['Tertiary', 'On-Tertiary'],
  ['Tertiary Container', 'On-Tertiary Container'],
  ['Error', 'On-Error'],
  ['Error Container', 'On-Error Container'],
  ['Surface', 'On-Surface'],
];

export const CONTRAST_THRESHOLD = 4.5;

/**
 * Normalizes a role path or name into a canonical search string.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Role matching helper: identifies whether a token corresponds to a canonical required role.
 */
export function findMatchingRole(
  requiredRole: RequiredRoleName,
  rolesList: DefinedRole[]
): DefinedRole | undefined {
  const targetNorm = normalizeKey(requiredRole);

  // Exact path or normalized suffix matches
  for (const role of rolesList) {
    const pathNorm = normalizeKey(role.path);
    const nameNorm = normalizeKey(role.name);

    // Direct match: e.g. "Primary" -> "primary", "color.primary", "theme.color.primary.color"
    if (nameNorm === targetNorm || pathNorm === targetNorm) {
      return role;
    }

    // Common GTC naming patterns
    switch (requiredRole) {
      case 'Primary':
        if (role.path === 'theme.color.primary.color' || pathNorm.endsWith('colorprimarycolor')) return role;
        break;
      case 'On-Primary':
        if (role.path === 'theme.color.primary.on-color' || pathNorm.endsWith('colorprimaryoncolor')) return role;
        break;
      case 'Primary Container':
        if (role.path === 'theme.color.primary.container' || pathNorm.endsWith('colorprimarycontainer')) return role;
        break;
      case 'On-Primary Container':
        if (role.path === 'theme.color.primary.on-container' || pathNorm.endsWith('colorprimaryoncontainer')) return role;
        break;

      case 'Secondary':
        if (role.path === 'theme.color.secondary.color' || pathNorm.endsWith('colorsecondarycolor')) return role;
        break;
      case 'On-Secondary':
        if (role.path === 'theme.color.secondary.on-color' || pathNorm.endsWith('colorsecondaryoncolor')) return role;
        break;
      case 'Secondary Container':
        if (role.path === 'theme.color.secondary.container' || pathNorm.endsWith('colorsecondarycontainer')) return role;
        break;
      case 'On-Secondary Container':
        if (role.path === 'theme.color.secondary.on-container' || pathNorm.endsWith('colorsecondaryoncontainer')) return role;
        break;

      case 'Tertiary':
        if (role.path === 'theme.color.tertiary.color' || pathNorm.endsWith('colortertiarycolor')) return role;
        break;
      case 'On-Tertiary':
        if (role.path === 'theme.color.tertiary.on-color' || pathNorm.endsWith('colortertiaryoncolor')) return role;
        break;
      case 'Tertiary Container':
        if (role.path === 'theme.color.tertiary.container' || pathNorm.endsWith('colortertiarycontainer')) return role;
        break;
      case 'On-Tertiary Container':
        if (role.path === 'theme.color.tertiary.on-container' || pathNorm.endsWith('colortertiaryoncontainer')) return role;
        break;

      case 'Error':
        if (role.path === 'theme.color.error.color' || pathNorm.endsWith('colorerrorcolor')) return role;
        break;
      case 'On-Error':
        if (role.path === 'theme.color.error.on-color' || pathNorm.endsWith('colorerroroncolor')) return role;
        break;
      case 'Error Container':
        if (role.path === 'theme.color.error.container' || pathNorm.endsWith('colorerrorcontainer')) return role;
        break;
      case 'On-Error Container':
        if (role.path === 'theme.color.error.on-container' || pathNorm.endsWith('colorerroroncontainer')) return role;
        break;

      case 'Surface':
        if (role.path === 'theme.surface.page' || role.path === 'theme.surface' || pathNorm.endsWith('surfacepage')) return role;
        break;
      case 'On-Surface':
        if (role.path === 'theme.text.default' || role.path === 'theme.text.on-surface' || pathNorm.endsWith('onsurface')) return role;
        break;
      case 'Outline':
        if (role.path === 'theme.outline.default' || role.path === 'theme.outline' || pathNorm.endsWith('outlinedefault')) return role;
        break;
      case 'Background':
        if (role.path === 'theme.background' || pathNorm.endsWith('background')) return role;
        break;
    }
  }

  return undefined;
}

/**
 * Resolves a token to an sRGB hex string (#RRGGBB).
 */
export function resolveTokenHex(token: TokenNode, allTokens: Map<string, TokenNode>): string | null {
  let val = token.value;
  if (typeof val === 'object' && val !== null && val.light) {
    val = val.light;
  }

  const visited = new Set<string>();

  while (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    const targetPath = val.slice(1, -1);
    if (visited.has(targetPath)) break;
    visited.add(targetPath);

    const targetToken = allTokens.get(targetPath);
    if (!targetToken) break;

    if (targetToken.extensions && targetToken.extensions.fallback) {
      return targetToken.extensions.fallback;
    }

    if (typeof targetToken.value === 'string' && /^#[0-9a-f]{6}$/i.test(targetToken.value)) {
      return targetToken.value;
    }

    val = targetToken.value;
    if (typeof val === 'object' && val !== null && val.light) {
      val = val.light;
    }
  }

  if (typeof val === 'string' && /^#[0-9a-f]{6}$/i.test(val)) {
    return val;
  }

  if (token.extensions && token.extensions.fallback) {
    return token.extensions.fallback;
  }

  return null;
}

/**
 * ---------------------------------------------------------------------------
 * Check 1: Required-role presence (Error)
 * ---------------------------------------------------------------------------
 */
export function checkRequiredRoles(data: ParsedTokensData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const roleName of REQUIRED_ROLES) {
    const matched = findMatchingRole(roleName, data.rolesList);
    if (!matched) {
      issues.push({
        checkId: 'required-roles',
        severity: 'error',
        message: `The ${roleName} role is missing from this file. Components that rely on it won't have a defined color.`,
        details: { role: roleName },
      });
    }
  }

  return issues;
}

/**
 * ---------------------------------------------------------------------------
 * Check 2: On-X/X contrast (Error)
 * ---------------------------------------------------------------------------
 */
export function checkContrastPairs(data: ParsedTokensData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [role1Name, role2Name] of CONTRAST_PAIRS) {
    const role1 = findMatchingRole(role1Name, data.rolesList);
    const role2 = findMatchingRole(role2Name, data.rolesList);

    if (!role1 || !role2) {
      // If either role is missing, Check 1 reports the missing role error.
      continue;
    }

    const hex1 = resolveTokenHex(role1, data.allTokens);
    const hex2 = resolveTokenHex(role2, data.allTokens);

    if (!hex1 || !hex2) {
      continue;
    }

    const ratio = getContrastRatio(hex1, hex2);

    if (ratio < CONTRAST_THRESHOLD) {
      const formatted = formatContrastRatio(ratio);
      issues.push({
        checkId: 'contrast-pairs',
        severity: 'error',
        // Exact format per PRD & messaging.md:
        // "Primary (#2B5F8A) vs On-Primary (#FFFFFF): 3.2:1, fails AA, needs 4.5:1."
        message: `${role1Name} (${hex1}) vs ${role2Name} (${hex2}): ${formatted}, fails AA, needs 4.5:1.`,
        details: {
          role1: role1Name,
          hex1,
          role2: role2Name,
          hex2,
          ratio,
          threshold: CONTRAST_THRESHOLD,
        },
      });
    }
  }

  return issues;
}

/**
 * ---------------------------------------------------------------------------
 * Check 3: Role referencing a missing primitive (Warning)
 * ---------------------------------------------------------------------------
 */
export function checkMissingPrimitiveReferences(data: ParsedTokensData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const role of data.rolesList) {
    for (const ref of role.references) {
      const exists = data.allTokens.has(ref) || data.primitives.has(ref);
      if (!exists) {
        issues.push({
          checkId: 'missing-primitive-reference',
          severity: 'warning',
          // Format per messaging.md:
          // "The On-Primary role points to a primitive called 'primary-100', but no primitive with that name exists in this file."
          message: `The ${role.name || role.path} role points to a primitive called '${ref}', but no primitive with that name exists in this file.`,
          details: {
            role: role.path,
            referencedPrimitive: ref,
          },
        });
      }
    }
  }

  return issues;
}

/**
 * ---------------------------------------------------------------------------
 * Check 4: Unreferenced primitive (Info)
 * ---------------------------------------------------------------------------
 */
export function checkUnreferencedPrimitives(data: ParsedTokensData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Collect all references transitively reachable from all roles
  const referencedPaths = new Set<string>();

  function collectRefs(refPath: string) {
    if (referencedPaths.has(refPath)) return;
    referencedPaths.add(refPath);

    const token = data.allTokens.get(refPath);
    if (token) {
      const childRefs = 'references' in token ? (token as DefinedRole).references : [];
      for (const child of childRefs) {
        collectRefs(child);
      }
    }
  }

  for (const role of data.rolesList) {
    for (const ref of role.references) {
      collectRefs(ref);
    }
  }

  // Check which primitives are never referenced
  for (const primitive of data.primitivesList) {
    if (!referencedPaths.has(primitive.path)) {
      issues.push({
        checkId: 'unreferenced-primitives',
        severity: 'info',
        // Format per messaging.md:
        // "The primitive 'neutral-85' is defined in this file but isn't used by any role. This isn't a problem, just worth knowing."
        message: `The primitive '${primitive.name || primitive.path}' is defined in this file but isn't used by any role. This isn't a problem, just worth knowing.`,
        details: {
          primitive: primitive.path,
        },
      });
    }
  }

  return issues;
}

/**
 * ---------------------------------------------------------------------------
 * Combined Validation Coordinator
 * ---------------------------------------------------------------------------
 */
export function validateTokens(data: ParsedTokensData): ValidationReport {
  const errors: ValidationIssue[] = [
    ...checkRequiredRoles(data),
    ...checkContrastPairs(data),
  ];

  const warnings: ValidationIssue[] = [
    ...checkMissingPrimitiveReferences(data),
  ];

  const info: ValidationIssue[] = [
    ...checkUnreferencedPrimitives(data),
  ];

  return {
    errors,
    warnings,
    info,
    totalIssues: errors.length + warnings.length + info.length,
  };
}
