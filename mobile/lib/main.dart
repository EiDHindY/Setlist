import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme/solarized_theme.dart';
import 'screens/login_screen.dart';
import 'layouts/main_layout.dart';
import 'services/auth_service.dart';
import 'widgets/branded_loader.dart';

Future<void> main() async {
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
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    // Listen to the authentication state stream (Reactive!)
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
        
        // If we have a session, trigger backend sync and go to the Smart Home Page
        if (session != null) {
          // Trigger the "Hello!" to the C# Backend (Async)
          AuthService.syncUserWithBackend(session);
          
          return const MainLayout();
        } 
        
        // No session? Stay on the Solarized Login screen
        return const LoginScreen();
      },
    );
  }
}
