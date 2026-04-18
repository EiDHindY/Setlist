import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> main() async {
  final query = "popular monster falling in reverse";
  final uri = Uri.parse('https://api.deezer.com/search').replace(queryParameters: {
    'q': query,
    'limit': '15',
  });
  
  try {
    final response = await http.get(uri);
    print("Status: ${response.statusCode}");
    if (response.statusCode != 200) return;

    final data = jsonDecode(response.body);
    if (data['data'] == null) {
      print("No data field");
      return;
    }
    
    final results = data['data'] as List;
    print("Results count: ${results.length}");
    
    for (var item in results) {
      if (item is Map<String, dynamic>) {
        final artistName = item['artist']?['name'] ?? 'Unknown Artist';
        final title = '${item['title']} - $artistName';
        
        final album = item['album'] as Map<String, dynamic>?;
        final artworkUrl = album != null ? album['cover_medium'] as String? : null;

        print("Song: $title | Art: $artworkUrl");
      } else {
        print("Item is not Map");
      }
    }
  } catch (e, stack) {
    print("Error: $e\n$stack");
  }
}
