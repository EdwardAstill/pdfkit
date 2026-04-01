/**
 * Parse a page range string like "1,3,5-8" into 0-based indices.
 * Invalid or out-of-range values are silently dropped.
 */
export function parsePageRange(spec: string, total: number): number[] {
  const pages: number[] = [];
  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-", 2);
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start - 1; i < end; i++) {
          pages.push(i);
        }
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) {
        pages.push(n - 1);
      }
    }
  }
  return pages.filter((p) => p >= 0 && p < total);
}
