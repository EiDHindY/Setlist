import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youtube_explode_dart/youtube_explode_dart.dart';
import '../config/app_config.dart';

/// ── YOUTUBE SEARCH SERVICE ─────────────────────────────────────────

enum SuggestionType { artist, song, history, global }

class SearchSuggestion {
  final String text;
  final SuggestionType type;
  final String? subtitle;
  final String? imageUrl;
  final String? songTitle;
  final String? appleTrackId;
  final bool isOfficial;

  SearchSuggestion(this.text, this.type, {this.subtitle, this.imageUrl, this.songTitle, this.appleTrackId, this.isOfficial = false});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SearchSuggestion &&
          text.toLowerCase() == other.text.toLowerCase();

  @override
  int get hashCode => text.toLowerCase().hashCode;
}

class YouTubeSearchResult {
  final String videoId;
  final String title;
  final String channelName;
  final String? channelId;
  final String thumbnailUrl;
  final Duration? duration;
  final int viewCount;
  final bool isOfficial;
  final String? description;

  YouTubeSearchResult({
    required this.videoId,
    required this.title,
    required this.channelName,
    this.channelId,
    required this.thumbnailUrl,
    this.duration,
    this.viewCount = 0,
    this.isOfficial = false,
    this.description,
  });
}

abstract class YouTubeSearchService {
  Future<List<YouTubeSearchResult>> search(String query, {int maxResults = 15, String? songTitle, String? artistName});
  Future<List<YouTubeSearchResult>> loadMore({int maxResults = 15});
  Future<YouTubeSearchResult?> getVideoDetails(String videoId);
  Future<List<SearchSuggestion>> getSuggestions(String query);
  Future<String?> getChannelIcon(String channelId);

  static final Map<String, String> channelIconCache = {};

  static String? extractVideoId(String url) {
    try {
      final videoId = VideoId.parseVideoId(url);
      return videoId;
    } catch (e) {
      return null;
    }
  }

  factory YouTubeSearchService() {
    if (AppConfig.isVip) {
      return ExplodeSearchService();
    }
    return OfficialSearchService();
  }
}

// ── MIXIN FOR ITUNES LOOKUP ────────────────────────────────────────

// ── MIXIN FOR MUSIC LOOKUP (iTunes + Deezer) ─────────────────────

