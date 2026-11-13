import { createHash } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { buildArtifact, type SourceCategory } from "../src/modules/knowledge/research-paper-artifact.js";

const args = process.argv.slice(2);
const get = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const input = get("--input"), output = get("--output"), title = get("--title"), citation = get("--citation"), category = get("--category") as SourceCategory | undefined;
if (!input || !output || !title || !citation || !category) throw new Error("Usage: --input pages.json --output artifact.json --title TITLE --citation CITATION --category research_paper|best_practice");
const raw = await readFile(input);
const artifact = buildArtifact(JSON.parse(raw.toString("utf8")), { title, citation, category, inputSha256: createHash("sha256").update(raw).digest("hex") });
const temp = `${output}.tmp`;
await writeFile(temp, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 });
await rename(temp, output);
console.log(JSON.stringify({ output, pages: artifact.source.pageCount, chunks: artifact.chunks.length, integritySha256: artifact.integritySha256 }, null, 2));
