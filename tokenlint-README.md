# Tokenlint

## What This Project Is

Tokenlint is a free, client-side design token validator. It checks a `design-tokens.json` export for structural and accessibility problems before it's handed to an AI coding agent as a build-time source of truth.

## Who It Is Designed For

Developers and designers already working with AI coding agents, who may not have deep accessibility expertise themselves.

## The Problem It Solves

Teams now export design tokens and hand them to AI agents as ground truth, with no check in between. A tokens file can be missing required roles, map a role to a colour pair that fails contrast, or reference primitives that don't exist, and none of that surfaces until the agent has already built on top of it.

## The Technologies and Tools Used

Next.js and TypeScript, entirely client-side, no backend and no database. Styling is plain CSS using custom properties generated from this project's own `design-tokens-tokenlint.json`, an OKLCH-based, GTC-named design system built earlier in this project. Tested with Vitest. Deployed on Vercel.

## Important Decisions I Made

**Next.js as a constraint, not a recommendation.** It was adopted because it was specified for this build, not because any server capability was needed. This is stated plainly in the project's own PRD and AGENTS.md rather than quietly justified as a technical choice, since this product has no backend of any kind.

**Severity is fixed at exactly three tiers.** Error, Warning, Info. Each of the four checks maps to exactly one tier, permanently, so the tool's output stays predictable rather than inconsistent from one check to the next.

**Colour expressed in OKLCH, not HSL.** Each tonal scale holds hue and chroma fixed and varies only lightness. This keeps the steps perceptually uniform instead of muddying or shifting hue at the extremes, which HSL tends to do.

**The required-role list is locked for v1.** Twenty roles, taken directly from the PRD, not configurable. A flexible list was explicitly left out of this version to keep the tool simple and trustworthy rather than open-ended.

**Contrast threshold fixed at WCAG AA (4.5:1) only.** AAA and large-text thresholds were deliberately left out of v1 rather than guessing which additional thresholds mattered most without real usage to justify them.

## Challenges I Encountered and How I Solved Them

**Catching my own early inconsistency in the PRD.** I initially wrote the Technical Architecture section as if Next.js's capabilities were a deliberate fit for this product. A structured review caught this directly against the PRD's own no-backend scope, and I corrected it to state the stack as an external constraint, not a recommendation.

**An edge case in primitive-versus-role classification.** Shadow tokens in the design system reference a colour primitive internally, for tinting, which could be misread as a "role" under a simple alias-detection rule. Rather than trust a self-reported token count, I independently recomputed it against the real file and confirmed the classification handled this case correctly before relying on it.

**An architectural privacy claim wasn't the same as a verified one.** An early claim that "no network requests happen" was reasoned from the code's design (using `FileReader`), not observed directly. I built a dedicated verification pass that first proved its own detection method worked, by planting a deliberate network call and confirming it got caught, before trusting a clean result on the real code.

## Live Demo

[Add the Vercel link here once deployed]

---

*Part of my Ship & Found Bootcamp Ship Log.*
