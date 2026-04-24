import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';
import 'package:url_launcher/url_launcher.dart';

import '../services/playback_service.dart';
import '../models/song_model.dart';
import '../theme/solarized_theme.dart';

class UnifiedPlayer extends StatefulWidget {
  const UnifiedPlayer({Key? key}) : super(key: key);

  @override
  State<UnifiedPlayer> createState() => _UnifiedPlayerState();
}

class _UnifiedPlayerState extends State<UnifiedPlayer> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final PlaybackService _playbackService = PlaybackService();
  bool _hasVideoError = false;
  // Use a dynamic key to force refresh when the song changes
  // but a GlobalKey to preserve state during orientation rotations.

  bool? _isCurrentlyLandscape;

  void _handleOrientation(bool isExpanded) {
    if (_isCurrentlyLandscape == isExpanded) return;
    _isCurrentlyLandscape = isExpanded;
    
    if (isExpanded) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);
    }
    // Always ensure immersive mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return StreamBuilder<PlaybackState>(
      stream: _playbackService.stateStream,
      initialData: _playbackService.state,
      builder: (context, snapshot) {
        final state = snapshot.data;
        
        if (state == null || state.song == null || state.version == null) {
          return const SizedBox.shrink();
        }

        // Only trigger orientation changes if state actually changes
        // This prevents flickering/rebuild loops
        return _buildPlayerContainer(state);
      },
    );
  }

  Widget _buildPlayerContainer(PlaybackState state) {
    final bool isExpanded = state.isExpanded;
    final size = MediaQuery.of(context).size;

    // Handle orientation side-effects outside of the immediate build return if possible, 
    // but here we ensure it matches the expansion state.
    _handleOrientation(isExpanded);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
      width: isExpanded ? size.width : null,
      height: isExpanded ? size.height : null,
      margin: isExpanded ? EdgeInsets.zero : const EdgeInsets.fromLTRB(10, 0, 10, 100),
      decoration: BoxDecoration(
        color: isExpanded ? Colors.black : SolarizedTheme.base02.withOpacity(0.95),
        borderRadius: isExpanded ? BorderRadius.zero : BorderRadius.circular(20),
        border: isExpanded ? null : Border.all(color: SolarizedTheme.cyan.withOpacity(0.3), width: 1.5),
        boxShadow: isExpanded ? [] : [
          BoxShadow(
            color: Colors.black.withOpacity(0.5), blurRadius: 20, offset: const Offset(0, 10),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: isExpanded ? BorderRadius.zero : BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Stack(
            children: [
              // THE CORE VIDEO LAYER
              isExpanded 
                ? Positioned.fill(
                    child: GestureDetector(
                      onDoubleTapDown: (details) {
                        final x = details.localPosition.dx;
                        final width = MediaQuery.of(context).size.width;
                        if (x < width / 2) {
                          _playbackService.skipBackward();
                        } else {
                          _playbackService.skipForward();
                        }
                      },
                      child: _buildMainVideoArea(state),
                    ),
                  )
                : GestureDetector(
                    onDoubleTapDown: (details) {
                      final x = details.localPosition.dx;
                      final width = MediaQuery.of(context).size.width;
                      if (x < width / 2) {
                        _playbackService.skipBackward();
                      } else {
                        _playbackService.skipForward();
                      }
                    },
                    child: _buildMainVideoArea(state),
                  ),

              // THE FULLSCREEN CONTROLS
              if (isExpanded)
                Positioned(
                  top: 30, // More space for notches
                  right: 30,
                  child: Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          state.isZoomed ? Icons.aspect_ratio_rounded : Icons.fit_screen_rounded,
                          color: Colors.white,
                          size: 32,
                        ),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          _playbackService.toggleZoom();
                        },
                      ),
                      const SizedBox(width: 10),
                      IconButton(
                        icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white, size: 40),
                        onPressed: () => _playbackService.toggleExpansion(),
                      ),
                    ],
                  ).animate().fadeIn(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainVideoArea(PlaybackState state) {
    if (!state.isExpanded) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerWidget(state),
          ),
          _buildMetadataBar(state),
        ],
      );
    }

    // Fullscreen View
    return _buildFullscreenVideo(state);
  }

  Widget _buildFullscreenVideo(PlaybackState state) {
    if (state.isZoomed) {
      // MX Player style "Fill Screen" (BoxFit.cover)
      // We use a high-res base size so the PlatformView doesn't collapse,
      // then scale it to cover the entire screen.
      return FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: 1280,
          height: 720,
          child: _buildPlayerWidget(state),
        ),
      );
    } else {
      // Normal mode (contain)
      return Center(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: _buildPlayerWidget(state),
        ),
      );
    }
  }

  Widget _buildPlayerWidget(PlaybackState state) {
    if (_playbackService.youtubeController == null) return const SizedBox.shrink();
    
    return _hasVideoError 
      ? _buildErrorFallback(state.version!)
      : YoutubePlayer(
          key: GlobalObjectKey(state.version!.youtubeVideoId),
          controller: _playbackService.youtubeController!,
        );
  }


  Widget _buildErrorFallback(SongVersion version) {
    return Container(
      color: Colors.black,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_outline_rounded, color: SolarizedTheme.red, size: 40),
          const SizedBox(height: 12),
          Text("Video restricted", style: GoogleFonts.montserrat(color: Colors.white, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildMetadataBar(PlaybackState state) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              state.version!.thumbnailUrl ?? state.song!.albumArt,
              width: 45, height: 45, fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(state.song!.title, style: GoogleFonts.montserrat(color: SolarizedTheme.base3, fontSize: 14, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(state.song!.artist, style: GoogleFonts.montserrat(color: SolarizedTheme.cyan, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.fullscreen_rounded, color: SolarizedTheme.base1, size: 26), onPressed: () => _playbackService.toggleExpansion()),
          IconButton(icon: Icon(state.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded, color: SolarizedTheme.base3, size: 32), onPressed: () => _playbackService.togglePlayPause()),
          IconButton(icon: const Icon(Icons.close_rounded, color: SolarizedTheme.base01, size: 20), onPressed: () => _playbackService.stop()),
        ],
      ),
    );
  }
}
