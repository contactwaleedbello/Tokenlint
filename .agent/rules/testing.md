---
trigger: model_decision
description: Also named directly as a Model Decision example. Only relevant when writing or changing logic, not on every action.
---

<!-- rules/testing.md -->
# testing.md

Controls what must be tested before a change counts as done.

## Test command and framework
The test runner is Vitest. The test command is `npm test`. Where test files physically live is covered in `structure.md`, not repeated here.

## The contrast formula must be tested against known reference values
Before this formula is trusted anywhere in the product, confirm it against values that are already known to be correct: black on white should compute to 21:1, and the PRD's own stated example, #2B5F8A against #FFFFFF, should compute to 3.2:1. Reason: this calculation is the one thing this product has to get exactly right, stated directly in AGENTS.md. A wrong formula that looks plausible is worse than an obviously broken one.

## Each of the four checks needs a passing case and a failing case
For every check (missing required role, failing contrast pair, role referencing a missing primitive, unreferenced primitive), there must be at least one test file that should trigger it and one that should not. Reason: a check that only has a test proving it can fire, but never a test proving it stays silent when it shouldn't, can still be wrong in the direction of too many false positives.

## Both error states need their own test case
One test file that is not valid JSON at all. One test file that is valid JSON but does not match the W3C Design Tokens shape (missing `$value` or `$type`). These must produce the two distinct messages defined in `messaging.md` and AGENTS.md, not the same generic error.

## Nothing counts as done until the test command passes
Once the test command exists, no change is finished before it runs clean. "It looks right" is not a substitute for a passing test, especially on a product whose only job is being correct.