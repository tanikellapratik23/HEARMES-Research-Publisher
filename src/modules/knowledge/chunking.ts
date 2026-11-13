export const CHUNKING = { sizeWords: 450, strideWords: 350 } as const;

export function chunkText(text: string, sizeWords = CHUNKING.sizeWords, strideWords = CHUNKING.strideWords): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += strideWords) {
    const chunk = words.slice(start, start + sizeWords).join(" ").trim();
    if (chunk) chunks.push(chunk);
    if (start + sizeWords >= words.length) break;
  }
  return chunks;
}
