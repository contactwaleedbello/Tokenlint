# AGENTS.md — Tokenlint

## Input sources, in order of authority
1. The Tokenlint PRD — the only source for features, behavior, scope, required roles, and severities.
2. `styles/tokens.css` — a separate source established earlier in this project, used only for visual values (color, spacing, type, shape, shadow). Not part of the PRD itself.

Nothing outside these two may be treated as fact.

## 1. Product name
Tokenlint.

## 2. Who uses the product
One persona for v1, taken directly from the PRD: "a developer or designer already building with an AI coding agent, who exports design tokens from a tool like Figma and wants to verify the export before using it. This user may not know WCAG contrast thresholds by name."

The PRD notes this persona may later split into separate developer and designer sub-needs. That split is explicitly out of scope for this build. Do not design for two personas yet.

## 3. Defined scope for this build
This is a frontend-only, client-side build. There is no backend, no database, and no server component of any kind. The PRD states this directly: "There is no login, no upload to a server, and the file never leaves the browser."

No AI or LLM is used anywhere inside this tool. Every check (role presence, contrast calculation, reference matching) is deterministic rule-based logic, per the PRD's AI and AI-Related Tools and Solutions section. Do not add an AI call anywhere in this product, including to generate explanation text or to guess at an unrecognized schema.

In scope for v1:
- Accepting one design-tokens.json file per session, via file picker or drag-and-drop.
- Validating it against the W3C Design Tokens format.
- Four checks: missing required roles, failing On-X/X contrast pairs, roles referencing missing primitives, unreferenced primitives.
- On-screen results only, grouped by severity: Error, Warning, Info.

Out of scope for v1, stated directly in the PRD:
- Any schema other than W3C Design Tokens.
- WCAG AAA or large-text thresholds.
- Editing or fixing tokens.
- Any server storage, account system, or saved history.
- A configurable required-role list.

## 4. Stack
Next.js and TypeScript. The PRD states Next.js was adopted as a required constraint for this document, not chosen for its server capabilities: "Next.js is used here because it was specified as the required stack for this PRD, not because its server-side capabilities are needed." Build accordingly: no `/app/api` routes, no server actions, no server-side data fetching.

Styling is plain CSS using custom properties generated from this project's own `styles/tokens.css`, via the token-to-CSS conversion script already established for this project. No component library or CSS framework is named anywhere in the PRD or prior project work. Do not add one without asking.

No hosting platform has been decided. Do not assume Vercel, Cloudflare, or any other host. Ask, or see Open Questions below.

## 5. Folder map
Frontend-only, so there is no backend/frontend split to define. Folder and file layout conventions live in `.agent/rules/structure.md`, not here. If `.agent/rules/structure.md` does not yet cover a situation you hit, stop and ask rather than inventing a convention.

## 6. How to work in this codebase
One change at a time. Ask before adding a package. Ask before adding any check, screen, or state the PRD does not describe. Any new validation check or change to the required-role list (Section 9 below) must trace to a line in the PRD; if it doesn't, that's a scope change, not a quiet addition, route it through the `.agent/skills/add-validation-check` or `.agent/skills/update-required-role-list` skill instead of building it inline. List assumptions at the end of every response. Stop and ask when the PRD or `styles/tokens.css` are silent on something.

## 7. Definitions
Defined exactly as the PRD defines them, nothing added:
- **Primitive**: a raw, unmapped value in the tokens file.
- **Role**: a named value (Primary, On-Primary, Surface, etc.) that references a primitive.
- **On-X/X pair**: a role and its paired text/icon role, checked together for contrast (e.g. Primary vs On-Primary).
- **Severity tiers**: Error, Warning, Info, exactly as defined in Functional Requirements, not interchangeable or reorderable.
- **W3C Design Tokens format**: schema at https://tr.designtokens.org/format/. A token object requires a `$value` field; a composite token uses `$type`. A file missing this structure is a schema mismatch (State 3 below), not invalid JSON (State 2). Any other structure is out of scope, not a bug to silently handle.

