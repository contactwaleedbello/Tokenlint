---
trigger: always_on
---

<!-- rules/git.md -->
# git.md

Controls version control discipline. Nothing here is specific to what this product does.

## Open item: merge process not yet decided
Whether work lands on main through a pull request or a direct merge after review hasn't been confirmed. Do not assume either. Ask first.

## Never commit directly to main
Every change happens on its own branch first. Reason: a direct commit to main can't be reviewed or reverted cleanly before it's already live in the main line of history.

## Branch naming
Short, lowercase, hyphenated, descriptive of the actual change: `fix-contrast-formula`, `add-schema-check`. No invented ticket numbers, since no ticket system exists for this project. Reason: a consistent naming shape keeps branches sortable and searchable later, an inconsistent one makes old branches harder to identify at a glance.

## Never force-push to a shared branch
A force-push can silently delete another person's or another session's work. Treat every branch other than your own current one as shared, even on a solo project, since a past session's branch counts as someone else's work relative to this one.

## Never rewrite history on a branch you didn't just create
Rebasing, squashing, amending, or `git reset --hard` only applies to commits made in your own current, unshared session of work. Reason: rewriting history that another session (or person) has already built on breaks their reference point to it, even if no one is actively watching that branch right now.

## Commit messages state what changed and why
One line, specific to the actual change. Not "update," not "fix," not "changes." A commit message is the only record later of why a change happened, a vague one is the same as no record at all.