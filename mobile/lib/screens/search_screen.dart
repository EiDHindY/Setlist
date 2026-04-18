import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';
import '../services/youtube_search_service.dart';
import '../services/search_history_service.dart';
import '../widgets/branded_loader.dart';
import '../services/library_service.dart';
import '../models/song_model.dart';
import 'version_search_screen.dart';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;
  const SearchScreen({super.key, this.initialQuery});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  final YouTubeSearchService _searchService = YouTubeSearchService();
  final SearchHistoryService _historyService = SearchHistoryService();

  List<SearchSuggestion> _results = [];
  List<SearchSuggestion> _suggestions = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasSearched = false;
  bool _showSuggestions = false;
  String _errorMessage = '';
  SearchSuggestion? _selectedSongMetadata;


  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.initialQuery != null) {
        _performSearch(widget.initialQuery!);
      } else {
        _searchFocusNode.requestFocus();
      }
    });
    
    _searchFocusNode.addListener(() {
      setState(() {
        _showSuggestions = _searchFocusNode.hasFocus &&
            _searchController.text.isNotEmpty &&
            _suggestions.isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _debounce?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _handleScrollNotification(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      final pixels = notification.metrics.pixels;
      if (pixels >= notification.metrics.maxScrollExtent - 200) {
        if (!_isLoading && !_isLoadingMore && _hasSearched && _results.isNotEmpty) {
          _loadMoreResults();
        }
      }
    }
  }



  void _onSearchChanged(String query) {
    setState(() {}); 
    _debounce?.cancel();

    if (query.trim().isEmpty) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final remoteSuggestions = await _searchService.getSuggestions(query);

      if (!mounted) return;

      setState(() {
        _suggestions = remoteSuggestions.toSet().toList();
        
        _showSuggestions = _searchFocusNode.hasFocus && _suggestions.isNotEmpty;
      });
    });
  }

  Future<void> _handleMasterSongSelection(SearchSuggestion suggestion) async {
    _searchFocusNode.unfocus();
    setState(() {
      _isLoading = true;
      _showSuggestions = false;
      _searchController.text = suggestion.text;
    });

    final savedSong = await LibraryService().saveMasterSong(suggestion);

    setState(() {
      _isLoading = false;
    });

    if (savedSong != null) {
      // Promptly take the user to the YouTube version search
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VersionSearchScreen(song: savedSong),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to add song to collection.")),
      );
    }
  }



  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;

    _searchFocusNode.unfocus();
    _historyService.saveSearch(query);

    setState(() {
      _isLoading = true;
      _isLoadingMore = false;
      _hasSearched = true;
      _showSuggestions = false;
      _errorMessage = '';
      _searchController.text = query;
      _results.clear();
      _suggestions.clear();
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(0);
      }
    });

    try {
      // Step 1: Force User to Metadata Results (iTunes/Deezer)
      final results = await _searchService.getSuggestions(query);
      setState(() {
        // Filter to only show songs (Step 1 requirement)
        _results = results.where((s) => s.type == SuggestionType.song).toList();
        _isLoading = false;
        
        if (_results.isEmpty) {
           _errorMessage = 'No matching songs found in metadata.';
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to fetch results.';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreResults() async {
    // For Metadata search, we typically don't paginate in the same way as YT
    // but we can leave it empty for now or implement iTunes offset if needed.
    return;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // ── Search Header ──
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SolarizedTheme.cyan),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          height: 50,
                          decoration: BoxDecoration(
                            color: SolarizedTheme.base02.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(25),
                            border: Border.all(
                                color: SolarizedTheme.cyan.withOpacity(_searchFocusNode.hasFocus ? 0.5 : 0.2), 
                                width: 1.5
                            ),
                            boxShadow: _searchFocusNode.hasFocus
                                ? [BoxShadow(color: SolarizedTheme.cyan.withOpacity(0.1), blurRadius: 12, spreadRadius: 2)]
                                : [],
                          ),
                          child: TextField(
                            controller: _searchController,
                            focusNode: _searchFocusNode,
                            style: const TextStyle(color: SolarizedTheme.base2, fontSize: 16),
                            textInputAction: TextInputAction.search,
                            onSubmitted: _performSearch,
                            onChanged: _onSearchChanged,
                            decoration: InputDecoration(
                              hintText: 'Search',
                              hintStyle: TextStyle(color: SolarizedTheme.base01.withOpacity(0.7)),
                              prefixIcon: const Icon(Icons.search_rounded, color: SolarizedTheme.cyan),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.close_rounded, color: SolarizedTheme.base01),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() {
                                          _results.clear();
                                          _suggestions.clear();
                                          _selectedSongMetadata = null;
                                          _showSuggestions = false;
                                          _hasSearched = false;
                                        });
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Hybrid Suggestions List ──
                if (_showSuggestions) _buildSuggestionList(),

                // ── Search Results ──
                if (!_showSuggestions)
                  Expanded(child: _buildBody()),
              ],
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildSuggestionList() {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: SolarizedTheme.base02.withOpacity(0.95),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: SolarizedTheme.base01.withOpacity(0.15)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: _suggestions.length,
            separatorBuilder: (_, __) => Divider(
              color: SolarizedTheme.base01.withOpacity(0.1),
              height: 1,
              indent: 52,
            ),
            itemBuilder: (context, index) {
              final suggestion = _suggestions[index];
              return _buildSuggestionItem(suggestion, index);
            },
          ),
        ),
      ).animate().fadeIn(duration: 200.ms).slideY(begin: -0.05, curve: Curves.easeOut),
    );
  }

  Widget _buildSuggestionItem(SearchSuggestion suggestion, int index) {
    IconData iconData;
    Color iconColor;

    switch (suggestion.type) {
      case SuggestionType.artist:
        iconData = Icons.mic_external_on_rounded;
        iconColor = SolarizedTheme.magenta;
        break;
      case SuggestionType.song:
        iconData = Icons.music_note_rounded;
        iconColor = SolarizedTheme.cyan;
        break;
      case SuggestionType.history:
        iconData = Icons.history_rounded;
        iconColor = SolarizedTheme.base01;
        break;
      case SuggestionType.global:
        iconData = Icons.search_rounded;
        iconColor = SolarizedTheme.base01.withOpacity(0.5);
        break;
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (suggestion.type == SuggestionType.song) {
            _handleMasterSongSelection(suggestion);
          } else {
            _performSearch(suggestion.text);
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(suggestion.imageUrl != null ? 8 : 16),
                ),
                child: suggestion.imageUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          suggestion.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              Icon(iconData, size: 16, color: iconColor),
                        ),
                      )
                    : Icon(iconData, size: 16, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildHighlightedText(suggestion.text, _searchController.text),
              ),
              if (suggestion.type == SuggestionType.history)
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 14, color: SolarizedTheme.base01),
                  onPressed: () async {
                    await _historyService.removeSearch(suggestion.text);
                    _onSearchChanged(_searchController.text);
                  },
                )
              else
                Icon(
                  Icons.north_west_rounded,
                  size: 14,
                  color: SolarizedTheme.base01.withOpacity(0.3),
                ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 200.ms, delay: (index * 30).ms);
  }

  Widget _buildHighlightedText(String suggestion, String query) {
    final lowerSuggestion = suggestion.toLowerCase();
    final cleanQuery = query.trim().toLowerCase();

    // Safety check: if query is empty or suggestion doesn't contain it, return plain text
    if (cleanQuery.isEmpty || !lowerSuggestion.contains(cleanQuery)) {
      return Text(
        suggestion,
        style: GoogleFonts.montserrat(color: SolarizedTheme.base2, fontSize: 14),
        overflow: TextOverflow.ellipsis,
      );
    }

    // Find the match index safely
    final matchIndex = lowerSuggestion.indexOf(cleanQuery);
    final before = suggestion.substring(0, matchIndex);
    final match = suggestion.substring(matchIndex, matchIndex + cleanQuery.length);
    final after = suggestion.substring(matchIndex + cleanQuery.length);

    return RichText(
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        children: [
          if (before.isNotEmpty)
            TextSpan(
              text: before,
              style: GoogleFonts.montserrat(color: SolarizedTheme.base2, fontSize: 14),
            ),
          TextSpan(
            text: match,
            style: GoogleFonts.montserrat(
              color: SolarizedTheme.base01,
              fontSize: 14,
              fontWeight: FontWeight.normal,
            ),
          ),
          TextSpan(
            text: after,
            style: GoogleFonts.montserrat(
              color: SolarizedTheme.base2,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: BrandedLoader(size: 120));
    }

    if (_errorMessage.isNotEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: SolarizedTheme.red, size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage,
                style: const TextStyle(color: SolarizedTheme.red),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    if (!_hasSearched) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.music_note_rounded, size: 64, color: SolarizedTheme.base01.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text(
              "Setlist Search",
              style: GoogleFonts.cinzel(
                color: SolarizedTheme.base1,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40.0),
              child: Text(
                "1- search for your song\n2- add versions inside of that song to make a collection",
                textAlign: TextAlign.center,
                style: GoogleFonts.montserrat(
                  color: SolarizedTheme.base01,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_results.isEmpty) {
      return Center(
        child: Text(
          "No results found for '${_searchController.text}'",
          style: const TextStyle(color: SolarizedTheme.base1),
        ),
      );
    }

    return Column(
      children: [
        if (_selectedSongMetadata != null) _buildPremiumBanner(),
        Expanded(
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              _handleScrollNotification(notification);
              return false;
            },
            child: ListView.builder(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(), 
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _results.length + (_isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _results.length) {
                  return const Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Center(
                      child: BrandedLoader(size: 40),
                    ),
                  );
                }

                final suggestion = _results[index];
                return _buildResultItem(suggestion)
                    .animate(key: ValueKey("${suggestion.appleTrackId}_${suggestion.text}"))
                    .fadeIn(duration: 300.ms, delay: ((index % 15) * 50).ms)
                    .slideY(begin: 0.1, curve: Curves.easeOut);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SolarizedTheme.cyan.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          if (_selectedSongMetadata!.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(_selectedSongMetadata!.imageUrl!, width: 48, height: 48, fit: BoxFit.cover),
            )
          else
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: SolarizedTheme.cyan.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.cyan),
            ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Adding a song for the collection:",
                  style: GoogleFonts.montserrat(color: SolarizedTheme.cyan, fontSize: 11, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  _selectedSongMetadata!.songTitle ?? _selectedSongMetadata!.text,
                  style: GoogleFonts.montserrat(color: SolarizedTheme.base3, fontSize: 14, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (_selectedSongMetadata!.subtitle != null)
                  Text(
                    _selectedSongMetadata!.subtitle!,
                    style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, curve: Curves.easeOut);
  }

  Widget _buildResultItem(SearchSuggestion suggestion) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.1)),
      ),
      child: ListTile(
        onTap: () => _handleMasterSongSelection(suggestion),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: SolarizedTheme.cyan.withOpacity(0.1),
            ),
            child: suggestion.imageUrl != null
                ? Image.network(
                    suggestion.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(Icons.music_note_rounded, color: SolarizedTheme.cyan),
                  )
                : const Icon(Icons.music_note_rounded, color: SolarizedTheme.cyan),
          ),
        ),
        title: Text(
          suggestion.songTitle ?? suggestion.text.split(' - ').first,
          style: GoogleFonts.montserrat(
            color: SolarizedTheme.base3,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          suggestion.subtitle ?? suggestion.text.split(' - ').last,
          style: GoogleFonts.montserrat(color: SolarizedTheme.base1, fontSize: 12),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: SolarizedTheme.cyan, size: 16),
      ),
    );
  }
}


