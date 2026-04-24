import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/song_model.dart';
import '../services/youtube_search_service.dart';
import '../config/app_config.dart';

class LibraryService {
  static String get _baseUrl => '${AppConfig.baseUrl}/library';

  static final LibraryService _instance = LibraryService._internal();
  factory LibraryService() => _instance;
  LibraryService._internal();

  List<Song> _cachedSongs = [];
  bool _isCacheFresh = false;
  bool _isSyncing = false;

  final _songsController = StreamController<List<Song>>.broadcast();
  Stream<List<Song>> get songsStream => _songsController.stream;
  
  final _syncController = StreamController<bool>.broadcast();
  Stream<bool> get syncStream => _syncController.stream;

  bool get isSyncing => _isSyncing;

  /// Fetches the user's library songs from the cloud.
  Future<List<Song>> fetchLibrarySongs() async {
    _isSyncing = true;
    _syncController.add(true);

    // Push cached songs immediately if available to any listeners
    if (_cachedSongs.isNotEmpty) {
      _songsController.add(_cachedSongs);
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      _isSyncing = false;
      _syncController.add(false);
      return [];
    }

    try {
      final response = await http.get(Uri.parse('$_baseUrl/songs/$userId'))
          .timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        _cachedSongs = data.map<Song>((json) {
          return Song(
            id: json['id'].toString(),
            title: json['title'] ?? 'Unknown Title',
            artist: json['artist'] ?? 'Unknown Artist',
            albumArt: json['albumArtUrl'] ?? '',
            duration: Duration(seconds: json['duration'] ?? 0),
            versions: json['versions'] != null 
                ? (json['versions'] as List).map((v) => SongVersion.fromJson(v)).toList()
                : [],
          );
        }).toList();
        
        _isCacheFresh = true;
      }
    } catch (e) {
      print('🛑 Library Fetch Error: $e');
    }
    
    _isSyncing = false;
    _syncController.add(false);
    _songsController.add(_cachedSongs); // Always emit to unblock UI
    return _cachedSongs;
  }

  /// Saves only the Master Song metadata to the cloud library (Decoupled Phase 1).
  Future<Song?> saveMasterSong(SearchSuggestion suggestion) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return null;

    final requestData = {
      'userId': userId,
      'appleTrackId': suggestion.appleTrackId,
      'title': suggestion.songTitle ?? suggestion.text.split(' - ').first,
      'artist': suggestion.subtitle ?? suggestion.text.split(' - ').last,
      'albumArtUrl': suggestion.imageUrl,
      'duration': 0, // Master duration placeholder
    };

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/save'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestData),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final newSong = Song(
          id: data['id'].toString(),
          title: data['title'] ?? suggestion.songTitle,
          artist: data['artist'] ?? suggestion.subtitle,
          albumArt: data['albumArtUrl'] ?? suggestion.imageUrl ?? '',
          duration: Duration(seconds: data['duration'] ?? 0),
          versions: data['versions'] != null 
              ? (data['versions'] as List).map((v) => SongVersion.fromJson(v)).toList()
              : [],
        );
        
        // Optimistic cache update
        if (!_cachedSongs.any((s) => s.id == newSong.id)) {
           _cachedSongs.insert(0, newSong);
           _songsController.add(_cachedSongs);
        }
        
        _isCacheFresh = true; 
        return newSong;
      }
    } catch (e) {
      print('🛑 Master Song Save Error: $e');
    }
    return null;
  }

  /// Attaches a YouTube version to a Master Song (Decoupled Phase 2).
  /// Attaches a YouTube version to a Master Song (Decoupled Phase 2).
  Future<bool> saveVersion({
    required String songId,
    required YouTubeSearchResult result,
  }) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return false;

    final requestData = {
      'userId': userId,
      'songId': songId,
      'youTubeId': result.videoId,
      'versionTitle': result.title,
      'channelName': result.channelName,
      'thumbnailUrl': result.thumbnailUrl,
      'duration': result.duration?.inSeconds ?? 0,
    };

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/save/version'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestData),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Find and update the song in cache to reflect the new version instantly
        final index = _cachedSongs.indexWhere((s) => s.id == songId);
        if (index != -1) {
          final updatedSong = _cachedSongs[index].copyWith(
            versions: [..._cachedSongs[index].versions, SongVersion.fromYouTubeResult(result)],
          );
          _cachedSongs[index] = updatedSong;
          _songsController.add(_cachedSongs);
        }

        _isCacheFresh = true;
        return true;
      }
    } catch (e) {
      print('🛑 Version Save Error: $e');
    }
    return false;
  }

  /// Removes a song from the user's library (Soft Delete).
  Future<bool> removeSongFromLibrary(String songId) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return false;

    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/songs/$userId/$songId'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        _isCacheFresh = false;
        return true;
      }
    } catch (e) {
      print('🛑 Library Remove Error: $e');
    }
    return false;
  }

  /// DEPRECATED: Use saveMasterSong or saveVersion instead.
  Future<bool> saveToLibrary(YouTubeSearchResult result, {SearchSuggestion? premiumMetadata}) async {
    // Keeping this for short-term compatibility during search screen refactor
    if (premiumMetadata != null) {
      final song = await saveMasterSong(premiumMetadata);
      return song != null;
    }
    return false;
  }

  int _parseDurationToSeconds(String durationStr) {
    if (durationStr.isEmpty) return 0;
    try {
      final parts = durationStr.split(':');
      if (parts.length == 2) {
        return int.parse(parts[0]) * 60 + int.parse(parts[1]);
      } else if (parts.length == 3) {
        return int.parse(parts[0]) * 3600 + int.parse(parts[1]) * 60 + int.parse(parts[2]);
      }
    } catch (_) {}
    return 0;
  }

  List<Song> get cachedSongs => _cachedSongs;
  bool get isCacheFresh => _isCacheFresh;
}
