const STORAGE_KEY = "tobetube-state-v1";
const HISTORY_LIMIT = 200;
const FAVORITES_LIMIT = 100;

const defaultState = Object.freeze({
  favorites: [],
  history: [],
  recentIds: [],
  selectedGenre: null,
  mode: "genre",
  theme: "system",
});

export function createStorage(storage = globalThis.localStorage) {
  function read() {
    try {
      const value = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null");
      return sanitizeState(value);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function write(nextState) {
    const safeState = sanitizeState(nextState);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(safeState));
    } catch {
      return false;
    }
    return true;
  }

  return { read, write };
}

export function sanitizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    favorites: uniqueStrings(source.favorites).slice(0, FAVORITES_LIMIT),
    history: uniqueStrings(source.history).slice(0, HISTORY_LIMIT),
    recentIds: uniqueStrings(source.recentIds).slice(0, 8),
    selectedGenre: typeof source.selectedGenre === "string" ? source.selectedGenre : null,
    mode: source.mode === "discovery" ? "discovery" : "genre",
    theme: ["system", "light", "dark"].includes(source.theme) ? source.theme : "system",
  };
}

function uniqueStrings(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === "string"))]
    : [];
}