mixin MusicDataMixin {
  bool _isArabic(String text) {
    return RegExp(r'[\u0600-\u06FF]').hasMatch(text);
  }

  Future<List<SearchSuggestion>> fetchITunesSuggestions(String query) async {
    if (query.trim().length < 2) return [];
    
    // Adaptive Store Selection
    // If user types in Arabic, search the Egypt store for native metadata.
    // If user types in Latin, search the US store for original western names.
    final bool useArabic = _isArabic(query);
    final String country = useArabic ? 'eg' : 'us';
    final String lang = useArabic ? 'ar_eg' : 'en_us';

    try {
      final uri = Uri.parse('https://itunes.apple.com/search').replace(queryParameters: {
        'term': query,
        'entity': 'song',
        'limit': '15',
        'country': country,
        'lang': lang,
      });
      final response = await http.get(uri);
      if (response.statusCode != 200) return [];

      final data = jsonDecode(response.body);
      final results = data['results'] as List;
      
      final List<SearchSuggestion> suggestions = [];
      for (var item in results) {
        if (item['wrapperType'] == 'track') {
          final title = '${item['trackName']} - ${item['artistName']}';
          final artworkUrl = item['artworkUrl100'] as String?;
          suggestions.add(SearchSuggestion(
            title, 
            SuggestionType.song, 
            subtitle: item['artistName'],
            imageUrl: artworkUrl,
            songTitle: item['trackName'] as String?,
            appleTrackId: item['trackId']?.toString(),
            isOfficial: true, // iTunes songs are essentially always 'Official' compared to YT noise
          ));
        }
      }
      return suggestions;
    } catch (e) {
      return [];
    }
  }

  Future<List<SearchSuggestion>> fetchDeezerSuggestions(String query) async {
    if (query.trim().length < 2) return [];

    final bool useArabic = _isArabic(query);
    final Map<String, String> headers = {
      'Accept-Language': useArabic ? 'ar-EG,ar;q=0.9' : 'en-US,en;q=0.9',
    };

    try {
      final uri = Uri.parse('https://api.deezer.com/search').replace(queryParameters: {
        'q': query,
        'limit': '15',
      });
      final response = await http.get(uri, headers: headers);

      if (response.statusCode != 200) return [];

      final data = jsonDecode(response.body);
      if (data['data'] == null) {
        return [];
      }
      final results = data['data'] as List;
      
      final List<SearchSuggestion> suggestions = [];
      for (var item in results) {
        if (item is Map<String, dynamic>) {
          final artist = item['artist'] is Map ? item['artist'] as Map : null;
          final artistName = artist != null ? artist['name']?.toString() ?? 'Unknown Artist' : 'Unknown Artist';
          final title = '${item['title']} - $artistName';
          
          final album = item['album'] is Map ? item['album'] as Map : null;
          final artworkUrl = album != null ? album['cover_medium']?.toString() : null;

          suggestions.add(SearchSuggestion(
            title, 
            SuggestionType.song, 
            subtitle: artistName, // Subtle indicator removed after verification
            imageUrl: artworkUrl,
            songTitle: item['title']?.toString(),
            appleTrackId: 'dz_${item['id']}', // Deezer track ID
            isOfficial: true, // Deezer songs are essentially always 'Official'
          ));
        }
      }
      return suggestions;
    } catch (e) {
      return [];
    }
  }

  Future<List<SearchSuggestion>> fetchCombinedSuggestions(String query) async {
    if (query.trim().isEmpty) return [];

    final results = await Future.wait([
      fetchITunesSuggestions(query),
      fetchDeezerSuggestions(query),
    ]);

    final itunes = results[0];
    final deezer = results[1];

    final List<SearchSuggestion> combined = [];
    final int maxLength = itunes.length > deezer.length ? itunes.length : deezer.length;
    
    // Interleave results to ensure both sources are visible in top results
    for (int i = 0; i < maxLength; i++) {
      if (i < deezer.length) combined.add(deezer[i]);
      if (i < itunes.length) combined.add(itunes[i]);
    }

    // Deduplicate by text (favoring the one that came first in our interleaved list)
    final Map<String, SearchSuggestion> mergedMap = {};
    for (final s in combined) {
      mergedMap.putIfAbsent(s.text.toLowerCase(), () => s);
    }

    return mergedMap.values.toList();
  }

  /// Assigns a priority score based on:
  ///   1. Song + Artist match (Fuzzy)
  ///   2. Song Name match
  ///   3. Artist Name match
  int calculateRelevanceScore(YouTubeSearchResult result, String query) {
    int score = 0;
    final titleLower = result.title.toLowerCase();
    final channelLower = result.channelName.toLowerCase();
    
    final titleNorm = _normalize(result.title);
    final channelNorm = _normalize(result.channelName);
    final queryLower = query.toLowerCase().trim();

    // ── QUERY PARSING ───────────────────────────────────────────
    final separators = [' - ', ' – ', ' by ', ':', '|'];
    String? songPart;
    String? artistPart;

    for (final sep in separators) {
      if (queryLower.contains(sep)) {
        final parts = queryLower.split(sep);
        songPart = parts[0].trim();
        artistPart = parts.length > 1 ? parts[1].trim() : null;
        break;
      }
    }

    // Default: treat whole query as song part if no separator
    songPart ??= queryLower;
    final songNorm = _normalize(songPart);
    final artistNorm = artistPart != null ? _normalize(artistPart) : null;

    // ── HIERARCHICAL SCORING ─────────────────────────────────────
    
    // TIER 1 (+10,000): Song + Artist Match
    if (artistNorm != null && songNorm.isNotEmpty &&
        titleNorm.contains(songNorm) && 
        (titleNorm.contains(artistNorm) || channelNorm.contains(artistNorm))) {
      score += 10000;
    }
    // TIER 2 (+5,000): Song Name Match
    else if (songNorm.isNotEmpty && titleNorm.contains(songNorm)) {
      score += 5000;
    }
    // TIER 3 (+1,000): Artist Name Match
    else if (artistNorm != null && (titleNorm.contains(artistNorm) || channelNorm.contains(artistNorm))) {
      score += 1000;
    }
    // Tier 4: Partial word matches (Fuzzy fallback)
    else {
      final queryWords = queryLower.split(RegExp(r'\s+')).where((w) => w.length > 2).toList();
      if (queryWords.isNotEmpty) {
        final matchCount = queryWords.where((w) => titleLower.contains(w) || channelLower.contains(w)).length;
        score += (matchCount / queryWords.length * 500).round();
      }
    }

    // ── TIEBREAKERS ──
    if (channelLower.endsWith('- topic')) score += 1000;
    if (titleLower.contains('official audio')) score += 500;
    if (titleLower.contains('official video')) score += 600;

    // ── PENALTIES ──
    if (titleLower.contains('reaction')) score -= 2000;
    if (titleLower.contains('cover')) score -= 1000;

    // ── VIEWS WEIGHTING (Primary Priority for matching results) ──
    // 1 Million views = ~5,000 points.
    // 10 Million views = ~50,000 points.
    // This allows popular versions to dominate the top results if they match the query well.
    score += (result.viewCount / 200).round().clamp(0, 100000); 

    return score;
  }

  String _normalize(String s) {
    // Simpler, safer normalization to avoid stripping everything
    return s.toLowerCase()
            .replaceAll(RegExp(r'[^a-z0-9\s]'), '') // Only keep letters, numbers, and spaces
            .replaceAll(RegExp(r'\s+'), ' ')       // Normalize spaces
            .trim();
  }

  double _getTokenOverlap(String metadataTitle, String resultTitle) {
    final mTokens = metadataTitle.toLowerCase().split(RegExp(r'\s+')).where((t) => t.length > 1).toSet();
    final rTokens = resultTitle.toLowerCase().split(RegExp(r'\s+')).where((t) => t.length > 1).toSet();
    if (mTokens.isEmpty) return 0;
    final intersection = mTokens.intersection(rTokens);
    return intersection.length / mTokens.length;
  }

  bool _isOfficialChannel(String channelName, String? artistName) {
    final cName = channelName.toLowerCase();
    if (artistName == null) return cName.contains('topic');
    final aName = artistName.toLowerCase();
    
    // Direct matches or Topic channels that contain the artist name
    if ((cName.contains(aName) && cName.contains('topic')) || 
        cName == aName || 
        cName.contains('$aName official') ||
        cName.contains('$aName vevo')) {
      return true;
    }

    // Common artist channel suffixes (e.g. starsetonline, band, music)
    final commonSuffixes = ['online', 'music', 'tv', 'channel', 'band'];
    for (final suffix in commonSuffixes) {
      if (cName == '$aName$suffix' || cName == '$aName $suffix') return true;
    }

    return false;
  }
}

