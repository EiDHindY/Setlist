import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';
import '../screens/login_screen.dart';
import '../layouts/main_layout.dart';
import '../services/auth_service.dart';
import '../widgets/branded_loader.dart';
import '../widgets/auth_splash_wrapper.dart';
import '../services/share_service.dart';
import '../screens/search_screen.dart';

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
          final isNewSession = _lastSessionId != session.user.id;
          _lastSessionId = session.user.id;

          // If it's a "fresh" login in this session, show the transition splash
          if (isNewSession) {
             return AuthSplashWrapper(
               onReady: () => AuthService.syncUserWithBackend(session),
               child: const MainLayout(),
             );
          }
          
          return const MainLayout();
        } 
        
        _lastSessionId = null;
        return const LoginScreen();
      },
    );
  }
}
