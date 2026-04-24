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
import 'branded_loader.dart';

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
  
  bool? _isCurrentlyLandscape;
  bool _showControls = true;
  Timer? _hideTimer;
  bool _wasExpanded = false;

  @override
  void initState() {
    super.initState();
    _startHideTimer();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    super.dispose();
  }

  void _startHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _showControls) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) _startHideTimer();
  }

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
        return _buildPlayerContainer(state);
      },
    );
  }

  Widget _buildPlayerContainer(PlaybackState state) {
    final bool isExpanded = state.isExpanded;
    final size = MediaQuery.of(context).size;

    _handleOrientation(isExpanded);

    if (isExpanded && !_wasExpanded) {
      _showControls = true;
      _startHideTimer();
    }
    _wasExpanded = isExpanded;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
      width: size.width,
      height: isExpanded ? size.height : 80,
      margin: isExpanded ? EdgeInsets.zero : const EdgeInsets.only(bottom: 95),
      decoration: BoxDecoration(
        color: isExpanded ? Colors.black : SolarizedTheme.base02.withOpacity(0.98),
        border: isExpanded ? null : Border(
          top: BorderSide(color: SolarizedTheme.cyan.withOpacity(0.3), width: 1.5),
          bottom: BorderSide(color: SolarizedTheme.cyan.withOpacity(0.3), width: 1.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, -5),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: _buildMainVideoArea(state),
          ),
          if (!isExpanded)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => _playbackService.toggleExpansion(),
                behavior: HitTestBehavior.translucent,
              ),
            ),
          if (isExpanded)
            Positioned.fill(
              child: GestureDetector(
                onTap: _toggleControls,
                behavior: HitTestBehavior.opaque,
              ),
            ),
          if (isExpanded)
            AnimatedOpacity(
              opacity: _showControls ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: IgnorePointer(
                ignoring: !_showControls,
                child: _buildControlOverlay(state),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildControlOverlay(PlaybackState state) {
    return Stack(
      children: [
        Positioned.fill(
          child: Container(color: Colors.black26),
        ),
        Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildOverlayCircleButton(
                icon: Icons.replay_10_rounded,
                onPressed: () {
                  _playbackService.skipBackward();
                  _startHideTimer();
                },
              ),
              const SizedBox(width: 40),
              _buildOverlayCircleButton(
                icon: state.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                size: 80,
                iconSize: 50,
                onPressed: () {
                  _playbackService.togglePlayPause();
                  _startHideTimer();
                },
              ),
              const SizedBox(width: 40),
              _buildOverlayCircleButton(
                icon: Icons.forward_10_rounded,
                onPressed: () {
                  _playbackService.skipForward();
                  _startHideTimer();
                },
              ),
            ],
          ),
        ),
        Positioned(
          top: 30,
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
                  _startHideTimer();
                },
              ),
              const SizedBox(width: 10),
              IconButton(
                icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white, size: 40),
                onPressed: () => _playbackService.toggleExpansion(),
              ),
            ],
          ),
        ),
        _buildProSeeker(state),
      ],
    );
  }

  Widget _buildOverlayCircleButton({
    required IconData icon,
    required VoidCallback onPressed,
    double size = 60,
    double iconSize = 35,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        onPressed();
      },
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black45,
          border: Border.all(color: Colors.white24),
        ),
        child: Icon(icon, color: Colors.white, size: iconSize),
      ),
    );
  }

  Widget _buildMainVideoArea(PlaybackState state) {
    if (!state.isExpanded) {
      return Row(
        children: [
          SizedBox(
            width: 130,
            height: 80,
            child: ClipRRect(
              child: _buildPlayerWidget(state),
            ),
          ),
          Expanded(child: _buildMetadataBar(state)),
        ],
      );
    }
    return _buildFullscreenVideo(state);
  }

  Widget _buildFullscreenVideo(PlaybackState state) {
    final size = MediaQuery.of(context).size;
    if (state.isZoomed) {
      final screenAspect = size.width / size.height;
      final videoAspect = 16 / 9;
      double scale = screenAspect > videoAspect ? screenAspect / videoAspect : videoAspect / screenAspect;
      return Center(
        child: Transform.scale(
          scale: scale,
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerWidget(state),
          ),
        ),
      );
    } else {
      return Center(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: _buildPlayerWidget(state),
        ),
      );
    }
  }

  Widget _buildProSeeker(PlaybackState state) {
    final controller = _playbackService.youtubeController;
    if (controller == null) return const SizedBox.shrink();

    return StreamBuilder<Duration>(
      stream: Stream.periodic(const Duration(milliseconds: 500)).asyncMap((_) async {
        try {
          final seconds = await controller.currentTime;
          return Duration(milliseconds: (seconds * 1000).toInt());
        } catch (_) {
          return Duration.zero;
        }
      }),
      builder: (context, snapshot) {
        final position = snapshot.data ?? Duration.zero;
        final Duration currentDuration = (state.version?.duration != null && state.version!.duration != Duration.zero)
            ? state.version!.duration
            : controller.value.metaData.duration;

        return Positioned(
          bottom: 40,
          left: 40,
          right: 40,
          child: _ProSeekerBar(
            position: position,
            duration: currentDuration,
            onSeek: (newPosition) {
              controller.seekTo(seconds: newPosition.inSeconds.toDouble(), allowSeekAhead: true);
            },
            onInteraction: _startHideTimer,
          ),
        );
      },
    );
  }

  Widget _buildPlayerWidget(PlaybackState state) {
    final controller = _playbackService.youtubeController;
    if (controller == null) return const Center(child: BrandedLoader(size: 40));
    
    return _hasVideoError 
      ? _buildErrorFallback(state.version!)
      : RepaintBoundary(
          child: YoutubePlayer(
            key: GlobalObjectKey(state.version!.youtubeVideoId),
            controller: controller,
          ),
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
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(state.song!.title, style: GoogleFonts.montserrat(color: SolarizedTheme.base3, fontSize: 13, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(state.song!.artist, style: GoogleFonts.montserrat(color: SolarizedTheme.cyan, fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.fullscreen_rounded, color: SolarizedTheme.base1, size: 24), 
            onPressed: () => _playbackService.toggleExpansion(),
          ),
          IconButton(
            icon: Icon(state.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded, color: SolarizedTheme.base3, size: 28), 
            onPressed: () {
              HapticFeedback.lightImpact();
              _playbackService.togglePlayPause();
            },
          ).animate(key: ValueKey(state.isPlaying))
           .scale(duration: 150.ms, curve: Curves.easeOutBack),
          IconButton(icon: const Icon(Icons.close_rounded, color: SolarizedTheme.base01, size: 20), onPressed: () => _playbackService.stop()),
        ],
      ),
    );
  }
}

