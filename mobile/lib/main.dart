import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme/solarized_theme.dart';
import 'screens/login_screen.dart';
import 'layouts/main_layout.dart';
import 'services/auth_service.dart';
import 'widgets/branded_loader.dart';
import 'screens/splash_screen.dart';
import 'screens/search_screen.dart';
import 'widgets/auth_splash_wrapper.dart';
import 'services/share_service.dart';
import 'widgets/unified_player.dart';
import 'package:google_fonts/google_fonts.dart';

/// ── SHARED APP MAIN ────────────────────────────────────────────────
/// This is the shared entry point called by both main_playstore.dart
/// and main_vip.dart AFTER they set AppConfig.flavor.
Future<void> appMain() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Enter fullscreen immersive mode (hides status bar and navigation bar)
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  
  // Make system overlays fully transparent so app draws edge-to-edge
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  
  // Initialize Supabase with the project credentials
  await Supabase.initialize(
    url: 'https://ajxgthpcjbqhygxjvtcf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeGd0aHBjamJxaHlneGp2dGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjk5MjQsImV4cCI6MjA5MDgwNTkyNH0.L90HmJXIw7qhordu6FEUc3nGcYgoruFlR3F6kVhFkwQ',
  );

  // Initialize Sharing Service
  ShareService().init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Setlist',
      theme: SolarizedTheme.darkTheme,
      home: const SplashScreen(),
      builder: (context, child) {
        return Material(
          color: Colors.transparent,
          child: Stack(
            children: [
              if (child != null) child,
              const Align(
                alignment: Alignment.bottomCenter,
                child: UnifiedPlayer(),
              ),
            ],
          ),
        );
      },
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  String? _lastSessionId;
  StreamSubscription? _shareSubscription;

  @override
  void initState() {
    super.initState();
    // Listen for incoming share intents
    _shareSubscription = ShareService().linkStream.listen((link) {
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => SearchScreen(initialQuery: link),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _shareSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: SolarizedTheme.base03,
            body: Center(child: BrandedLoader(size: 100)),
          );
        }

        final session = snapshot.data?.session;
        
        if (session != null) {
          final isNewUser = _lastSessionId != session.user.id;
          _lastSessionId = session.user.id;

          // If it's a completely NEW user login, show the transition splash
          if (isNewUser) {
             return AuthSplashWrapper(
               onReady: () => AuthService.syncUserWithBackend(session),
               key: ValueKey(session.user.id), // Force rebuild only for NEW user
               child: const MainLayout(),
             );
          }
          
          // Stable return ensures session refreshes don't reset the UI index
          return const MainLayout();
        } 
        
        _lastSessionId = null;
        return const LoginScreen();
      },
    );
  }
}