## 8. UI construction approach
No Figma file and no moodboard exist for this project. Unlike a typical no-Figma build, this one isn't starting from a blank visual slate either: `styles/tokens.css` already defines every color role, spacing value, type scale, radius, and shadow this product needs, including per-component color mappings under `theme.component.*` (button, card, badge, and so on, following Material Design 3 structure).

Build each screen's behavior from the PRD's Functional Requirements. Build its appearance from `styles/tokens.css`, a separate source established earlier in this project and not part of the PRD itself. Never hardcode a color, spacing, or type value that isn't traceable to a token in that file.

## 9. The complete user journey
One screen, four states, each quoting its exact PRD line.

**State 1 — Empty / upload.** "The tool must accept a design-tokens.json file as input, through a file picker or drag-and-drop upload." No data is read or written yet.

**State 2 — Invalid JSON.** "The tool must detect invalid JSON and display a plain-language parse error, not a blank state or a crash." Reads the uploaded file's raw contents only, in-memory, never persisted.

**State 3 — Schema mismatch.** "The tool must detect a file that does not match the W3C Design Tokens format and display a specific message naming the mismatch, separate from a generic parse error." Distinct copy and state from State 2, not a shared generic error. See Section 7 for what counts as a match.

**State 4 — Results.** Parses the file to identify defined primitives and defined roles, then runs four checks:

- **Required roles (Error if missing).** The full list, no more, no fewer: Primary, On-Primary, Primary Container, On-Primary Container; Secondary, On-Secondary, Secondary Container, On-Secondary Container; Tertiary, On-Tertiary, Tertiary Container, On-Tertiary Container; Error, On-Error, Error Container, On-Error Container; Surface, On-Surface, Outline, Background.
- **Contrast (Error if below threshold).** Every On-X/X pair among the roles above must reach 4.5:1 (WCAG AA, normal text). A failing pair is an Error, stated with the actual ratio and threshold in this exact format: "Primary (#2B5F8A) vs On-Primary (#FFFFFF): 3.2:1, fails AA, needs 4.5:1."
- **Missing primitive reference (Warning).** A role that points to a primitive not defined in the file.
- **Unreferenced primitive (Info).** A primitive defined in the file that no role ever points to.

Displays all four outcomes "grouped by severity: Error, Warning, Info."

No screen reads or writes persistent data anywhere in this flow. The PRD is explicit: "The tool must not store the uploaded file, its contents, or any validation result after the session ends."

## 10. Where the rules live
Folder and file structure: `.agents/rules/structure.md`. Terminal commands: `.agents/rules/commands.md`. Git discipline: `.agents/rules/git.md`. Required testing before a change counts as done: `.agents/rules/testing.md`. Validation logic and severity tiers: `.agents/rules/validation.md`. How a flagged issue gets worded: `.agents/rules/messaging.md`. The no-transmission, no-persistence rule for an uploaded file: `.agents/rules/privacy.md`. None of these are repeated here. There is no separate backend convention, because there is no backend.

## 11. One thing the agent must do well
Get the WCAG contrast math exactly right. Compute relative luminance per the WCAG 2.1 definition (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance), then contrast ratio as (L1 + 0.05) / (L2 + 0.05), using the lighter of the two colors' luminance as L1. This product's only reason to exist is being correct about the one thing it checks. A wrong contrast ratio is worse than no tool at all.

---

## Open Questions
- Hosting platform: not decided anywhere in this project. Do not assume one.
- File size or primitive-count ceiling: the PRD flags this as an unresolved risk with "no file size limit or performance target is currently defined." Do not invent a number.
- Whether large-text contrast (3:1) should apply to Display-scale roles: left open in the PRD itself.
- Exportable reports: explicitly deferred post-v1 per the PRD's Scope section. Do not build this now.