// ── VIP: youtube_explode_dart ───────────────────

class ExplodeSearchService with MusicDataMixin implements YouTubeSearchService {
  final YoutubeExplode _yt = YoutubeExplode();
  VideoSearchList? _currentSearchList;

  Future<List<Video>> _fetchDeep(String query, int pages) async {
    final List<Video> combinedResults = [];
    try {
      VideoSearchList? currentList = await _yt.search.search(query);
      int pageCount = 0;
      while (currentList != null && pageCount < pages) {
        combinedResults.addAll(currentList);
        currentList = await currentList.nextPage();
        pageCount++;
      }
    } catch (_) {
      // Fallback if search fails
    }
    return combinedResults;
  }

  @override
  Future<List<YouTubeSearchResult>> search(String query, {int maxResults = 15, String? songTitle, String? artistName}) async {
    final searchTasks = <Future<List<Video>>>[];
    
    // Determine if the user manually typed something different than the default automated query
    final defaultQuery = (songTitle != null && artistName != null) ? "$artistName $songTitle" : "";
    final isCustomQuery = query.isNotEmpty && query.trim().toLowerCase() != defaultQuery.toLowerCase();

    if (isCustomQuery) {
      // Respect manual user input 100%
      searchTasks.add(_fetchDeep(query, 2));
    } else if (songTitle != null && artistName != null) {
      // Focus on the Topic version and a general search
      searchTasks.add(_fetchDeep('$artistName $songTitle Topic', 2));
      searchTasks.add(_fetchDeep('$artistName $songTitle', 1));
    } else {
      searchTasks.add(_fetchDeep(query, 1));
    }

    final searches = await Future.wait(searchTasks);
    final resultMap = <String, YouTubeSearchResult>{};

    YouTubeSearchResult toResult(Video video) {
      return YouTubeSearchResult(
        videoId: video.id.value,
        title: video.title,
        channelName: video.author,
        channelId: video.channelId.value,
        thumbnailUrl: video.thumbnails.highResUrl,
        duration: video.duration,
        viewCount: video.engagement.viewCount,
        isOfficial: _isOfficialChannel(video.author, artistName),
      );
    }

    for (final list in searches) {
      for (final video in list) {
        resultMap.putIfAbsent(video.id.value, () => toResult(video));
      }
    }

    List<YouTubeSearchResult> allResults = resultMap.values.toList();

    // PRECISION FILTERING: Only apply if we used the automated query
    if (songTitle != null && !isCustomQuery) {
      final normSong = _normalize(songTitle);
      final songTokens = normSong.split(' ').where((t) => t.length > 2).toList();
      
      final filtered = allResults.where((r) {
        final normResult = _normalize(r.title);
        
        // 1. Direct contains check
        if (normResult.contains(normSong)) return true;
        
        // 2. Keyword check: At least one major word from the song title must be present
        if (songTokens.isNotEmpty) {
           return songTokens.any((t) => normResult.contains(t));
        }
        
        return normResult.contains(normSong);
      }).toList();

      // SAFETY NET: If we found the right song, keep it. If NOT, return an empty list 
      // rather than showing "Grace" when they searched for "Hallelujah".
      if (filtered.isNotEmpty) {
        allResults = filtered;
      } else {
        allResults = []; // Force them to use manual search if YouTube fails us
      }
    }

    // THREE-TIER SORT: Topic > Official Video > Views
    allResults.sort((a, b) {
      final aIsTopic = a.channelName.toLowerCase().contains('topic');
      final bIsTopic = b.channelName.toLowerCase().contains('topic');

      // Tier 1: Topic channels get absolute highest priority (if they are official)
      if (aIsTopic != bIsTopic) {
         if (aIsTopic && a.isOfficial) return -1;
         if (bIsTopic && b.isOfficial) return 1;
      }

      // Tier 2: Other Official channels (Vevo, Main Artist Channel)
      if (a.isOfficial != b.isOfficial) return a.isOfficial ? -1 : 1;
      
      // Tier 3: Fallback to views
      return b.viewCount.compareTo(a.viewCount);
    });

    return allResults.take(15).toList();
  }

