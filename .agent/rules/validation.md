---
trigger: glob
globs: lib/validation/**
---

<!-- rules/validation.md -->
# validation.md

Controls the fixed facts the checking logic must respect. This file does not explain how to add a new check or change the required-role list, that procedure belongs to the `add-validation-check` and `update-required-role-list` skills. This file only states what must stay true no matter which of those skills gets used.

## A clean result is a valid outcome
Zero findings across all four checks is a real, expected result, not a sign something went wrong with the tool. Reason: without this stated plainly, an agent could assume the tool must always surface something, and either invent a finding or treat an empty result as a bug.

## Severity tiers are fixed at three
Error, Warning, Info. Never introduce a fourth tier, and never rename these three. Reason: the whole product is built around this exact three-way split, stated directly in the PRD's Functional Requirements.

## The required-role list is locked
The full list lives in AGENTS.md, section 9. Do not add, remove, or rename a role in it without going through `update-required-role-list`. Reason: a silent change here makes the tool check for something the PRD never asked for, or stop checking for something it did.

## The contrast threshold is fixed at 4.5:1
WCAG AA, normal text, stated directly in the PRD. Never substitute AAA (7:1) or the large-text threshold (3:1), both are explicitly out of scope for this version. Reason: the Open Questions section already flags large-text contrast as undecided, treating it as settled would contradict that. The exact wording a failing pair is shown in is `messaging.md`'s job, not this file's.

## The contrast formula must be the real one
WCAG relative luminance, as defined in AGENTS.md section 11. Never substitute an approximation, a shortcut using HSL lightness, or any formula that hasn't been verified against the reference values in `testing.md`. Reason: an approximation can look plausible while being wrong, and this product has no value if the one calculation it exists to perform is wrong.

## Each check has exactly one severity, permanently
Missing required role: Error. Failing contrast pair: Error. Role referencing a missing primitive: Warning. Unreferenced primitive: Info. Never swap which severity a check reports under.

## A schema mismatch is never silently treated as a pass
A file missing the W3C Design Tokens shape (no `$value` or `$type`) must be reported as the specific schema-mismatch state defined in AGENTS.md, never allowed to continue through the other checks as if it had matched. Reason: letting a mismatched file continue produces results that look like valid findings but are actually checking a file the tool never understood in the first place.