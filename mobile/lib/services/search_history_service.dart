import 'package:shared_preferences/shared_preferences.dart';

/// ── SEARCH HISTORY SERVICE ──────────────────────────────────────────
/// Manages a local list of recent search queries to provide personalized
/// suggestions.
class SearchHistoryService {
  static const String _storageKey = 'search_history';
  static const int _maxHistory = 100;

  static final SearchHistoryService _instance = SearchHistoryService._internal();
  factory SearchHistoryService() => _instance;
  SearchHistoryService._internal();

  /// Save a query to history. Moves it to top if already exists.
  /// Ignores URLs to keep the search history clean.
  Future<void> saveSearch(String query) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return;

    // Do not save URLs (e.g. YouTube links) into history
    final urlRegex = RegExp(r'^https?:\/\/[^\s]+$');
    if (urlRegex.hasMatch(cleanQuery)) return;

    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_storageKey) ?? [];

    // Remove old instance if exists to move it to the top
    history.removeWhere((item) => item.toLowerCase() == cleanQuery.toLowerCase());
    
    // Add to top
    history.insert(0, cleanQuery);

    // Trim to limit
    if (history.length > _maxHistory) {
      history.removeRange(_maxHistory, history.length);
    }

    await prefs.setStringList(_storageKey, history);
  }

  /// Get all history entries
  Future<List<String>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final rawHistory = prefs.getStringList(_storageKey) ?? [];
    
    // Filter out any existing URLs that might have been saved previously.
    final urlRegex = RegExp(r'^https?:\/\/[^\s]+$');
    return rawHistory.where((item) => !urlRegex.hasMatch(item)).toList();
  }

  /// Get history matches for a partial query
  Future<List<String>> getHistoryMatches(String query) async {
    if (query.trim().isEmpty) return [];
    
    final history = await getHistory();
    final lowerQuery = query.toLowerCase().trim();
    
    return history
        .where((item) => item.toLowerCase().contains(lowerQuery))
        .take(5)
        .toList();
  }

  /// Remove a specific entry
  Future<void> removeSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_storageKey) ?? [];
    history.removeWhere((item) => item.toLowerCase() == query.toLowerCase());
    await prefs.setStringList(_storageKey, history);
  }

  /// Clear everything
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}
