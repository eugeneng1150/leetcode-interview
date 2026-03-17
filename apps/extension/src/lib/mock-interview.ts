import type {
  HintRequest,
  HintResponse,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";

export async function requestHint(input: HintRequest): Promise<HintResponse> {
  const family = detectProblemFamily(`${input.problemTitle}\n${input.problemDescription}`);
  const hint = buildHint(family, input.hintLevel);
  const attemptSignal = input.userAttempt.trim().toLowerCase();
  const followUpQuestion = buildFollowUp(family, input.hintLevel, attemptSignal);

  return {
    hint,
    followUpQuestion
  };
}

export async function requestReview(input: ReviewRequest): Promise<ReviewResponse> {
  const family = detectProblemFamily(`${input.problemTitle}\n${input.approach}\n${input.code}`);
  const normalizedApproach = input.approach.trim().toLowerCase();
  const hasApproach = normalizedApproach.length > 0;
  const mentionsTradeoff =
    normalizedApproach.includes("complexity") ||
    normalizedApproach.includes("o(") ||
    normalizedApproach.includes("time") ||
    normalizedApproach.includes("space");
  const mentionsStructure = [
    "hash",
    "map",
    "stack",
    "queue",
    "pointer",
    "window",
    "bfs",
    "dfs",
    "dp",
    "binary"
  ].some((token) => normalizedApproach.includes(token));

  return {
    clarityFeedback: hasApproach
      ? mentionsStructure
        ? `You named a concrete strategy for this ${family} problem. Make the explanation interview-ready by stating why that structure is the right fit before implementation details.`
        : "Your notes show direction, but the core strategy is still implicit. Name the data structure or traversal first."
      : "You need at least a short high-level explanation of the approach before the review is useful.",
    timeComplexity: hasApproach
      ? mentionsTradeoff
        ? "You are considering complexity already. Tighten it by pointing to the dominant pass or lookup."
        : estimateComplexity(family)
      : "Unknown",
    spaceComplexity: hasApproach ? estimateSpaceComplexity(family) : "Unknown",
    improvementSuggestion: hasApproach
      ? mentionsTradeoff
        ? "State correctness before optimization. In an interview, explain why the invariant or lookup guarantees the result."
        : `Add one sentence on why the ${family}-style approach is correct, then one sentence on its time and space cost.`
      : "Write 2 to 3 lines describing the intended algorithm, then request review again."
  };
}

function detectProblemFamily(source: string): string {
  const text = source.toLowerCase();

  if (hasAny(text, ["grid", "matrix", "island", "board"])) return "grid";
  if (hasAny(text, ["tree", "binary tree", "bst", "node"])) return "tree";
  if (hasAny(text, ["graph", "path", "course", "flight"])) return "graph";
  if (hasAny(text, ["substring", "window", "anagram"])) return "sliding window";
  if (hasAny(text, ["linked list", "listnode"])) return "linked list";
  if (hasAny(text, ["interval", "meeting", "merge"])) return "interval";
  if (hasAny(text, ["prefix", "subarray", "sum"])) return "array";
  if (hasAny(text, ["sorted", "binary search"])) return "binary search";
  if (hasAny(text, ["parentheses", "stack"])) return "stack";
  if (hasAny(text, ["dynamic programming", "dp", "memo"])) return "dynamic programming";
  return "array";
}

function buildHint(family: string, level: number): string {
  const clampedLevel = Math.max(1, Math.min(3, level));

  if (clampedLevel === 1) {
    return (
      {
      array:
        "Start with the simplest pass you could explain out loud. What are you tracking as you scan the input?",
      grid: "Decide how you will move through the grid without revisiting the same state twice.",
      tree: "Name the traversal you want first. Are you reasoning top-down or bottom-up?",
      graph: "Ask whether this is a traversal problem, a shortest-path problem, or a reachability problem.",
      "sliding window":
        "Ask what condition makes the current window valid and what should happen when it becomes invalid.",
      "linked list":
        "Before coding, decide whether one pointer, two pointers, or pointer rewiring is the core move.",
      interval: "Sort or ordering is often the first decision. What order makes the merge logic obvious?",
      "binary search":
        "Define the monotonic condition first. What tells you the answer is on the left vs right side?",
      stack: "Identify what information should stay available from previous elements while you scan forward.",
      "dynamic programming":
        "Write down the state in one sentence. What smaller subproblem would let you build the answer?"
      }[family] ??
      "Start with the simplest pass you could explain out loud. What are you tracking as you scan the input?"
    );
  }

  if (clampedLevel === 2) {
    return (
      {
      array:
        "Look for a way to trade nested work for constant-time lookup, running state, or two moving indices.",
      grid: "Use either DFS/BFS or directional simulation, but pair it with a visited rule you can explain clearly.",
      tree: "Focus on what each recursive call returns or what each queue entry represents.",
      graph: "Choose BFS if you need level-by-level guarantees; choose DFS if the structure matters more than distance.",
      "sliding window":
        "Keep one side expanding and only move the other side when the window violates the rule you defined.",
      "linked list":
        "Sketch pointer movement step by step before writing code so you never lose the rest of the list.",
      interval:
        "After sorting, the key question is whether the current interval overlaps the last committed interval.",
      "binary search":
        "Binary search the answer space only if you can evaluate a midpoint with a true/false condition.",
      stack:
        "The stack should hold unresolved items. Ask what event lets you pop and finalize an answer.",
      "dynamic programming":
        "Decide whether memoization or tabulation makes the recurrence easier to explain in an interview."
      }[family] ??
      "Look for a way to trade nested work for constant-time lookup, running state, or two moving indices."
    );
  }

  return (
    {
    array:
      "Once the core pass works, ask if you can state the invariant that makes each lookup or pointer move safe.",
    grid: "The usual bug is double counting or stepping out of bounds. Explain how your visited logic prevents both.",
    tree: "State the base case and the information passed between parent and child explicitly before coding.",
    graph: "Track exactly what gets marked visited and when. That usually decides whether the traversal is correct.",
    "sliding window":
      "The optimization usually depends on each index entering and leaving the window at most once.",
    "linked list":
      "Say out loud which pointer changes first, second, and third. That order is where linked-list bugs happen.",
    interval:
      "The optimization is not in the loop itself, but in making the overlap rule and merged state explicit.",
    "binary search":
      "Your final explanation should justify the loop condition, midpoint update, and why the boundary converges.",
    stack:
      "The stack invariant should explain why each element is pushed once and popped at most once.",
    "dynamic programming":
      "If the recurrence is right, the last improvement is usually reducing extra recomputation or storage."
    }[family] ??
    "Once the core pass works, ask if you can state the invariant that makes each lookup or pointer move safe."
  );
}

function buildFollowUp(family: string, level: number, attempt: string): string {
  if (!attempt) {
    return `What is your first concrete ${family} approach before you ask for another hint?`;
  }

  if (level === 1) {
    return `Can you explain the invariant for your current ${family} approach in one sentence?`;
  }

  if (level === 2) {
    return `What is the bottleneck in your current ${family} idea, and what state would remove it?`;
  }

  return `If you had to justify correctness to an interviewer, what is the key reason your ${family} approach works?`;
}

function estimateComplexity(family: string): string {
  switch (family) {
    case "array":
    case "sliding window":
    case "linked list":
    case "interval":
      return "Likely O(n) or O(n log n) depending on whether sorting is required.";
    case "grid":
    case "tree":
    case "graph":
      return "Likely linear in the number of reachable states or edges you traverse.";
    case "binary search":
      return "Likely O(log n) if the midpoint check is constant time.";
    case "stack":
      return "Usually O(n) if each element is pushed and popped at most once.";
    case "dynamic programming":
      return "Depends on state count times transition cost. State that product explicitly.";
    default:
      return "State the dominant pass, lookup, or sort to justify complexity.";
  }
}

function estimateSpaceComplexity(family: string): string {
  switch (family) {
    case "array":
    case "sliding window":
    case "interval":
      return "Call out whether you need extra lookup storage or if the scan is otherwise O(1) auxiliary space.";
    case "grid":
    case "graph":
    case "tree":
      return "Include visited structures, recursion depth, or queue size in the space argument.";
    case "linked list":
      return "If you only move pointers, auxiliary space may stay O(1).";
    case "binary search":
      return "Usually O(1) unless your midpoint check allocates extra state.";
    case "stack":
      return "Count the stack itself if it can grow with input size.";
    case "dynamic programming":
      return "Space usually matches the state table unless you can compress dimensions.";
    default:
      return "Call out every extra structure besides the input.";
  }
}

function hasAny(source: string, tokens: string[]): boolean {
  return tokens.some((token) => source.includes(token));
}
