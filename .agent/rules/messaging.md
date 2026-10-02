---
trigger: glob
globs: lib/validation/**, components/results/**
---

<!-- rules/messaging.md -->
# messaging.md

Controls how a flagged issue gets worded. Does not control what gets checked or at what severity, or the numeric threshold used, that's `validation.md`'s job. This file only controls wording.

## Plain language comes before the technical value
Every message states what's wrong in a sentence a non-expert can follow, before showing a ratio or a hex code. Reason: the PRD's own Goals and Success Metrics are built around this, measured by whether someone with no WCAG knowledge can explain a flagged error back in their own words.

## No raw value stands alone
A contrast ratio, a hex code, or a role name never appears with nothing around it explaining what it means or why it matters. A number by itself answers "what" but not "so what," and "so what" is the part this product exists to provide.

## Required-role (Error) example
"The Secondary Container role is missing from this file. Components that rely on it won't have a defined background color."

## Contrast (Error) example, the PRD's exact format
"Primary (#2B5F8A) vs On-Primary (#FFFFFF): 3.2:1, fails AA, needs 4.5:1." This exact shape, not a reworded version of it. Reason: this is the literal example already stated in the PRD, changing its shape breaks the one output format already agreed to before this file existed.

## Missing-primitive-reference (Warning) example
"The On-Primary role points to a primitive called 'primary-100', but no primitive with that name exists in this file."

## Unreferenced-primitive (Info) example
"The primitive 'neutral-85' is defined in this file but isn't used by any role. This isn't a problem, just worth knowing."

## No WCAG jargon stands alone
If a term like "contrast ratio" or "WCAG AA" appears in a message, enough plain language must surround it that someone who has never heard of accessibility standards still understands the finding without looking anything up.

## Severity levels read differently, not just display differently
An Error reads like something that will cause a real problem if shipped. A Warning reads like something worth checking. An Info reads like a passive observation, not a problem at all. The wording itself has to carry that difference, not just a color or icon next to it. Reason: a colorblind user can't rely on color alone to tell severities apart, and a tool whose entire purpose is catching exactly that kind of oversight shouldn't make it in its own interface.