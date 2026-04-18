import 'config/app_config.dart';
import 'main.dart';

/// ── VIP ENTRY POINT ────────────────────────────────────────────────
/// This is the entry point for the VIP (private) build.
/// Uses unofficial YouTube search, supports both video AND audio-only
/// playback with background play in audio mode.
/// 
/// Build command:
///   flutter run --flavor vip -t lib/main_vip.dart
///   flutter build apk --flavor vip -t lib/main_vip.dart
void main() {
  AppConfig.flavor = AppFlavor.vip;
  appMain();
}
