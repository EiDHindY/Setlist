import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';
import '../models/song_model.dart';
import '../widgets/song_item.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  final List<Song> _mockSongs = [
    Song(
      id: "1",
      title: "Solarized Dreams",
      artist: "D0D0",
      albumArt: "https://via.placeholder.com/150/002b36/fdf6e3?text=S1",
      duration: const Duration(minutes: 3, seconds: 45),
    ),
    Song(
      id: "2",
      title: "Cyberpunk Echoes",
      artist: "Aliaa M.",
      albumArt: "https://via.placeholder.com/150/073642/fdf6e3?text=CE",
      duration: const Duration(minutes: 4, seconds: 12),
    ),
    Song(
      id: "3",
      title: "Ghost in the Shell",
      artist: "Kenji Kawai",
      albumArt: "https://via.placeholder.com/150/586e75/fdf6e3?text=GIS",
      duration: const Duration(minutes: 2, seconds: 58),
    ),
    Song(
      id: "4",
      title: "Midnight City",
      artist: "M83",
      albumArt: "https://via.placeholder.com/150/859900/fdf6e3?text=MC",
      duration: const Duration(minutes: 4, seconds: 03),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
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

          // Custom Tab Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: SolarizedTheme.cyan,
              unselectedLabelColor: SolarizedTheme.base01,
              indicatorColor: SolarizedTheme.cyan,
              indicatorSize: TabBarIndicatorSize.label,
              dividerColor: Colors.transparent,
              labelPadding: const EdgeInsets.only(right: 24),
              tabs: [
                Tab(child: Text("SONGS", style: GoogleFonts.cinzel(fontSize: 16, fontWeight: FontWeight.bold))),
                Tab(child: Text("PLAYLISTS", style: GoogleFonts.cinzel(fontSize: 16, fontWeight: FontWeight.bold))),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Songs Tab
                _buildSongsList(),
                
                // Playlists Tab
                _buildPlaylistsContent(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSongsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      itemCount: _mockSongs.length,
      itemBuilder: (context, index) {
        return SongItem(
          song: _mockSongs[index],
          onTap: () {
            // Handle Play
          },
        );
      },
    );
  }

  Widget _buildPlaylistsContent() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.playlist_add_rounded, size: 64, color: SolarizedTheme.base01.withOpacity(0.4)),
          const SizedBox(height: 16),
          const Text(
            "No playlists created yet.",
            style: TextStyle(color: SolarizedTheme.base01),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(backgroundColor: SolarizedTheme.base02),
            child: const Text("CREATE NEW PLAYLIST", style: TextStyle(color: SolarizedTheme.cyan)),
          ),
        ],
      ),
    );
  }
}
