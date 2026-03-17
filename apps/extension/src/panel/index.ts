import {
  DAILY_FREE_HINT_LIMIT,
  type ProblemContext,
  type SessionSummary
} from "@leetcode-interviewer/shared";

type PanelOptions = {
  context: ProblemContext;
  onSessionComplete(summary: SessionSummary): Promise<void>;
};

export function renderInterviewPanel(container: HTMLElement, options: PanelOptions): void {
  const root = document.createElement("aside");
  root.dataset.role = "interview-panel";
  root.style.position = "fixed";
  root.style.top = "16px";
  root.style.right = "16px";
  root.style.width = "320px";
  root.style.zIndex = "2147483647";
  root.style.padding = "16px";
  root.style.borderRadius = "16px";
  root.style.background = "#101828";
  root.style.color = "#f8fafc";
  root.style.boxShadow = "0 20px 40px rgba(15, 23, 42, 0.35)";
  root.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";

  const title = document.createElement("h2");
  title.textContent = "Interview Mode";
  title.style.margin = "0 0 8px";

  const problem = document.createElement("p");
  problem.textContent = options.context.problemTitle;
  problem.style.margin = "0 0 12px";
  problem.style.color = "#cbd5e1";

  const timer = document.createElement("p");
  timer.textContent = "00:00";
  timer.style.margin = "0 0 12px";

  const notes = document.createElement("textarea");
  notes.placeholder = "Talk through your approach...";
  notes.rows = 6;
  notes.style.width = "100%";
  notes.style.marginBottom = "12px";

  const hintButton = document.createElement("button");
  hintButton.textContent = `Get Hint (0/${DAILY_FREE_HINT_LIMIT})`;
  hintButton.type = "button";
  hintButton.style.marginRight = "8px";

  const reviewButton = document.createElement("button");
  reviewButton.textContent = "Review My Attempt";
  reviewButton.type = "button";

  const status = document.createElement("p");
  status.textContent = "Ready to start.";
  status.style.margin = "12px 0 0";
  status.style.color = "#cbd5e1";

  let elapsedSeconds = 0;
  let hintCount = 0;
  let reviewRequested = false;

  const intervalId = window.setInterval(() => {
    elapsedSeconds += 1;
    timer.textContent = formatElapsed(elapsedSeconds);
  }, 1000);

  hintButton.addEventListener("click", () => {
    if (hintCount >= DAILY_FREE_HINT_LIMIT) {
      status.textContent = "Daily hint limit reached.";
      return;
    }

    hintCount += 1;
    hintButton.textContent = `Get Hint (${hintCount}/${DAILY_FREE_HINT_LIMIT})`;
    status.textContent = `Hint requested at level ${hintCount}.`;
  });

  reviewButton.addEventListener("click", async () => {
    if (reviewRequested) {
      status.textContent = "Review already requested for this session.";
      return;
    }

    reviewRequested = true;
    status.textContent = "Session saved for review.";

    const now = new Date().toISOString();
    await options.onSessionComplete({
      problemUrl: options.context.problemUrl,
      problemTitle: options.context.problemTitle,
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      endedAt: now,
      modeEnabled: true,
      hintCount,
      reviewRequested
    });
  });

  root.append(title, problem, timer, notes, hintButton, reviewButton, status);
  container.append(root);

  window.addEventListener(
    "beforeunload",
    () => {
      window.clearInterval(intervalId);
    },
    { once: true }
  );
}

function formatElapsed(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
