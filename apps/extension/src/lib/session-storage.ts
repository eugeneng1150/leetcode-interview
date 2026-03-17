import type { SessionSummary } from "@leetcode-interviewer/shared";

const SESSION_KEY = "leetcode-interviewer:last-session";

export async function saveSessionSummary(summary: SessionSummary): Promise<void> {
  await chrome.storage?.local?.set?.({
    [SESSION_KEY]: summary
  });
}

export async function loadLastSessionSummary(): Promise<SessionSummary | null> {
  const result = await chrome.storage?.local?.get?.(SESSION_KEY);
  return result?.[SESSION_KEY] ?? null;
}
