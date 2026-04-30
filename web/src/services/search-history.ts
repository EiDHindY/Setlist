// ── SEARCH HISTORY SERVICE ──────────────────────────────────────────
// Port of mobile/lib/services/search_history_service.dart
// Uses localStorage instead of shared_preferences

const STORAGE_KEY = 'setlist_search_history';
const MAX_HISTORY = 20;

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const history = getSearchHistory().filter((h) => h.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function removeSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const history = getSearchHistory().filter((h) => h !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
