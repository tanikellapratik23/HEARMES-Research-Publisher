import { describe, expect, it } from "vitest";
import { buildArtifact, validateArtifact } from "./research-paper-artifact.js";

describe("research paper artifact", () => {
  it("keeps page metadata and validates a deterministic document id", () => {
    const pages = [{ page: 1, text: "Introduction\nAI readiness supports thoughtful adoption in higher education." }];
    const source = { title: "Example Paper", citation: "Example (2026)", category: "research_paper" as const, inputSha256: "a".repeat(64) };
    const first = buildArtifact(pages, source);
    const second = buildArtifact(pages, source);
    expect(first.source.documentId).toBe(second.source.documentId);
    expect(first.chunks[0]?.metadata.page).toBe(1);
    expect(validateArtifact(first).chunks).toHaveLength(1);
  });
});
