import { describe, it, expect } from "vitest";
import { parseTokensFile } from "../lib/validation/parser";
import { validateTokens } from "../lib/validation/rules";
import fs from "fs";
import path from "path";

describe("Phase 7 Artifact Verification", () => {
  it("produces exactly one finding: one contrast Error on a single On-X/X pair and zero warnings or info", () => {
    const raw = fs.readFileSync(path.resolve(__dirname, "../single-contrast-error-tokens.json"), "utf-8");
    const parsed = parseTokensFile(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const report = validateTokens(parsed.data);

    expect(report.totalIssues).toBe(1);
    expect(report.errors.length).toBe(1);
    expect(report.warnings.length).toBe(0);
    expect(report.info.length).toBe(0);

    expect(report.errors[0].checkId).toBe("contrast-pairs");
    expect(report.errors[0].message).toBe("Primary (#777777) vs On-Primary (#888888): 1.3:1, fails AA, needs 4.5:1.");
  });
});
