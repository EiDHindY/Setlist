import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main() async {
  final yt = YoutubeExplode();
  final query = 'To the Flowers - While She Sleeps';
  
  final searches = await Future.wait([
    yt.search.search(query),
    yt.search.search(query + ' official audio').catchError((_) => null),
  ]);

  final stdList = searches[0];
  final musicList = searches[1];

  final Map<String, Video> resultMap = {};

  if (stdList != null) {
    for (var video in stdList.take(30)) {
      resultMap.putIfAbsent(video.id.value, () => video);
      print('STD: ' + video.title + ' [' + video.author + '] (' + video.id.value + ')');
    }
  }

  if (musicList != null) {
    for (var video in (musicList as VideoSearchList).take(15)) {
      if (resultMap.containsKey(video.id.value)) {
        print('MUSIC (dup): ' + video.title + ' [' + video.author + ']');
      } else {
        resultMap.putIfAbsent(video.id.value, () => video);
        print('MUSIC (new): ' + video.title + ' [' + video.author + '] (' + video.id.value + ')');
      }
    }
  }

  print('Total unique: ' + resultMap.length.toString());
  yt.close();
}
