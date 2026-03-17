export type EditorSnapshot = {
  code: string;
  source: "monaco-model" | "textarea" | "code-block" | "visible-lines";
};

type MonacoModel = {
  getValue(): string;
};

type MonacoApi = {
  editor?: {
    getModels?: () => MonacoModel[];
  };
};

export function extractEditorSnapshot(doc: Document, win: Window = window): EditorSnapshot | null {
  const fromMonaco = readFromMonacoModel(win);
  if (fromMonaco) {
    return fromMonaco;
  }

  const fromTextarea = readFromEditorTextarea(doc);
  if (fromTextarea) {
    return fromTextarea;
  }

  const fromCodeBlock = readFromCodeBlock(doc);
  if (fromCodeBlock) {
    return fromCodeBlock;
  }

  const fromVisibleLines = readFromVisibleEditorLines(doc);
  if (fromVisibleLines) {
    return fromVisibleLines;
  }

  return null;
}

function readFromMonacoModel(win: Window): EditorSnapshot | null {
  const monaco = (win as Window & { monaco?: MonacoApi }).monaco;
  const models = monaco?.editor?.getModels?.();
  if (!Array.isArray(models) || models.length === 0) {
    return null;
  }

  for (const model of models) {
    const value = model?.getValue?.().trim();
    if (looksLikeCode(value)) {
      return {
        code: value,
        source: "monaco-model"
      };
    }
  }

  return null;
}

function readFromEditorTextarea(doc: Document): EditorSnapshot | null {
  const selectors = [
    "textarea[data-mode-id]",
    ".monaco-editor textarea",
    "textarea.inputarea",
    "textarea[spellcheck='false']",
    "textarea"
  ];

  for (const selector of selectors) {
    const candidates = Array.from(doc.querySelectorAll<HTMLTextAreaElement>(selector));
    for (const textarea of candidates) {
      const value = textarea.value.trim();
      if (looksLikeCode(value)) {
        return {
          code: value,
          source: "textarea"
        };
      }
    }
  }

  return null;
}

function readFromCodeBlock(doc: Document): EditorSnapshot | null {
  const selectors = [
    "[data-track-load='code_editor'] pre",
    "[data-track-load='code_editor'] code",
    "[class*='code-area'] pre",
    "[class*='editor'] pre",
    "[class*='editor'] code"
  ];

  for (const selector of selectors) {
    const blocks = Array.from(doc.querySelectorAll<HTMLElement>(selector));
    for (const block of blocks) {
      const value = normalizeCodeText(block.innerText || block.textContent || "");
      if (looksLikeCode(value)) {
        return {
          code: value,
          source: "code-block"
        };
      }
    }
  }

  return null;
}

function readFromVisibleEditorLines(doc: Document): EditorSnapshot | null {
  const containers = Array.from(doc.querySelectorAll<HTMLElement>(".monaco-editor .view-lines"));

  for (const container of containers) {
    const lines = Array.from(container.querySelectorAll<HTMLElement>(".view-line"))
      .map((line) => normalizeCodeText(line.innerText || line.textContent || ""))
      .filter(Boolean);

    if (lines.length === 0) {
      continue;
    }

    const value = lines.join("\n").trim();
    if (looksLikeCode(value)) {
      return {
        code: value,
        source: "visible-lines"
      };
    }
  }

  return null;
}

function looksLikeCode(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const text = value.trim();
  if (text.length < 8) {
    return false;
  }

  return (
    text.includes("\n") ||
    /[{}();=<>]/.test(text) ||
    /\b(function|class|const|let|var|def|public|private|return|if|for|while)\b/.test(text)
  );
}

function normalizeCodeText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").trim();
}