  @override
  Future<List<YouTubeSearchResult>> loadMore({int maxResults = 15}) async {
    if (_currentSearchList == null) return [];
    
    final nextList = await _currentSearchList!.nextPage();
    if (nextList == null) return [];
    _currentSearchList = nextList;

    return _currentSearchList!.take(maxResults).map((video) {
      return YouTubeSearchResult(
        videoId: video.id.value,
        title: video.title,
        channelName: video.author,
        channelId: video.channelId.value,
        thumbnailUrl: video.thumbnails.highResUrl,
        duration: video.duration,
        viewCount: video.engagement.viewCount,
      );
    }).toList();
  }

  @override
  Future<YouTubeSearchResult?> getVideoDetails(String videoId) async {
    try {
      final video = await _yt.videos.get(videoId);
      return YouTubeSearchResult(
        videoId: video.id.value,
        title: video.title,
        channelName: video.author,
        channelId: video.channelId.value,
        thumbnailUrl: video.thumbnails.highResUrl,
        duration: video.duration,
        viewCount: video.engagement.viewCount,
        description: video.description,
      );
    } catch (e) {
      return null;
    }
  }

  @override
  Future<String?> getChannelIcon(String channelId) async {
    if (YouTubeSearchService.channelIconCache.containsKey(channelId)) {
      return YouTubeSearchService.channelIconCache[channelId];
    }
    try {
      final channel = await _yt.channels.get(channelId);
      final iconUrl = channel.logoUrl;
      YouTubeSearchService.channelIconCache[channelId] = iconUrl;
      return iconUrl;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<List<SearchSuggestion>> getSuggestions(String query) async {
    return await fetchCombinedSuggestions(query);
  }
}

// ── PLAYSTORE: Official API ───────────

class OfficialSearchService with MusicDataMixin implements YouTubeSearchService {
  static const String _apiKey = 'AIzaSyACNXBBh1kBcxxYKV4R7YkIY1ulY_GVGBw';
  static const String _baseUrl = 'https://www.googleapis.com/youtube/v3';
  String? _nextPageToken;
  String? _currentQuery;

  @override
  Future<List<YouTubeSearchResult>> search(String query, {int maxResults = 15, String? songTitle, String? artistName}) async {
    _currentQuery = query;
    _nextPageToken = null; // Reset pagination for new search

    return _executeSearch(query, maxResults: 10);
  }

  @override
  Future<List<YouTubeSearchResult>> loadMore({int maxResults = 15}) async {
    if (_currentQuery == null || _nextPageToken == null) return [];
    
    return _executeSearch(_currentQuery!, pageToken: _nextPageToken, maxResults: maxResults);
  }

  Future<List<YouTubeSearchResult>> _executeSearch(String query, {String? pageToken, int maxResults = 15}) async {
    final queryParams = {
      'part': 'snippet',
      'q': query,
      'type': 'video',
      'maxResults': '$maxResults',
      'key': _apiKey,
    };
    if (pageToken != null) {
      queryParams['pageToken'] = pageToken;
    }

    final uri = Uri.parse('$_baseUrl/search').replace(queryParameters: queryParams);

    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return [];

      final data = jsonDecode(response.body);
      _nextPageToken = data['nextPageToken'];

      final items = data['items'] as List;
      if (items.isEmpty) return [];

      final videoIds = items.map((item) => item['id']['videoId'] as String).toList();
      final durations = await _getVideoDurations(videoIds);

      final results = items.map((item) {
        final videoId = item['id']['videoId'] as String;
        final snippet = item['snippet'];
        return YouTubeSearchResult(
          videoId: videoId,
          title: snippet['title'],
          channelName: snippet['channelTitle'],
          channelId: snippet['channelId'],
          thumbnailUrl: snippet['thumbnails']['high']['url'] ?? 
                        snippet['thumbnails']['default']['url'],
          duration: durations[videoId],
          viewCount: 0, // Viewing count requires a separate API call in v3 search, setting to 0 for now as VIP uses Explode
        );
      }).toList();

      // Sort using shared hierarchical logic
      results.sort((a, b) => calculateRelevanceScore(b, query).compareTo(calculateRelevanceScore(a, query)));
      
      return results;
    } catch (e) {
      print('🛑 Official Search Error: $e');
      return [];
    }
  }

  @override
  Future<YouTubeSearchResult?> getVideoDetails(String videoId) async {
    final uri = Uri.parse('$_baseUrl/videos').replace(queryParameters: {
      'part': 'snippet,contentDetails',
      'id': videoId,
      'key': _apiKey,
    });
    
    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return null;
      
      final data = jsonDecode(response.body);
      final items = data['items'] as List;
      if (items.isEmpty) return null;
      
      final item = items.first;
      final snippet = item['snippet'];
      final duration = _parseIsoDuration(item['contentDetails']['duration']);
      
      return YouTubeSearchResult(
        videoId: videoId,
        title: snippet['title'],
        channelName: snippet['channelTitle'],
        channelId: snippet['channelId'],
        thumbnailUrl: snippet['thumbnails']['high']['url'] ?? 
                      snippet['thumbnails']['default']['url'],
        duration: duration,
        viewCount: 0,
      );
    } catch (e) {
      return null;
    }
  }

