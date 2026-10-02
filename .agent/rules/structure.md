---
trigger: model_decision
description: Named directly as a Model Decision example. Only relevant when deciding where a file goes, not on every action.
---

<!-- rules/structure.md -->
# structure.md

Controls folder and file layout. This project has a frontend only, so there is no backend folder convention to define here.

## No /app/api directory
This project has no server routes, no server actions, and no server-side data fetching. Next.js was adopted as a required constraint, not for its server capabilities. An `/app/api` folder appearing anywhere in this project is a sign a backend is being built that was never asked for.

## Validation logic lives apart from UI components
Put the actual checking functions (role presence, contrast calculation, reference matching, schema matching) in their own folder, separate from the components that display results. Reason: these functions need to be tested in isolation. If checking logic is woven into a component, it can't be tested without also rendering UI.

## Test files live next to the code they test
A test for `contrast.ts` lives as `contrast.test.ts` in the same folder, not gathered into one separate top-level test directory. Reason: a test sitting next to its code is harder to lose track of when the code changes, and easier to find when something fails.

## design-tokens-tokenlint.json and its conversion script
The tokens file lives at the project root. The script that converts it into `tokens.css` lives in `scripts/`, with its output written to `styles/tokens.css`. Reason: AGENTS.md treats this file as a primary source of truth for appearance, it needs a fixed, predictable location, not wherever felt convenient at the time.

## Suggested top-level folders
- `app/` — pages and routes, client components only.
- `components/` — UI pieces (upload area, results list, severity badges, and so on).
- `lib/validation/` — the four checks, the contrast formula, and the schema check. No UI code here.
- `scripts/` — the tokens-to-CSS conversion script.
- `styles/` — the generated `tokens.css` and any other stylesheets.
- `public/` — static assets.

## Do not invent a different convention mid-project
If a situation comes up that this file doesn't cover, stop and ask rather than picking a new convention on your own. A folder structure that changes shape halfway through is worse than one that's briefly incomplete.