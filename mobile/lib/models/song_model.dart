/// ── SONG MODEL ─────────────────────────────────────────────────────
/// Represents a song in the user's collection.
/// Links to a YouTube video for playback via `youtubeVideoId`.

class SongVersion {
  final String id;
  final String youtubeVideoId;
  final String title;
  final String? channelName;
  final String? thumbnailUrl;
  final Duration duration;

  SongVersion({
    required this.id,
    required this.youtubeVideoId,
    required this.title,
    this.channelName,
    this.thumbnailUrl,
    required this.duration,
  });

  factory SongVersion.fromJson(Map<String, dynamic> json) {
    return SongVersion(
      id: json['id'] as String,
      youtubeVideoId: json['youTubeId'] as String? ?? '', // Match backend camelCase property
      title: json['title'] as String? ?? 'Unknown Version',
      channelName: json['channelName'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      duration: Duration(seconds: json['duration'] as int? ?? 0),
    );
  }
}

class Song {
  final String id;
  final String title;
  final String artist;
  final String albumArt;
  final Duration duration;
  final String? url;
  
  // Versions replace the single youtubeVideoId, but we can provide a helper accessor
  final List<SongVersion> versions;

  String? get youtubeVideoId => versions.isNotEmpty ? versions.first.youtubeVideoId : null;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.albumArt,
    required this.duration,
    this.url,
    this.versions = const [],
  });

  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return "$minutes:${seconds.toString().padLeft(2, '0')}";
  }

  /// Create a Song from a JSON map (e.g., from Supabase or backend)
  factory Song.fromJson(Map<String, dynamic> json) {
    return Song(
      id: json['id'] as String,
      title: json['title'] as String,
      artist: json['artist'] as String,
      albumArt: json['album_art'] as String? ?? '',
      duration: Duration(seconds: json['duration_seconds'] as int? ?? 0),
      url: json['url'] as String?,
      versions: json['versions'] != null 
          ? (json['versions'] as List).map((v) => SongVersion.fromJson(v)).toList()
          : [],
    );
  }

  /// Convert this Song to a JSON map (e.g., for saving to Supabase)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'album_art': albumArt,
      'duration_seconds': duration.inSeconds,
      'url': url,
      'versions': versions.map((v) => {
        'id': v.id,
        'youTubeId': v.youtubeVideoId,
        'title': v.title,
      }).toList(),
    };
  }
}
