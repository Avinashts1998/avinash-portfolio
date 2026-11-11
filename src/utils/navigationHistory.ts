// In-memory stack of visited routes within the app session
const historyStack: string[] = [];

// Initialize from sessionStorage if available
try {
  const saved = sessionStorage.getItem("app_history_stack");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      historyStack.push(...parsed);
    }
  }
} catch {}

function saveToSession() {
  try {
    sessionStorage.setItem("app_history_stack", JSON.stringify(historyStack.slice(-25)));
  } catch {}
}

export function pushHistoryPath(path: string) {
  if (!path) return;
  const last = historyStack[historyStack.length - 1];
  if (last !== path) {
    historyStack.push(path);
    saveToSession();
  }
}

export function popHistoryPath() {
  if (historyStack.length > 1) {
    historyStack.pop();
    saveToSession();
  }
}

export function replaceHistoryPath(path: string) {
  if (!path) return;
  if (historyStack.length > 0) {
    historyStack[historyStack.length - 1] = path;
  } else {
    historyStack.push(path);
  }
  saveToSession();
}

export function getPreviousPath(): string | null {
  if (historyStack.length >= 2) {
    return historyStack[historyStack.length - 2];
  }
  return null;
}

export function getHistoryLength(): number {
  return historyStack.length;
}
