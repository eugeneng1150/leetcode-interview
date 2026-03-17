import type { SessionSummary } from "@leetcode-interviewer/shared";
import { DAILY_FREE_HINT_LIMIT } from "@leetcode-interviewer/shared";

const SESSION_KEY = "leetcode-interviewer:last-session";
const SESSION_HISTORY_KEY = "leetcode-interviewer:session-history";
const HINT_USAGE_KEY = "leetcode-interviewer:daily-hints";
const NOTES_KEY_PREFIX = "leetcode-interviewer:notes:";
const MAX_SESSION_HISTORY = 8;

type HintUsageState = {
  date: string;
  used: number;
  remaining: number;
  limit: number;
};

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

export async function loadDailyHintUsage(): Promise<HintUsageState> {
  const result = await chrome.storage?.local?.get?.(HINT_USAGE_KEY);
  const today = getTodayKey();
  const stored = result?.[HINT_USAGE_KEY];

  if (!stored || stored.date !== today) {
    return createHintUsageState(0);
  }

  return createHintUsageState(stored.used);
}

export async function consumeDailyHint(): Promise<HintUsageState & { allowed: boolean }> {
  const current = await loadDailyHintUsage();

  if (current.used >= DAILY_FREE_HINT_LIMIT) {
    return {
      ...current,
      allowed: false
    };
  }

  const nextUsed = current.used + 1;
  const nextState = createHintUsageState(nextUsed);

  await chrome.storage?.local?.set?.({
    [HINT_USAGE_KEY]: {
      date: nextState.date,
      used: nextState.used
    }
  });

  return {
    ...nextState,
    allowed: true
  };
}

export async function clearLocalData(): Promise<void> {
  const result = await chrome.storage?.local?.get?.(null);
  const keys = Object.keys(result ?? {}).filter((key) => {
    return (
      key === SESSION_KEY ||
      key === SESSION_HISTORY_KEY ||
      key === HINT_USAGE_KEY ||
      key.startsWith(NOTES_KEY_PREFIX)
    );
  });

  if (keys.length === 0) {
    return;
  }

  await chrome.storage?.local?.remove?.(keys);
}

function createHintUsageState(used: number): HintUsageState {
  return {
    date: getTodayKey(),
    used,
    remaining: Math.max(0, DAILY_FREE_HINT_LIMIT - used),
    limit: DAILY_FREE_HINT_LIMIT
  };
}

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNotesKey(problemUrl: string): string {
  return `${NOTES_KEY_PREFIX}${problemUrl}`;
}
