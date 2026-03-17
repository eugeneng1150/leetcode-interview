import { extractProblemContext, isSupportedProblemPage } from "../lib/problem-page";
import { saveSessionSummary } from "../lib/session-storage";
import { renderInterviewPanel } from "../panel/index";

const PANEL_ID = "leetcode-interviewer-root";

bootstrap();

function bootstrap(): void {
  const url = new URL(window.location.href);

  if (!isSupportedProblemPage(url)) {
    return;
  }

  const context = extractProblemContext(document, url);

  if (!context) {
    return;
  }

  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    return;
  }

  const container = document.createElement("div");
  container.id = PANEL_ID;
  document.body.append(container);

  renderInterviewPanel(container, {
    context,
    onSessionComplete: saveSessionSummary
  });
}
