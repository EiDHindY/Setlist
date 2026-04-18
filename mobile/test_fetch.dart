import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> main() async {
  // Let's just fetch songs for ALL users if there is an endpoint, or save a test song and fetch
  final userId = "test-user-id";
  
  // Save a song
  final saveUrl = Uri.parse('http://localhost:5169/api/library/save');
  final payload = {
      'userId': userId,
      'youTubeId': 'testVideo',
      'title': 'Test Song',
      'artist': 'Test Artist',
      'albumArtUrl': 'https://test.com',
      'duration': 120
  };
  print("Saving...");
  final postRes = await http.post(saveUrl, body: jsonEncode(payload), headers: {'Content-Type': 'application/json'});
  print("Save Status: \${postRes.statusCode}");
  print("Save Body: \${postRes.body}");
  
  // Fetch songs
  final getUrl = Uri.parse('http://localhost:5169/api/library/songs/\$userId');
  print("Fetching...");
  final getRes = await http.get(getUrl);
  print("Get Status: \${getRes.statusCode}");
  print("Get Body: \${getRes.body}");
}
