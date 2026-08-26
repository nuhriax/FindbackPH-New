import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Serializes a value as JSON for embedding inside an inline
 * <script type="application/ld+json"> element (structured data).
 *
 * JSON.stringify alone does NOT escape `<`, `>`, or `&`. If user-controlled
 * text (e.g. a report title or description) is serialized with it and injected
 * via dangerouslySetInnerHTML, a title ending in `</script><script>…</script>`
 * can break out of the script element and inject HTML/JavaScript (stored XSS).
 *
 * Mapping those characters to JSON \uXXXX escapes keeps the JSON perfectly
 * valid (search engines decode `\u003c` back to `<`) while neutralizing the
 * script-element breakout.
 */
export function jsonLdStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
