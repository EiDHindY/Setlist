import 'dart:async';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';
import 'package:just_audio/just_audio.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import '../config/app_config.dart';
import '../models/song_model.dart';

/// ── PLAYBACK SERVICE ───────────────────────────────────────────────
/// Abstracts audio/video playback so each build flavor gets the right capabilities.

enum PlaybackMode { video, audio }

class PlaybackState {
  final Song? song;
  final SongVersion? version;
  final bool isPlaying;
  final PlaybackMode mode;
  final bool isExpanded;
  final bool isZoomed;

  PlaybackState({
    this.song,
    this.version,
    this.isPlaying = false,
    this.mode = PlaybackMode.video,
    this.isExpanded = false,
    this.isZoomed = false,
  });

  PlaybackState copyWith({
    Song? song,
    SongVersion? version,
    bool? isPlaying,
    PlaybackMode? mode,
    bool? isExpanded,
    bool? isZoomed,
  }) {
    return PlaybackState(
      song: song ?? this.song,
      version: version ?? this.version,
      isPlaying: isPlaying ?? this.isPlaying,
      mode: mode ?? this.mode,
      isExpanded: isExpanded ?? this.isExpanded,
      isZoomed: isZoomed ?? this.isZoomed,
    );
  }
}

class PlaybackService {
  static final PlaybackService _instance = PlaybackService._internal();
  factory PlaybackService() => _instance;
  PlaybackService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  YoutubePlayerController? _youtubeController;
  
  final _stateController = StreamController<PlaybackState>.broadcast();
  Stream<PlaybackState> get stateStream => _stateController.stream;
  
  PlaybackState _state = PlaybackState();
  PlaybackState get state => _state;
  
  // ── Getters ──────────────────────────────────────────────────
  
  AudioPlayer get audioPlayer => _audioPlayer;
  YoutubePlayerController? get youtubeController => _youtubeController;
  bool get isPlaying => _state.isPlaying;

  /// Can this build switch to audio mode?
  /// For now, we stay in Video mode to ensure "Official" playback works.
  bool get canSwitchToAudio => false; 
  
  List<PlaybackMode> get availableModes => [PlaybackMode.video];

  // ── Core Playback ───────────────────────────────────────────

  void play(Song song, SongVersion version) {
    // Toggle if same video
    if (_state.version?.youtubeVideoId == version.youtubeVideoId) {
      togglePlayPause();
      return;
    }

    // Initialize/Update YouTube Controller
    _youtubeController?.close();
    _youtubeController = YoutubePlayerController.fromVideoId(
      videoId: version.youtubeVideoId,
      autoPlay: true,
      params: const YoutubePlayerParams(
        showFullscreenButton: false, // Disable the buggy button
        mute: false,
        showControls: true,
        playsInline: true,
        origin: 'https://www.youtube-nocookie.com',
      ),
    );

    _state = PlaybackState(
      song: song,
      version: version,
      isPlaying: true,
      mode: PlaybackMode.video,
      isExpanded: false,
    );
    _stateController.add(_state);
    
    _audioPlayer.stop();
  }

  void stop() {
    _audioPlayer.stop();
    _youtubeController?.close();
    _youtubeController = null;
    _state = PlaybackState(
      song: null,
      version: null,
      isPlaying: false,
      mode: _state.mode,
    );
    _stateController.add(_state);
  }

  void togglePlayPause() {
    if (_state.song == null) return;
    
    final newIsPlaying = !_state.isPlaying;
    if (_youtubeController != null) {
      if (newIsPlaying) {
        _youtubeController!.playVideo();
      } else {
        _youtubeController!.pauseVideo();
      }
    }

    _state = _state.copyWith(isPlaying: newIsPlaying);
    _stateController.add(_state);
  }

  void toggleExpansion() {
    _state = _state.copyWith(isExpanded: !_state.isExpanded);
    if (!_state.isExpanded) _state = _state.copyWith(isZoomed: false);
    _stateController.add(_state);
  }

  void toggleZoom() {
    if (!_state.isExpanded) return;
    _state = _state.copyWith(isZoomed: !_state.isZoomed);
    _stateController.add(_state);
  }

  Future<void> skipForward() async {
    if (_youtubeController == null) return;
    final current = await _youtubeController!.currentTime;
    _youtubeController!.seekTo(seconds: current + 10);
  }

  Future<void> skipBackward() async {
    if (_youtubeController == null) return;
    final current = await _youtubeController!.currentTime;
    _youtubeController!.seekTo(seconds: current - 10);
  }

  void setMode(PlaybackMode mode) {
    // Simplified for official playback
    _state = _state.copyWith(mode: PlaybackMode.video);
    _stateController.add(_state);
  }

  void dispose() {
    _audioPlayer.dispose();
    _stateController.close();
  }
}
