import type { SessionSummary } from "@leetcode-interviewer/shared";

const SESSION_KEY = "leetcode-interviewer:last-session";
const SESSION_HISTORY_KEY = "leetcode-interviewer:session-history";
const NOTES_KEY_PREFIX = "leetcode-interviewer:notes:";
const MAX_SESSION_HISTORY = 8;

export async function saveSessionSummary(summary: SessionSummary): Promise<void> {
  const history = await loadSessionHistory();
  const nextHistory = [
    summary,
    ...history.filter(
      (entry) => !(entry.problemUrl === summary.problemUrl && entry.startedAt === summary.startedAt)
    )
  ].slice(0, MAX_SESSION_HISTORY);

  await chrome.storage?.local?.set?.({
    [SESSION_KEY]: summary,
    [SESSION_HISTORY_KEY]: nextHistory
  });
}

export async function loadLastSessionSummary(): Promise<SessionSummary | null> {
  const result = await chrome.storage?.local?.get?.(SESSION_KEY);
  return result?.[SESSION_KEY] ?? null;
}

export async function loadSessionHistory(): Promise<SessionSummary[]> {
  const result = await chrome.storage?.local?.get?.(SESSION_HISTORY_KEY);
  const history = result?.[SESSION_HISTORY_KEY];
  return Array.isArray(history) ? history : [];
}

export async function saveProblemNotes(problemUrl: string, notes: string): Promise<void> {
  await chrome.storage?.local?.set?.({
    [getNotesKey(problemUrl)]: notes
  });
}

export async function loadProblemNotes(problemUrl: string): Promise<string> {
  const result = await chrome.storage?.local?.get?.(getNotesKey(problemUrl));
  return result?.[getNotesKey(problemUrl)] ?? "";
}

export async function clearLocalData(): Promise<void> {
  const result = await chrome.storage?.local?.get?.(null);
  const keys = Object.keys(result ?? {}).filter(
    (key) => key === SESSION_KEY || key === SESSION_HISTORY_KEY || key.startsWith(NOTES_KEY_PREFIX)
  );

  if (keys.length === 0) {
    return;
  }

  await chrome.storage?.local?.remove?.(keys);
}

function getNotesKey(problemUrl: string): string {
  return `${NOTES_KEY_PREFIX}${problemUrl}`;
}
