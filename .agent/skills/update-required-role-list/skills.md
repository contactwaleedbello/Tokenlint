---
name: update-required-role-list
description: Update Tokenlint's required-role list when the external standard it tracks changes, without turning the list into something configurable.
---

1. Confirm the change is driven by an actual revision to the external standard this project tracks, Material Design 3's role vocabulary or the W3C Design Tokens format, not a request to customize the list for one team or project. See AGENTS.md, section 3, which rules out a configurable list.
2. Identify exactly which roles are being added, removed, or renamed, and note the specific external spec change that justifies it.
3. Update the required-role list in AGENTS.md, section 9, to the new set.
4. Check that validation.md's reference to the list still points correctly. Its own content does not need to change, since it references AGENTS.md rather than restating the list.
5. Check whether any example message in messaging.md names a role affected by this change. If one does, update that example to reference a role still on the list.
6. Update the test fixtures that check the required-role list to match the new set. See testing.md.
7. Run the full test command. Confirm every required-role test passes against the updated list before continuing. See testing.md.
8. Commit the change with a message stating which roles changed and which external spec revision justified it. See git.md.