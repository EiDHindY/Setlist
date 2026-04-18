import 'config/app_config.dart';
import 'main.dart';

/// ── PLAYSTORE ENTRY POINT ──────────────────────────────────────────
/// This is the entry point for the Google Play Store build.
/// Uses official YouTube API, embedded video player only.
/// 
/// Build command:
///   flutter run --flavor playstore -t lib/main_playstore.dart
///   flutter build apk --flavor playstore -t lib/main_playstore.dart
void main() {
  AppConfig.flavor = AppFlavor.playstore;
  appMain();
}
