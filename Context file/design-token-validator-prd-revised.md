## Product Summary

A free, client-side web tool that validates a design-tokens.json export against structural and accessibility rules. It runs entirely in the browser. No login. No server-side storage of the uploaded file. It was built because teams now hand these exports to AI coding agents as a build-time source of truth, with no check in between.

## Problem

Teams now export design tokens, JSON files containing colour primitives and role mappings, directly to AI coding agents and treat the export as ground truth for every colour decision the agent makes. In practice, I have not seen this check performed before the handoff happens. A tokens file can be missing required roles, map a role to a colour pair that fails contrast requirements, or reference primitives that do not exist, and none of that surfaces until the agent has already built on top of it.

## Goals

- Catch structural and accessibility errors in a tokens file before it reaches an AI coding agent.
- Keep the tool free and frictionless: no login, no account, no server round-trip for the file.
- Make validation output understandable to someone without accessibility expertise, not just a raw number. Measured via the comprehension check in Success Metrics.

## Users and Personas

Primary user: a developer or designer already building with an AI coding agent, who exports design tokens from a tool like Figma and wants to verify the export before using it. This user may not know WCAG contrast thresholds by name.

This persona may split into distinct developer and designer sub-needs post-v1, for example CI integration versus a standalone web page. Not addressed in this version.

## Scope

In scope for v1:
- Validating a single design-tokens.json file against the W3C Design Tokens format.
- The four checks: missing required roles, failing On-X/X contrast pairs, roles referencing non-existent primitives, and unreferenced primitives.
- Client-side only processing. The file is never sent to a server.
- v1 ships on-screen display only. Exportable reports are deferred to a future version and are not a blocker for v1.

Out of scope for v1:
- Any tokens.json schema other than the W3C Design Tokens format.
- WCAG AAA or large-text contrast thresholds.
- Editing or fixing tokens. This is a checker, not an editor.
- Any server storage, account system, or saved history of past checks.
- Configurable or custom required-role lists.

## Functional Requirements

- The tool must accept a design-tokens.json file as input, through a file picker or drag-and-drop upload.
- The tool must detect invalid JSON and display a plain-language parse error, not a blank state or a crash.
- The tool must detect a file that does not match the W3C Design Tokens format and display a specific message naming the mismatch, separate from a generic parse error.
- The tool must parse the file and identify defined primitives and defined roles.
- The tool must check for the presence of these required roles: Primary, On-Primary, Primary Container, On-Primary Container, and the equivalent four for Secondary, Tertiary, and Error, plus Surface, On-Surface, Outline, and Background. A missing role is reported as an Error.
- The tool must calculate the WCAG contrast ratio for each On-X/X pair among the required roles above, and report any pair below 4.5:1 as an Error, stating the actual ratio and the required threshold, for example: "Primary (#2B5F8A) vs On-Primary (#FFFFFF): 3.2:1, fails AA, needs 4.5:1."
- The tool must check whether every role's referenced primitive actually exists in the file, and report a Warning for any role that references a missing primitive.
- The tool must identify any primitive defined in the file that is never referenced by any role, and report this as Info.
- The tool must display all findings on-screen, grouped by severity: Error, Warning, Info.
- The tool must not store the uploaded file, its contents, or any validation result after the session ends.

## AI and AI-Related Tools and Solutions

This product does not use AI in its own operation. The validation checks, role presence, contrast ratio calculation, reference matching, are deterministic rule-based checks, not AI-driven.

The product's relationship to AI is positional. It exists to validate an artifact, the tokens file, before an AI coding agent uses that artifact as a source of truth downstream. The tool is a pre-check for a downstream AI workflow, not an AI-powered tool itself.

## Technical Architecture, including a Prisma data model

This section does not apply as currently scoped. There is no login, no upload to a server, and the file never leaves the browser. A Prisma data model requires a relational database behind an API layer. This product has no server-side component to model, because processing happens entirely client-side and nothing is persisted.

Next.js is used here because it was specified as the required stack for this PRD, not because its server-side capabilities are needed. A static site generator or a plain client-side framework would be equally or better suited to this product's actual requirements. This is stated plainly as a constraint, not a technical recommendation.

## Vector Database Architecture and Design

This section does not apply as currently scoped. This product has no retrieval or search functionality, no embeddings, and no semantic matching requirement. A vector database exists to support similarity search over embedded data. This tool performs deterministic rule checks against a single uploaded file, not retrieval across a corpus of documents or examples.

## Vector Database Model

This section does not apply, for the same reason as the section above. There is no vector database in this product's scope, so there is no model to define.

## Business Model

This is a free tool with no monetization in v1. Distribution for v1 is the author's own public channels: the Ship & Found Bootcamp Ship Log, the companion design-systems article, and GitHub. No paid acquisition and no marketing budget. This is the full go-to-market for v1.

If monetization is intended later, that needs to be defined separately, since nothing currently indicates pricing, a target company, or a revenue mechanism.

## Success Metrics

- At least one real user outside the author, given a flagged contrast error with no prior WCAG knowledge, can correctly explain in their own words what the error means and why it matters. Tested via a short unmoderated comprehension check after the tool ships.

No usage, growth, or adoption metrics are proposed, since there is no stated distribution or growth goal beyond the channels named in Business Model.

## Risks

- This tool commits to one schema, the W3C Design Tokens format. A user's export from a tool that generates a different structure will not parse, though the new parse-error requirement now gives the user a clear message instead of a silent failure.
- Hardcoding a fixed required-role list means a team using a different or smaller role structure than the assumed M3-based set will see false Errors for roles they never intended to define. Configurable role lists are explicitly deferred, so this needs clear messaging in the tool's own copy.
- The tool performs all processing in the browser with no server offload. A very large tokens file, hundreds of primitives and roles, could cause noticeable UI lag or a temporarily unresponsive page. No file size limit or performance target is currently defined.
- Because the tool does no server-side logging or storage, there is no way to track how often it is used or what kinds of files commonly fail, which limits the ability to improve the required-role list or checks based on real usage patterns over time.

## Open Questions

- Should large-text contrast (3:1) apply to roles typically used at larger sizes, like Display tokens, or is that too speculative without more metadata in the file?
- Exportable reports are deferred post-v1, per the Scope decision above. Revisit only if user feedback requests it.
- What file size or primitive count should v1 treat as the practical ceiling, given the performance risk noted above? No number is set yet.
