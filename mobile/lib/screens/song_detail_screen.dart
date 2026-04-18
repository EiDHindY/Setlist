import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/song_model.dart';
import '../theme/solarized_theme.dart';
import 'dart:ui';
import 'version_search_screen.dart';
import '../services/library_service.dart';

class SongDetailScreen extends StatefulWidget {
  final Song song;
  
  const SongDetailScreen({Key? key, required this.song}) : super(key: key);

  @override
  State<SongDetailScreen> createState() => _SongDetailScreenState();
}

class _SongDetailScreenState extends State<SongDetailScreen> {
  int _currentIndex = 0;
  late Song _currentSong;

  @override
  void initState() {
    super.initState();
    _currentSong = widget.song;
  }

  Future<void> _refreshSong() async {
    final songs = await LibraryService().fetchLibrarySongs();
    final updated = songs.firstWhere((s) => s.id == _currentSong.id, orElse: () => _currentSong);
    if (mounted) {
      setState(() {
        _currentSong = updated;
      });
    }
  }

  Future<void> _navigateToAddVersion() async {
    final bool? result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VersionSearchScreen(song: _currentSong),
      ),
    );

    if (result == true) {
      _refreshSong();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SolarizedTheme.base03,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SolarizedTheme.cyan, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "COLLECTION",
          style: GoogleFonts.cinzel(
            color: SolarizedTheme.cyan,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 2.0,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Background Gradient (subtle)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    SolarizedTheme.cyan.withOpacity(0.05),
                    SolarizedTheme.base03,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: Column(
              children: [
                _buildSongHeader(),
                Expanded(
                  child: _buildBodyContent(),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildSongHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _showArtworkDialog(context),
            child: Container(
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  )
                ]
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
              child: _currentSong.albumArt.isNotEmpty
                    ? Image.network(_currentSong.albumArt, width: 80, height: 80, fit: BoxFit.cover)
                    : Container(
                        width: 80,
                        height: 80,
                        color: SolarizedTheme.base02,
                        child: const Icon(Icons.music_note, color: SolarizedTheme.base01, size: 40),
                      ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _currentSong.title,
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.base3,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  _currentSong.artist,
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.base0,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  void _showArtworkDialog(BuildContext context) {
    if (_currentSong.albumArt.isEmpty) return;

    // Secret trick: Ask Apple's CDN for a massive 600x600 high-res version of the art!
    final highResUrl = _currentSong.albumArt.replaceAll('100x100bb.jpg', '600x600bb.jpg');

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: "Artwork",
      barrierColor: Colors.black.withOpacity(0.85),
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Stack(
          children: [
            Center(
              child: InteractiveViewer(
                panEnabled: true,
                minScale: 1.0,
                maxScale: 4.0,
                child: Hero(
                  tag: 'artwork_popup_${_currentSong.id}',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.network(
                      highResUrl,
                      width: MediaQuery.of(context).size.width * 0.85,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 50,
              right: 20,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
                ),
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildBodyContent() {
    switch (_currentIndex) {
      case 0:
        return _buildVersionsList();
      case 1:
        return _buildPlaceholder("LYRICS", Icons.lyrics_rounded);
      case 2:
        return _buildPlaceholder("CREDITS", Icons.people_alt_rounded);
      case 3:
        return _buildPlaceholder("SETLISTS", Icons.queue_music_rounded);
      case 4:
        return _buildPlaceholder("STATS", Icons.bar_chart_rounded);
      default:
        return Container();
    }
  }

  Widget _buildVersionsList() {
    return Column(
      children: [
        if (_currentSong.versions.isNotEmpty)
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _currentSong.versions.length,
              itemBuilder: (context, index) {
                final version = _currentSong.versions[index];
                return _buildVersionTile(version);
              },
            ),
          )
        else
          Expanded(
            child: _buildPlaceholder("NO VERSIONS", Icons.videocam_off_rounded),
          ),
        _buildAddVersionButton(),
      ],
    );
  }

  Widget _buildAddVersionButton() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: GestureDetector(
        onTap: _navigateToAddVersion,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: SolarizedTheme.cyan.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: SolarizedTheme.cyan.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.add_circle_outline_rounded, color: SolarizedTheme.cyan),
              const SizedBox(width: 8),
              Text(
                "ADD VERSION",
                style: GoogleFonts.cinzel(
                  color: SolarizedTheme.cyan,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVersionTile(SongVersion version) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.0)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: _buildVersionThumbnail(version),
        title: Text(
          version.title,
          style: GoogleFonts.montserrat(
            color: SolarizedTheme.base2,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6.0),
          child: Row(
            children: [
              const Icon(Icons.person_rounded, size: 12, color: SolarizedTheme.base01),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  version.channelName ?? 'YouTube Video',
                  style: GoogleFonts.montserrat(color: SolarizedTheme.base01, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.play_circle_fill_rounded, color: SolarizedTheme.cyan, size: 28),
            const SizedBox(height: 4),
            Text(
              "${version.duration.inMinutes}:${(version.duration.inSeconds % 60).toString().padLeft(2, '0')}",
              style: GoogleFonts.montserrat(color: SolarizedTheme.cyan.withOpacity(0.8), fontSize: 10),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildVersionThumbnail(SongVersion version) {
    // If we have a saved thumbnail, use it. Otherwise dynamically infer it using the YouTube ID!
    final String imageUrl = (version.thumbnailUrl != null && version.thumbnailUrl!.isNotEmpty)
        ? version.thumbnailUrl!
        : 'https://img.youtube.com/vi/${version.youtubeVideoId}/mqdefault.jpg';

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(
        imageUrl, 
        width: 62, 
        height: 46, 
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          // If the image fails to load, fallback to the generic TV icon
          return Container(
            width: 62,
            height: 46,
            decoration: BoxDecoration(
              color: SolarizedTheme.base02.withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: SolarizedTheme.base01.withOpacity(0.1)),
            ),
            child: const Icon(Icons.smart_display_rounded, color: SolarizedTheme.base01, size: 24),
          );
        },
      ),
    );
  }

  Widget _buildPlaceholder(String title, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: SolarizedTheme.base01.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.cinzel(
              color: SolarizedTheme.base01,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "This space will host the $title feature.",
            style: GoogleFonts.montserrat(
              color: SolarizedTheme.base01.withOpacity(0.7),
              fontSize: 12,
            ),
          )
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: SolarizedTheme.base03.withOpacity(0.85),
            border: Border(top: BorderSide(color: SolarizedTheme.cyan.withOpacity(0.2), width: 1)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _navItem(0, Icons.play_circle_outline_rounded, Icons.play_circle_fill_rounded, 'Play'),
                  _navItem(1, Icons.lyrics_outlined, Icons.lyrics_rounded, 'Lyrics'),
                  _navItem(2, Icons.people_outline_rounded, Icons.people_alt_rounded, 'Credits'),
                  _navItem(3, Icons.queue_music_outlined, Icons.queue_music_rounded, 'Setlists'),
                  _navItem(4, Icons.bar_chart_outlined, Icons.bar_chart_rounded, 'Stats'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData outlineIcon, IconData solidIcon, String label) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01;
    final icon = isSelected ? solidIcon : outlineIcon;

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.montserrat(
                color: color,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            )
          ],
        ),
      ),
    );
  }
}
