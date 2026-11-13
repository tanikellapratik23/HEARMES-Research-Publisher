import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma.js";
import { validateArtifact } from "../src/modules/knowledge/research-paper-artifact.js";

const args = process.argv.slice(2); const index = args.indexOf("--artifact"); const artifactPath = index >= 0 ? args[index + 1] : undefined; const dryRun = args.includes("--dry-run");
if (!artifactPath) throw new Error("Usage: npm run knowledge:import -- --artifact ARTIFACT.json [--dry-run]");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Set it in your Terminal, not in the browser.");
const artifact = validateArtifact(JSON.parse(await readFile(artifactPath, "utf8")));
if (!dryRun) await prisma.$transaction(async (tx) => {
  await tx.knowledgeDocument.upsert({ where: { id: artifact.source.documentId }, create: { id: artifact.source.documentId, sourceTitle: artifact.source.title, sourceType: "heair_paper", sourceUrlOrCitation: artifact.source.citation, rawText: artifact.pages.map((p) => p.text).join("\n\n") }, update: { sourceTitle: artifact.source.title, sourceType: "heair_paper", sourceUrlOrCitation: artifact.source.citation, rawText: artifact.pages.map((p) => p.text).join("\n\n") } });
  await tx.knowledgeChunk.deleteMany({ where: { documentId: artifact.source.documentId } });
  await tx.knowledgeChunk.createMany({ data: artifact.chunks.map((chunk) => ({ documentId: artifact.source.documentId, chunkIndex: chunk.chunkIndex, chunkText: chunk.chunkText, metadata: chunk.metadata })) });
});
console.log(JSON.stringify({ title: artifact.source.title, pages: artifact.source.pageCount, chunks: artifact.chunks.length, documentId: artifact.source.documentId, liveCorpus: "heair_paper", dryRun }, null, 2));
await prisma.$disconnect();
