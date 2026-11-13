import { createHash } from "node:crypto";
import { z } from "zod";
import { CHUNKING, chunkText } from "./chunking.js";

export const ALL_ROLES = ["student", "faculty", "executive_leadership", "administrative_staff", "programming_staff", "finance_staff"] as const;
export type SourceCategory = "research_paper" | "best_practice";

const Page = z.object({ page: z.number().int().positive(), text: z.string() });
export const ArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  artifactType: z.literal("hearmes_research_retrieval"),
  builtAt: z.string(),
  source: z.object({ documentId: z.string().uuid(), title: z.string().min(1), citation: z.string().min(1), category: z.enum(["research_paper", "best_practice"]), inputSha256: z.string().length(64), pageCount: z.number().int().positive() }),
  chunking: z.object({ sizeWords: z.number().int(), strideWords: z.number().int() }),
  pages: z.array(Page),
  chunks: z.array(z.object({ chunkIndex: z.number().int(), chunkText: z.string().min(1), metadata: z.object({ kind: z.literal("research_paper"), page: z.number().int().positive(), section: z.string(), roles: z.array(z.string()) }) })),
  integritySha256: z.string().length(64)
});
export type ResearchArtifact = z.infer<typeof ArtifactSchema>;

const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const normalize = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
function uuidFromText(value: string) { const h = sha(value); return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-${((parseInt(h[16],16)&3)|8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`; }
function sectionFor(text: string) { const candidate = text.split(/\n+/).map(normalize).find((line) => line.length > 4 && line.length < 130 && !/[.!?]$/.test(line)); return candidate || "PDF page"; }

export function buildArtifact(pagesInput: unknown, source: { title: string; citation: string; category: SourceCategory; inputSha256: string }): ResearchArtifact {
  const pages = z.array(Page).parse(pagesInput).map((page) => ({ ...page, text: normalize(page.text) })).filter((page) => page.text.length > 0);
  if (!pages.length) throw new Error("No readable PDF pages were supplied.");
  const documentId = uuidFromText(`${normalize(source.title)}|${normalize(source.citation)}`);
  let index = 0;
  const chunks = pages.flatMap((page) => chunkText(page.text).map((chunkText) => ({ chunkIndex: index++, chunkText, metadata: { kind: "research_paper" as const, page: page.page, section: sectionFor(page.text), roles: [...ALL_ROLES] } })));
  if (!chunks.length) throw new Error("No searchable chunks could be created from this PDF.");
  const base = { schemaVersion: 1 as const, artifactType: "hearmes_research_retrieval" as const, builtAt: new Date().toISOString(), source: { documentId, title: normalize(source.title), citation: normalize(source.citation), category: source.category, inputSha256: source.inputSha256, pageCount: pages.length }, chunking: CHUNKING, pages, chunks };
  return ArtifactSchema.parse({ ...base, integritySha256: sha(JSON.stringify(base)) });
}

export function validateArtifact(input: unknown): ResearchArtifact {
  const parsed = ArtifactSchema.parse(input);
  const { integritySha256, ...base } = parsed;
  if (sha(JSON.stringify(base)) !== integritySha256) throw new Error("Artifact integrity check failed. Do not import this file.");
  return parsed;
}
