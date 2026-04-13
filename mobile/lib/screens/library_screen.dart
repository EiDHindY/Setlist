import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';

class LibraryScreen extends StatefulWidget {
  final int subNavIndex;
  const LibraryScreen({super.key, this.subNavIndex = 0});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with AutomaticKeepAliveClientMixin {
  
  @override
  bool get wantKeepAlive => true;

  @override
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
                      onPressed: () {},
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
    return _buildEmptyState(
      icon: Icons.music_note_rounded,
      title: "Your Collection is Silent",
      message: "Ready to start your next session?\nAdd some tracks to get the rhythm going.",
      buttonLabel: "FIND SONGS",
      onPressed: () {
        // TODO: Navigate to Search or Add Song screen
      },
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
