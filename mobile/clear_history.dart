import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  final prefs = await SharedPreferences.getInstance();
  final history = prefs.getStringList('search_history') ?? [];
  final cleanHistory = history.where((h) => !h.startsWith('http')).toList();
  await prefs.setStringList('search_history', cleanHistory);
  print('Cleaned history!');
}
