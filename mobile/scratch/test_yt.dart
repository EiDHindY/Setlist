import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main() async {
  final yt = YoutubeExplode();
  final search = await yt.search.search('linkin park numb');
  for (final video in search.take(5)) {
    print('Title: ${video.title}');
    print('Views: ${video.engagement.viewCount}');
    print('---');
  }
  yt.close();
}
