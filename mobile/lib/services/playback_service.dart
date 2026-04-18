import 'package:youtube_explode_dart/youtube_explode_dart.dart';
import 'package:just_audio/just_audio.dart';
import '../config/app_config.dart';

/// ── PLAYBACK SERVICE ───────────────────────────────────────────────
/// Abstracts audio/video playback so each build flavor gets the right capabilities.
/// 
/// PlayStore Build:
///   - Video only (via youtube_player_iframe, handled in the UI widget)
///   - No background playback
/// 
/// VIP Build:
///   - Video mode (same youtube_player_iframe widget)
///   - Audio mode (via just_audio, supports background playback)
///   - User can toggle between them

enum PlaybackMode { video, audio }

class PlaybackService {
  static final PlaybackService _instance = PlaybackService._internal();
  factory PlaybackService() => _instance;
  PlaybackService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  final YoutubeExplode _yt = YoutubeExplode();
  
  PlaybackMode _currentMode = PlaybackMode.video;
  String? _currentVideoId;
  
  // ── Getters ──────────────────────────────────────────────────
  
  PlaybackMode get currentMode => _currentMode;
  AudioPlayer get audioPlayer => _audioPlayer;
  String? get currentVideoId => _currentVideoId;
  bool get isPlaying => _audioPlayer.playing;

  /// Can this build switch to audio mode?
  bool get canSwitchToAudio => AppConfig.isVip;
  
  /// Get available playback modes for this build
  List<PlaybackMode> get availableModes {
    if (AppConfig.isVip) {
      return [PlaybackMode.video, PlaybackMode.audio];
    }
    return [PlaybackMode.video];
  }

  // ── Mode Switching ───────────────────────────────────────────
  
  void setMode(PlaybackMode mode) {
    if (mode == PlaybackMode.audio && !AppConfig.isVip) {
      print('⚠️ Audio mode is only available in the VIP build.');
      return;
    }
    _currentMode = mode;
  }

  // ── Audio Playback (VIP Only) ────────────────────────────────

  /// Extract audio stream URL and start playing via just_audio.
  /// This enables background playback on the VIP build.
  Future<void> playAudio(String videoId) async {
    if (!AppConfig.isVip) {
      print('⚠️ Audio playback is only available in the VIP build.');
      return;
    }

    try {
      _currentVideoId = videoId;
      
      // Get the audio-only stream manifest from YouTube
      final manifest = await _yt.videos.streamsClient.getManifest(videoId);
      
      // Pick the highest quality audio-only stream
      final audioStream = manifest.audioOnly.withHighestBitrate();
      
      // Feed it to just_audio
      await _audioPlayer.setUrl(audioStream.url.toString());
      await _audioPlayer.play();
      
      print('🎧 VIP Audio Playing: $videoId');
    } catch (e) {
      print('❌ PlaybackService: Audio playback failed: $e');
    }
  }

  /// Pause audio playback
  Future<void> pause() async {
    await _audioPlayer.pause();
  }

  /// Resume audio playback
  Future<void> resume() async {
    await _audioPlayer.play();
  }

  /// Stop and reset audio playback
  Future<void> stop() async {
    await _audioPlayer.stop();
    _currentVideoId = null;
  }

  /// Seek to a position
  Future<void> seek(Duration position) async {
    await _audioPlayer.seek(position);
  }

  /// Clean up resources
  void dispose() {
    _audioPlayer.dispose();
    _yt.close();
  }
}