  @override
  Future<List<SearchSuggestion>> getSuggestions(String query) async {
    return await fetchCombinedSuggestions(query);
  }

  @override
  Future<String?> getChannelIcon(String channelId) async {
    // Official API implementation could go here, but for simplicity and consistency
    // we can reuse the YoutubeExplode instance via a temporary one if needed,
    // or just return null for the Official service for now.
    return null; 
  }

  Future<Map<String, Duration>> _getVideoDurations(List<String> videoIds) async {
    if (videoIds.isEmpty) return {};
    final uri = Uri.parse('$_baseUrl/videos').replace(queryParameters: {
      'part': 'contentDetails',
      'id': videoIds.join(','),
      'key': _apiKey,
    });
    
    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return {};
      
      final data = jsonDecode(response.body);
      final items = data['items'] as List;
      final durations = <String, Duration>{};
      for (final item in items) {
        final id = item['id'] as String;
        final iso = item['contentDetails']['duration'] as String;
        durations[id] = _parseIsoDuration(iso);
      }
      return durations;
    } catch (e) {
      return {};
    }
  }

  Duration _parseIsoDuration(String iso) {
    final regex = RegExp(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?');
    final match = regex.firstMatch(iso);
    if (match == null) return Duration.zero;
    final hours = int.tryParse(match.group(1) ?? '0') ?? 0;
    final minutes = int.tryParse(match.group(2) ?? '0') ?? 0;
    final seconds = int.tryParse(match.group(3) ?? '0') ?? 0;
    return Duration(hours: hours, minutes: minutes, seconds: seconds);
  }
}
