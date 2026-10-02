# Project Journal — Tokenlint

A running log of what I worked on, the decisions I made, and the challenges I hit along the way.

## Final Entry — Build Complete

**Worked on:** Completed the full build cycle. Refined the raw idea into a PRD, ran it through a structured, role-based debate to catch gaps before any code existed, wrote AGENTS.md and seven governing rules files, defined two reusable skills, and executed a phased build plan: scaffolding, the contrast formula (verified against known reference values before anything depended on it), file intake and both error states, the four validation checks, the results display, a dedicated privacy verification pass, and a full test-suite check. Prepared the final artifact needed for the real-user comprehension test.

**Decisions:** Fixed severity at exactly three tiers, locked the required-role list and contrast threshold to the PRD rather than making them configurable, used OKLCH instead of HSL for perceptually even colour steps, and stated Next.js as an adopted constraint rather than a technical recommendation once that distinction was caught during review.

**Challenges & how I solved them:** Caught and corrected an early inconsistency in my own PRD, where the stack was justified as if it were chosen on merit. Independently verified a self-reported token count rather than trusting it, which confirmed the classifier correctly handled a real edge case, shadow tokens that internally reference a colour primitive. Treated an architectural privacy claim as unproven until a dedicated check demonstrated its own detection method actually worked, by planting and catching a deliberate violation before trusting a clean result.

**Next:** Deploy to Vercel. Run the actual comprehension test with one real person outside myself, the PRD's stated Success Metric. Revisit the two deferred open questions, large-text contrast thresholds and a file-size ceiling, only if real usage ever surfaces a genuine need for either.

**Reflection:** The habit that mattered most across this build wasn't any single technical decision. It was refusing to accept a self-reported "done" without checking it myself, the token counts, the contrast formula, and the privacy claims all held up specifically because they were verified, not assumed.
