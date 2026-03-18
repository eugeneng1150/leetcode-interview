const TRUNCATED_SUFFIX = " ...[truncated]";

export function compactProblemText(value: string, maxChars: number): string {
  return truncateSingleLine(value.replace(/\s+/gu, " ").trim(), maxChars);
}

export function compactCandidateNotes(value: string, maxChars: number): string {
  return truncateSingleLine(value.replace(/\s+/gu, " ").trim(), maxChars);
}

export function compactCandidateCode(value: string, maxChars: number): string {
  const normalized = value.trim();
  if (!normalized) {
    return normalized;
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const headLength = Math.max(0, Math.floor(maxChars * 0.65));
  const tailLength = Math.max(0, maxChars - headLength - TRUNCATED_SUFFIX.length);
  const head = normalized.slice(0, headLength).trimEnd();
  const tail = normalized.slice(-tailLength).trimStart();
  return `${head}${TRUNCATED_SUFFIX}\n${tail}`;
}

function truncateSingleLine(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  const sliceLength = Math.max(0, maxChars - TRUNCATED_SUFFIX.length);
  return `${value.slice(0, sliceLength).trimEnd()}${TRUNCATED_SUFFIX}`;
}
