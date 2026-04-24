/// ── APP CONFIGURATION ──────────────────────────────────────────────
/// Central hub that tells the entire app which build flavor is running.
/// Set once at startup, read everywhere.

enum AppFlavor { playstore, vip }

class AppConfig {
  static late AppFlavor flavor;

  /// Track if the logo has already animated in this session to prevent repeats
  static bool hasLogoAnimated = false;

  /// Quick check: Are we running the VIP build?
  static bool get isVip => flavor == AppFlavor.vip;

  /// Quick check: Are we running the PlayStore build?
  static bool get isPlayStore => flavor == AppFlavor.playstore;

  /// ── CONNECTIVITY ────────────────────────────────────────────────
  
  /// The current local IP of the backend machine (Fedora)
  static const String backendIp = '192.168.1.9';
  
  /// Base URL for the C# API
  static String get baseUrl => 'http://$backendIp:5169/api';
}
