import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';
import '../services/library_service.dart';
import '../models/song_model.dart';
import '../widgets/branded_loader.dart';
import 'search_screen.dart';
import 'song_detail_screen.dart';

class LibraryScreen extends StatefulWidget {
  final int subNavIndex;
  const LibraryScreen({super.key, this.subNavIndex = 0});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with AutomaticKeepAliveClientMixin {
  
  @override
  bool get wantKeepAlive => true;

  Future<List<Song>> _songsFuture = LibraryService().fetchLibrarySongs();

  @override
  void initState() {
    super.initState();
  }

  void _refreshSongs() {
    setState(() {
      _songsFuture = LibraryService().fetchLibrarySongs();
    });
  }
  Widget build(BuildContext context) {
    super.build(context);
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 40), // Spacer for global logo
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.search_rounded, color: SolarizedTheme.base01),
                      onPressed: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const SearchScreen()),
                        );
                        if (!LibraryService().isCacheFresh) {
                          _refreshSongs();
                        }
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_rounded, color: SolarizedTheme.cyan),
                      onPressed: () {},
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 12),

          // Tab Content (Now based on subNavIndex)
          Expanded(
            child: _getContentForIndex(widget.subNavIndex),
          ),
        ],
      ),
    );
  }

  Widget _getContentForIndex(int index) {
    switch (index) {
      case 0: // Songs
        return _buildSongsList();
      case 1: // Setlists
        return _buildPlaylistsContent("No setlists created yet.");
      case 2: // Albums
        return _buildPlaceholderContent(Icons.album_rounded, "Albums feature coming soon.");
      case 3: // Artists
        return _buildPlaceholderContent(Icons.person_rounded, "Artists feature coming soon.");
      case 4: // Producers
        return _buildPlaceholderContent(Icons.settings_input_component_rounded, "Producers feature coming soon.");
      case 5: // Mixers
        return _buildPlaceholderContent(Icons.tune_rounded, "Mixers feature coming soon.");
      default:
        return _buildSongsList();
    }
  }

  Widget _buildSongsList() {
    return FutureBuilder<List<Song>>(
      future: _songsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting && !LibraryService().isCacheFresh) {
          return const Center(child: BrandedLoader(size: 80));
        }

        final songs = snapshot.data ?? LibraryService().cachedSongs;

        if (songs.isEmpty) {
          return _buildEmptyState(
            icon: Icons.music_note_rounded,
            title: "Your Collections are Silent",
            message: "Ready to start your next session?\nAdd some tracks to get the rhythm going.",
            buttonLabel: "FIND SONGS",
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
              if (!LibraryService().isCacheFresh) {
                _refreshSongs();
              }
            },
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            _refreshSongs();
            await _songsFuture;
          },
          color: SolarizedTheme.cyan,
          backgroundColor: SolarizedTheme.base02,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: songs.length,
            itemBuilder: (context, index) => _buildSongItem(songs[index]),
          ),
        );
      },
    );
  }

  Widget _buildSongItem(Song song) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.05)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SongDetailScreen(song: song),
            ),
          );
        },
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: song.albumArt.isNotEmpty
              ? Image.network(song.albumArt, width: 42, height: 42, fit: BoxFit.cover)
              : Container(
                  width: 42,
                  height: 42,
                  color: SolarizedTheme.base01.withOpacity(0.1),
                  child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.base01, size: 18),
                ),
        ),
        title: Text(
          song.title,
          style: GoogleFonts.montserrat(color: SolarizedTheme.base3, fontWeight: FontWeight.w600, fontSize: 13),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          song.artist,
          style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 11),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "${song.versions.length} Version${song.versions.length > 1 ? 's' : ''}",
              style: GoogleFonts.montserrat(
                color: song.versions.isNotEmpty ? SolarizedTheme.cyan.withOpacity(0.7) : SolarizedTheme.base01, 
                fontSize: 11,
                fontWeight: song.versions.isNotEmpty ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            const SizedBox(width: 4),
            Theme(
              data: Theme.of(context).copyWith(
                cardColor: SolarizedTheme.base02,
                dividerColor: SolarizedTheme.base01.withOpacity(0.2),
              ),
              child: PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, color: SolarizedTheme.base01, size: 20),
                offset: const Offset(0, 40),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onSelected: (value) async {
                  if (value == 'remove') {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: SolarizedTheme.base02,
                        title: Text("Remove from Collections?", style: GoogleFonts.cinzel(color: SolarizedTheme.base3, fontSize: 18)),
                        content: Text(
                          "This will remove the association, but your personal versions and stats are preserved if you add it again later.",
                          style: GoogleFonts.montserrat(color: SolarizedTheme.base1, fontSize: 14),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: Text("CANCEL", style: GoogleFonts.montserrat(color: SolarizedTheme.base01)),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: Text("REMOVE", style: GoogleFonts.montserrat(color: SolarizedTheme.red, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true) {
                      final success = await LibraryService().removeSongFromLibrary(song.id);
                      if (success) {
                        _refreshSongs();
                      }
                    }
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'remove',
                    child: Row(
                      children: [
                        const Icon(Icons.delete_outline_rounded, color: SolarizedTheme.red, size: 18),
                        const SizedBox(width: 12),
                        Text("Remove", style: GoogleFonts.montserrat(color: SolarizedTheme.red, fontSize: 14)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaylistsContent(String message) {
    return _buildEmptyState(
      icon: Icons.playlist_add_rounded,
      title: "No Setlists Yet",
      message: "Organize your tracks into powerful setlists\nfor your next live performance.",
      buttonLabel: "CREATE SETLIST",
      onPressed: () {
        // TODO: Open Create Setlist dialog
      },
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String message,
    required String buttonLabel,
    required VoidCallback onPressed,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: SolarizedTheme.base02.withOpacity(0.5),
                shape: BoxShape.circle,
                border: Border.all(color: SolarizedTheme.base01.withOpacity(0.2)),
              ),
              child: Icon(
                icon,
                size: 64,
                color: SolarizedTheme.base01.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 32),
            Text(
              title,
              style: GoogleFonts.cinzel(
                color: SolarizedTheme.base3,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: GoogleFonts.montserrat(
                color: SolarizedTheme.base1,
                fontSize: 14,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: SolarizedTheme.cyan.withOpacity(0.1),
                foregroundColor: SolarizedTheme.cyan,
                side: const BorderSide(color: SolarizedTheme.cyan, width: 1.5),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                elevation: 0,
              ),
              child: Text(
                buttonLabel,
                style: GoogleFonts.montserrat(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderContent(IconData icon, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: SolarizedTheme.base01.withOpacity(0.4)),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: SolarizedTheme.base01),
          ),
        ],
      ),
    );
  }
}
