---
trigger: always_on
---

<!-- rules/privacy.md -->
# privacy.md

Controls one rule: what happens to the uploaded file. Nothing else belongs in this file.

## The file never leaves the browser
It is read and processed entirely client-side, in memory, for the current session only. This is a direct product promise stated in the PRD: "the file never leaves the browser."

## Never transmit the file or anything derived from it
No sending the raw file, its parsed contents, or any specific role or primitive name from it to a server, an API, or any external endpoint, for any reason. This includes a reason that sounds harmless, like using an external call to parse faster or to interpret an unfamiliar schema. AGENTS.md already rules out AI calls entirely; this rule covers every other kind of external request too.

## Never persist it past the session
No writing the file, its contents, or any validation result to localStorage, sessionStorage, IndexedDB, or cookies in a way that survives a page refresh or a closed tab. If something is held in memory during a single session, closing or refreshing the page is enough to discard it, nothing needs to be deliberately cleared, because nothing should have been deliberately saved.

## No logging that includes file content
General, content-free usage counts (if ever added later) are a separate decision requiring explicit approval. A design tokens file can contain a team's unreleased brand colors and naming conventions, logging any part of it anywhere is a real leak of someone else's intellectual property, not just a technicality.

## Error and crash reporting must not capture file content
If any error-tracking or crash-reporting tool is ever added, it must be configured to exclude variable values, stack trace locals, and any captured application state that could contain parsed token data. These tools often capture more context by default than a developer expects, confirm this exclusion explicitly rather than assuming a default setup is safe.