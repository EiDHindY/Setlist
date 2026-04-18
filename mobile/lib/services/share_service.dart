import 'dart:async';
import 'package:share_handler/share_handler.dart';

class ShareService {
  static final ShareService _instance = ShareService._internal();
  factory ShareService() => _instance;
  ShareService._internal();

  final _linkController = StreamController<String>.broadcast();
  Stream<String> get linkStream => _linkController.stream;

  StreamSubscription? _mediaStreamSubscription;

  void init() {
    final handler = ShareHandler.instance;

    // 1. Handle content shared while the app is already running
    _mediaStreamSubscription = handler.sharedMediaStream.listen((SharedMedia media) {
      _processSharedMedia(media);
    });

    // 2. Handle content shared when the app was cold-started via the share action
    handler.getInitialSharedMedia().then((SharedMedia? media) {
      if (media != null) {
        _processSharedMedia(media);
      }
    });
  }

  void _processSharedMedia(SharedMedia media) {
    // YouTube shares arrive as text content
    final content = media.content;
    if (content != null && content.isNotEmpty) {
      final cleanedLink = _extractLink(content);
      if (cleanedLink != null) {
        _linkController.add(cleanedLink);
      }
    }
  }

  /// Extracts a raw YouTube URL from a shared string.
  /// YouTube often shares as: "Check this out! https://youtu.be/..."
  String? _extractLink(String text) {
    final youtubeRegex = RegExp(
      r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
    );
    final match = youtubeRegex.firstMatch(text);

    if (match != null) {
      // Pull out just the full URL from the surrounding text
      final urlMatch = RegExp(r'https?:\/\/[^\s]+').firstMatch(text);
      return urlMatch?.group(0) ?? text;
    }

    return null; // Not a YouTube link
  }

  void dispose() {
    _mediaStreamSubscription?.cancel();
    _linkController.close();
  }
}