class _ProSeekerBar extends StatefulWidget {
  final Duration position;
  final Duration duration;
  final Function(Duration) onSeek;
  final VoidCallback? onInteraction;

  const _ProSeekerBar({
    required this.position,
    required this.duration,
    required this.onSeek,
    this.onInteraction,
  });

  @override
  State<_ProSeekerBar> createState() => _ProSeekerBarState();
}

class _ProSeekerBarState extends State<_ProSeekerBar> {
  double? _dragValue;
  bool _isDragging = false;
  DateTime _lastSeekTime = DateTime.now();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        final double max = widget.duration.inSeconds.toDouble();
        final double value = _isDragging 
            ? (_dragValue ?? widget.position.inSeconds.toDouble()) 
            : widget.position.inSeconds.toDouble();
        final double percent = max > 0 ? (value / max).clamp(0.0, 1.0) : 0.0;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedOpacity(
              opacity: _isDragging ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                margin: const EdgeInsets.only(bottom: 30),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.85),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: SolarizedTheme.cyan.withOpacity(0.5), width: 2),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 15, spreadRadius: 5),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatDuration(Duration(seconds: value.toInt())),
                      style: GoogleFonts.outfit(
                        color: SolarizedTheme.cyan,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      " / ${_formatDuration(widget.duration)}",
                      style: GoogleFonts.outfit(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapDown: (details) {
                if (max <= 0) return;
                _handleDragUpdate(details.localPosition.dx, width, max);
                setState(() => _isDragging = true);
                HapticFeedback.mediumImpact();
              },
              onHorizontalDragStart: (details) {
                if (max <= 0) return;
                _handleDragUpdate(details.localPosition.dx, width, max);
                setState(() => _isDragging = true);
              },
              onHorizontalDragUpdate: (details) {
                if (max <= 0) return;
                _handleDragUpdate(details.localPosition.dx, width, max);
              },
              onHorizontalDragEnd: (_) => _handleDragEnd(),
              onTapUp: (_) => _handleDragEnd(),
              onHorizontalDragCancel: () => _handleDragEnd(),
              child: Container(
                height: 60,
                padding: const EdgeInsets.only(bottom: 10),
                alignment: Alignment.bottomCenter,
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.bottomLeft,
                  children: [
                    Container(
                      height: 6,
                      width: width,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    AnimatedContainer(
                      duration: _isDragging ? Duration.zero : const Duration(milliseconds: 200),
                      height: _isDragging ? 10 : 6,
                      width: width * percent,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            SolarizedTheme.cyan.withOpacity(0.7),
                            SolarizedTheme.cyan,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(5),
                        boxShadow: [
                          if (_isDragging)
                            BoxShadow(
                              color: SolarizedTheme.cyan.withOpacity(0.6),
                              blurRadius: 15,
                              spreadRadius: 2,
                            ),
                        ],
                      ),
                    ),
                    if (_isDragging)
                      Positioned(
                        left: (width * percent) - 30,
                        bottom: -25,
                        child: Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [SolarizedTheme.cyan.withOpacity(0.3), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      left: (width * percent) - (_isDragging ? 15 : 8),
                      bottom: _isDragging ? -10 : -5,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: _isDragging ? 30 : 16,
                        height: _isDragging ? 30 : 16,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: SolarizedTheme.cyan,
                            width: _isDragging ? 4 : 2,
                          ),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, 4)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _handleDragUpdate(double x, double width, double max) {
    if (max <= 0) return;
    final newValue = (x / width * max).clamp(0.0, max);
    setState(() {
      _dragValue = newValue;
    });
    widget.onInteraction?.call();
    if (DateTime.now().difference(_lastSeekTime).inMilliseconds > 100) {
      widget.onSeek(Duration(seconds: newValue.toInt()));
      _lastSeekTime = DateTime.now();
    }
  }

  void _handleDragEnd() {
    if (_dragValue != null) {
      widget.onSeek(Duration(seconds: _dragValue!.toInt()));
    }
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _isDragging = false;
          _dragValue = null;
        });
      }
    });
    HapticFeedback.lightImpact();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return "$minutes:$seconds";
  }
}
