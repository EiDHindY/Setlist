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
  
  // Hunter Mode State
  final Set<String> _locallyAddedIds = {};
  final Set<String> _savingIds = {};
  bool _anyAddedLocally = false;

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
    if (_savingIds.contains(result.videoId)) return;
    if (_locallyAddedIds.contains(result.videoId)) return;
    
    // Check if it was already in the song's versions (optional safety)
    final alreadyInLibrary = widget.song.versions.any((v) => v.youtubeVideoId == result.videoId);
    if (alreadyInLibrary) return;

    setState(() {
      _savingIds.add(result.videoId);
    });
    
    try {
      final success = await _libraryService.saveVersion(
        songId: widget.song.id,
        result: result,
      );

      if (mounted) {
        setState(() {
          _savingIds.remove(result.videoId);
          if (success) {
            _locallyAddedIds.add(result.videoId);
            _anyAddedLocally = true;
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Failed to link version.")),
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _savingIds.remove(result.videoId);
          _errorMessage = "Failed to save version.";
        });
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
          onPressed: () => Navigator.pop(context, _anyAddedLocally ? widget.song : null),
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
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8),
            child: Text(
              "STEP 2",
              style: GoogleFonts.montserrat(
                color: SolarizedTheme.cyan.withOpacity(0.6),
                fontSize: 8,
                fontWeight: FontWeight.w800,
                letterSpacing: 3,
              ),
            ),
          ),
          _buildSearchBar(),
          const SizedBox(height: 8),
          Expanded(
            child: _buildResultsList(isOfficialOnly: false),
          ),
        ],
      ),
    );
  }


  Widget _buildResultsList({bool isOfficialOnly = false}) {
    if (_isLoading && _results.isEmpty) {
      return const Center(child: BrandedLoader(size: 80));
    }

    final filteredResults = isOfficialOnly 
        ? _results.where((r) => r.isOfficial).toList()
        : _results;

    if (filteredResults.isEmpty && !_isLoading) {
      return _buildNoResults(isOfficialOnly);
    }

    return Column(
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
            itemCount: filteredResults.length,
            itemBuilder: (context, index) {
              final result = filteredResults[index];
              return _buildResultCard(result).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNoResults(bool isOfficialOnly) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isOfficialOnly ? Icons.verified_user_rounded : Icons.search_off_rounded,
            size: 64, 
            color: SolarizedTheme.base01.withOpacity(0.3)
          ),
          const SizedBox(height: 16),
          Text(
            isOfficialOnly ? "No official versions found." : "No results match your search.",
            style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 14),
          ),
          if (isOfficialOnly)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                "Check the 'All' tab for live versions or covers.",
                style: GoogleFonts.montserrat(color: SolarizedTheme.base01.withOpacity(0.5), fontSize: 11),
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
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              ValueListenableBuilder<TextEditingValue>(
                valueListenable: _searchController,
                builder: (context, value, child) {
                  if (value.text.isNotEmpty) return const SizedBox.shrink();
                  return Positioned(
                    left: 56, // Account for prefix icon
                    right: 48, // Account for suffix icon
                    child: _MarqueeText(
                      text: "Missing a version? Paste a YouTube link here or tap the arrow to find it on YT... ",
                      style: GoogleFonts.montserrat(
                        color: SolarizedTheme.base01.withOpacity(0.7),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  );
                },
              ),
              TextField(
                controller: _searchController,
                style: GoogleFonts.montserrat(color: SolarizedTheme.base2, fontSize: 13),
                onChanged: (val) {
                  if (val.contains("youtube.com/") || val.contains("youtu.be/")) {
                    _handleSearch(val);
                  }
                },
                decoration: InputDecoration(
                  hintText: "", // Using custom marquee instead
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
                          const Icon(Icons.open_in_new_rounded, color: SolarizedTheme.cyan, size: 18),
                          const SizedBox(width: 12),
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
            ],
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
        color: result.isOfficial 
            ? SolarizedTheme.cyan.withOpacity(0.05) 
            : SolarizedTheme.base02.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: result.isOfficial 
              ? SolarizedTheme.cyan.withOpacity(0.3) 
              : SolarizedTheme.base01.withOpacity(0.1),
          width: result.isOfficial ? 1.5 : 1,
        ),
        boxShadow: result.isOfficial ? [
          BoxShadow(
            color: SolarizedTheme.cyan.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 2,
          )
        ] : null,
      ),
      child: InkWell(
        onTap: () => _showResultDetails(result),
        borderRadius: BorderRadius.circular(16),
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
        trailing: _buildTrailingIcon(result),
        ),
      ),
    );
  }

  void _showResultDetails(YouTubeSearchResult result) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: SolarizedTheme.base03,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: SolarizedTheme.base01.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        result.thumbnailUrl,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 24),
                    SelectableText(
                      result.title,
                      style: GoogleFonts.montserrat(
                        color: SolarizedTheme.base3,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (result.channelId != null)
                          FutureBuilder<String?>(
                            future: _searchService.getChannelIcon(result.channelId!),
                            builder: (context, snapshot) {
                              final iconUrl = snapshot.data;
                              return Container(
                                width: 20,
                                height: 20,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: SolarizedTheme.base01.withOpacity(0.2),
                                ),
                                child: iconUrl != null
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(10),
                                        child: Image.network(iconUrl, fit: BoxFit.cover),
                                      )
                                    : const Icon(Icons.person_rounded, size: 12, color: SolarizedTheme.cyan),
                              );
                            },
                          )
                        else
                          const Icon(Icons.person_rounded, color: SolarizedTheme.cyan, size: 16),
                        Text(
                          result.channelName,
                          style: GoogleFonts.montserrat(color: SolarizedTheme.cyan, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildInfoChip(Icons.remove_red_eye_rounded, _formatViewCount(result.viewCount)),
                        const SizedBox(width: 12),
                        if (result.duration != null)
                          _buildInfoChip(Icons.access_time_rounded, _formatDuration(result.duration)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      "Description",
                      style: GoogleFonts.montserrat(
                        color: SolarizedTheme.base1,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    FutureBuilder<YouTubeSearchResult?>(
                      future: _searchService.getVideoDetails(result.videoId),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const BrandedLoader(size: 24),
                                  const SizedBox(height: 8),
                                  Text(
                                    "Fetching full details...",
                                    style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }
                        
                        final details = snapshot.data;
                        return Text(
                          details?.description ?? "No description available.",
                          style: GoogleFonts.montserrat(
                            color: SolarizedTheme.base01,
                            fontSize: 13,
                            height: 1.5,
                          ),
                        ).animate().fadeIn();
                      },
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: SolarizedTheme.base03,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _addVersion(result);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SolarizedTheme.cyan,
                    foregroundColor: SolarizedTheme.base03,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text(
                    "ADD THIS VERSION",
                    style: GoogleFonts.montserrat(fontWeight: FontWeight.bold, letterSpacing: 1.5),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: SolarizedTheme.base1, size: 12),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.montserrat(color: SolarizedTheme.base1, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildTrailingIcon(YouTubeSearchResult result) {
    final isSaving = _savingIds.contains(result.videoId);
    final isAlreadySaved = widget.song.versions.any((v) => v.youtubeVideoId == result.videoId) || 
                          _locallyAddedIds.contains(result.videoId);

    if (isSaving) {
      return const Padding(
        padding: EdgeInsets.all(12.0),
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(SolarizedTheme.cyan),
          ),
        ),
      );
    }

    if (isAlreadySaved) {
      return const Padding(
        padding: EdgeInsets.all(8.0),
        child: Icon(
          Icons.check_circle_rounded,
          color: SolarizedTheme.cyan,
          size: 28,
        ),
      );
    }

    return IconButton(
      icon: const Icon(Icons.add_circle_outline_rounded, color: SolarizedTheme.cyan, size: 28),
      onPressed: () => _addVersion(result),
    );
  }
}

class _MarqueeText extends StatefulWidget {
  final String text;
  final TextStyle style;
  const _MarqueeText({Key? key, required this.text, required this.style}) : super(key: key);

  @override
  State<_MarqueeText> createState() => _MarqueeTextState();
}

class _MarqueeTextState extends State<_MarqueeText> with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  late AnimationController _animationController;
  double _textWidth = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _animationController = AnimationController(
       vsync: this,
       duration: const Duration(seconds: 25), // Sped up from 45s to 25s for better readability
    );

    // After first frame, measure the text width to perfect the loop
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      // We estimate the width based on character count since we're using a fixed-ish font size,
      // but a more robust way is to use a text painter if needed. 
      // For this UI tweak, a slightly larger buffer works well for the "seamless" effect.
      _animationController.addListener(() {
        if (_scrollController.hasClients && _scrollController.position.maxScrollExtent > 0) {
          final maxScroll = _scrollController.position.maxScrollExtent;
          // Loop through exactly half the scrollable content (one full text + gap)
          double halfScroll = maxScroll / 2;
          _scrollController.jumpTo(_animationController.value * halfScroll);
        }
      });
      _animationController.repeat();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: SingleChildScrollView(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        child: Row(
          children: [
            Text(widget.text, style: widget.style),
            const SizedBox(width: 80), // Precise gap
            Text(widget.text, style: widget.style),
            const SizedBox(width: 80),
          ],
        ),
      ),
    );
  }
}
