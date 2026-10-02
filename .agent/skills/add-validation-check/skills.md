---
name: add-validation-check
description: Add a new check to Tokenlint's validator, from approval through to a working, tested, correctly-worded result.
---

1. Confirm the new check is named in the PRD, or has explicit approval if it is not. Do not start building a check that is neither.
2. Assign the check one of the three existing severity tiers. See validation.md for what each tier means.
3. Write the check as its own function, separate from any UI component. See structure.md for where validation logic lives.
4. Confirm the new check does not alter the locked required-role list, the fixed contrast threshold, or the contrast formula. See validation.md.
5. Write one test file that should trigger the check and one that should not.
6. Run the test command. Confirm both the triggering and non-triggering cases pass before continuing. See testing.md.
7. Write the check's user-facing message. Lead with plain language, state the technical value after, and avoid jargon with no explanation around it. See messaging.md.
8. Confirm the check and its message never send or store anything outside the current browser session. See privacy.md.
9. Add the check's output to the correct severity group in the results display.
10. Run the full test suite. Confirm everything still passes with the new check included before treating the task as done. See testing.md.