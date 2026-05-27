/**
 * Sanitizes LLM output before JSON.parse.
 * LLMs often inject control characters, raw newlines inside strings,
 * or unescaped tabs — all of which break JSON.parse.
 */
export function sanitizeJson(text: string): string {
  let s = text;

  // 1. Extract JSON block between first { and last }
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }

  // 2. Remove BOM and zero-width characters
  s = s.replace(/^\uFEFF/, "");

  // 3. Remove control characters EXCEPT allowed whitespace (\n, \r, \t)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  // 4. Fix unescaped raw newlines inside string values.
  let result = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && (ch === "\n" || ch === "\r")) {
      result += "\\n";
      continue;
    }

    result += ch;
  }

  return result;
}

/**
 * Repairs truncated / broken JSON by closing open strings and braces.
 */
function repairTruncatedJson(s: string): string {
  let inString = false;
  let escapeNext = false;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
      if (ch === "[") bracketDepth++;
      if (ch === "]") bracketDepth--;
    }
  }

  let repaired = s;

  // Close open string
  if (inString) {
    repaired += '"';
  }

  // Close open values/objects
  // We may be inside a partial key:value pair, or mid-string in a value.
  // Heuristic: if we're inside a string that was just closed, the value
  // might be the "code" field. We need to close the string, then close
  // the object if braceDepth > 0.

  // Close any remaining braces
  while (braceDepth > 0) {
    repaired += "}";
    braceDepth--;
  }

  return repaired;
}

/**
 * Attempts to parse sanitized JSON with fallback repair for truncation.
 */
export function safeJsonParse(text: string): any {
  const cleaned = sanitizeJson(text);

  try {
    return JSON.parse(cleaned);
  } catch (firstErr: any) {
    // Try repairing truncated JSON
    const repaired = repairTruncatedJson(cleaned);

    try {
      return JSON.parse(repaired);
    } catch (secondErr: any) {
      // Fallback: try to fix trailing commas inside objects/arrays
      const noTrailing = repaired.replace(/,(\s*[}\]])/g, "$1");

      try {
        return JSON.parse(noTrailing);
      } catch (thirdErr: any) {
        throw new Error(
          `Invalid JSON from LLM. ${firstErr.message}. Preview: ${cleaned.slice(0, 300)}...`
        );
      }
    }
  }
}
