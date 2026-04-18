import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  final query = 'To the Flowers - While She Sleeps';
  final apiKey = 'AIzaSyACNXBBh1kBcxxYKV4R7YkIY1ulY_GVGBw';
  
  final uri = Uri.parse('https://www.googleapis.com/youtube/v3/search').replace(queryParameters: {
    'part': 'snippet',
    'q': query,
    'type': 'video',
    'videoCategoryId': '10', // Music
    'maxResults': '15',
    'key': apiKey,
  });

  final response = await http.get(uri);
  final data = jsonDecode(response.body);
  
  // We don't have the durations without calling the videos endpoint, but we can print titles
  final items = data['items'] as List?;
  if (items != null) {
    for (var item in items) {
      final snippet = item['snippet'];
      print('OFFICIAL: \${snippet['title']} [\${snippet['channelTitle']}] (\${item['id']['videoId']})');
    }
  } else {
    print('Failed: \$data');
  }
}
