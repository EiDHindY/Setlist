import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/song_model.dart';
import '../services/youtube_search_service.dart';
import '../services/library_service.dart';
import '../theme/solarized_theme.dart';
import '../widgets/branded_loader.dart';
import 'package:url_launcher/url_launcher.dart';

class VersionSearchScreen extends StatefulWidget {
  final Song song;
  const VersionSearchScreen({Key? key, required this.song}) : super(key: key);

  @override
  State<VersionSearchScreen> createState() => _VersionSearchScreenState();
}

class _VersionSearchScreenState extends State<VersionSearchScreen> {
  final YouTubeSearchService _searchService = YouTubeSearchService();
  final LibraryService _libraryService = LibraryService();
  
  final TextEditingController _searchController = TextEditingController();
  List<YouTubeSearchResult> _results = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Start automatic search based on metadata from Step 1
    Future.microtask(() => _performInitialSearch());
  }

  Future<void> _performInitialSearch() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final query = "${widget.song.artist} ${widget.song.title}";
      final results = await _searchService.search(
        query, 
        maxResults: 10,
        songTitle: widget.song.title,
        artistName: widget.song.artist,
      );
      
      if (mounted) {
        setState(() {
          _results = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = "Failed to fetch suggested versions.";
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _launchYouTube() async {
    final query = "${widget.song.title} - ${widget.song.artist}";
    final encodedQuery = Uri.encodeComponent(query);
    
    // 1. YouTube Music App 
    final musicUrl = Uri.parse("https://music.youtube.com/search?q=$encodedQuery");
    // 2. YouTube App 
    final youtubeUrl = Uri.parse("https://www.youtube.com/results?search_query=$encodedQuery");

    try {
      bool launched = await launchUrl(musicUrl, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(youtubeUrl, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (await canLaunchUrl(musicUrl)) {
        await launchUrl(musicUrl);
      }
    }
  }

  Future<void> _handleSearch(String query) async {
    final cleanQuery = query.trim();

    // Use the official library-based parser for maximum reliability
    final videoId = YouTubeSearchService.extractVideoId(cleanQuery);

    if (videoId == null) {
      if (mounted) {
        setState(() {
          _errorMessage = "Invalid Link: could not find a YouTube video ID.";
          _results = [];
        });
      }
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final videoDetails = await _searchService.getVideoDetails(videoId);
      
      if (mounted) {
        setState(() {
          if (videoDetails != null) {
            _results = [videoDetails];
          } else {
            _errorMessage = 'Could not retrieve video details from the link.';
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = "Failed to fetch video details.";
          _isLoading = false;
        });
      }
    }
  }
  String _formatViewCount(int views) {
    if (views >= 1000000) return '${(views / 1000000).toStringAsFixed(1)}M views';
    if (views >= 1000) return '${(views / 1000).toStringAsFixed(1)}K views';
    return '$views views';
  }

  String _formatDuration(Duration? duration) {
    if (duration == null) return '';
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }



  Future<void> _addVersion(YouTubeSearchResult result) async {
    setState(() => _isLoading = true);
    
    final success = await _libraryService.saveVersion(
      songId: widget.song.id,
      result: result,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        Navigator.pop(context, true); // Return true to indicate success
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to link version.")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SolarizedTheme.base03,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: SolarizedTheme.base1),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.song.albumArt.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Hero(
                  tag: 'artwork_${widget.song.id}',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      widget.song.albumArt,
                      width: 32,
                      height: 32,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "Add YT versions to make a collection for:",
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.cyan,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  widget.song.title,
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.base3,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          if (_isLoading && _results.isEmpty)
            const Expanded(child: Center(child: BrandedLoader(size: 80)))
          else
            Expanded(
              child: Column(
                children: [
                  if (_errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(_errorMessage, style: const TextStyle(color: SolarizedTheme.red)),
                    ),
                  if (_isLoading)
                     const Padding(
                       padding: EdgeInsets.symmetric(vertical: 20),
                       child: BrandedLoader(size: 40),
                     ),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _results.length,
                      itemBuilder: (context, index) {
                        final result = _results[index];
                        return _buildResultCard(result).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
                      },
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: SolarizedTheme.base02.withOpacity(0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: SolarizedTheme.cyan.withOpacity(0.2)),
          ),
          child: TextField(
            controller: _searchController,
            style: GoogleFonts.montserrat(color: SolarizedTheme.base2, fontSize: 13),
            onChanged: (val) {
              if (val.contains("youtube.com/") || val.contains("youtu.be/")) {
                _handleSearch(val);
              }
            },
            decoration: InputDecoration(
              hintText: "Paste YouTube link here...",
              hintStyle: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 12),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: InkWell(
                onTap: _launchYouTube,
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.open_in_new_rounded, color: SolarizedTheme.cyan, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        "click here to get the yt song link",
                        style: GoogleFonts.montserrat(
                          color: SolarizedTheme.cyan,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(width: 1, height: 20, color: SolarizedTheme.base01.withOpacity(0.3)),
                    ],
                  ),
                ),
              ),
              suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, color: SolarizedTheme.base01, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _results = [];
                        _errorMessage = '';
                      });
                    },
                  )
                : null,
            ),
            onSubmitted: _handleSearch,
          ),
        ),
        if (_errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 32, top: 4),
            child: Text(
              _errorMessage,
              style: GoogleFonts.montserrat(color: SolarizedTheme.red, fontSize: 10),
            ),
          ),
      ],
    );
  }

  Widget _buildResultCard(YouTubeSearchResult result) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.1)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                result.thumbnailUrl,
                width: 100,
                height: 75,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 100,
                  height: 75,
                  color: SolarizedTheme.base03,
                  child: const Icon(Icons.videocam_off_rounded, color: SolarizedTheme.base01),
                ),
              ),
            ),
            if (result.duration != null)
              Positioned(
                bottom: 4,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _formatDuration(result.duration),
                    style: GoogleFonts.montserrat(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
        title: Text(
          result.title,
          style: GoogleFonts.montserrat(color: SolarizedTheme.base2, fontSize: 13, fontWeight: FontWeight.bold),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                if (result.channelId != null)
                  FutureBuilder<String?>(
                    future: _searchService.getChannelIcon(result.channelId!),
                    builder: (context, snapshot) {
                      final iconUrl = snapshot.data;
                      return Container(
                        width: 16,
                        height: 16,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: SolarizedTheme.base01.withOpacity(0.2),
                        ),
                        child: iconUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(iconUrl, fit: BoxFit.cover),
                              )
                            : const Icon(Icons.person, size: 10, color: SolarizedTheme.base01),
                      );
                    },
                  ),
                Expanded(
                  child: Text(
                    result.channelName,
                    style: GoogleFonts.montserrat(color: SolarizedTheme.base1, fontSize: 11, fontWeight: FontWeight.w500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              _formatViewCount(result.viewCount),
              style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 10),
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.add_circle_outline_rounded, color: SolarizedTheme.cyan, size: 28),
          onPressed: () => _addVersion(result),
        ),
      ),
    );
  }
}
