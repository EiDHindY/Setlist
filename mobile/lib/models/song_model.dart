class Song {
  final String id;
  final String title;
  final String artist;
  final String albumArt;
  final Duration duration;
  final String? url;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.albumArt,
    required this.duration,
    this.url,
  });

  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return "$minutes:${seconds.toString().padLeft(2, '0')}";
  }
}
