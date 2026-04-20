import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main() async {
  final yt = YoutubeExplode();
  final query = 'Jeff Buckley Hallelujah Topic';
  print('Searching for: $query');
  final result = await yt.search.search(query);
  for (var video in result.take(10)) {
    print('Title: ${video.title} | Author: ${video.author}');
  }
  yt.close();
}
