<!-- rules/commands.md -->
# commands.md

Controls which terminal commands you may run, and which you may never run.

## Confirmed package manager
The package manager for this project is npm.

## Allowed without asking first
- The dev server command (`npm run dev`).
- The build command (`npm run build`).
- The lint command (`npm run lint`).
- The type-check command (`npx tsc --noEmit`).
- The test command (`npm test`).

These are read-only in effect. None of them change project files or send anything anywhere, so none of them need a check-in first.

## Never run a deploy or publish command
No hosting platform has been decided for this project yet, that's an open question, not a gap for you to fill. If no deploy command exists yet, that's correct. Do not add one so you have something to run.

## Never install a package without asking first
AGENTS.md already states: ask before adding a package. That rule covers the decision to add a dependency. This rule covers the command itself: if running something would add, update, or remove a package, stop and ask before you run it, not after.

## Never run a database, migration, or ORM command
No command like `prisma`, `supabase`, `psql`, or any migration tool belongs in this project, because no database exists. If a step you're about to take would require a command like this, that's a sign the step itself is wrong, not that you're missing a tool.

## Never delete files without asking
No `rm -rf` or any bulk file deletion. If something genuinely needs to be deleted, say exactly what and ask first. Git-specific destructive actions (force-push, history rewrites) are covered in `git.md`, not here, to keep that rule in one place only.