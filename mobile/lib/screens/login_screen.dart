import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    
    try {
      // TODO: Implement Google Sign-In logic with the Native plugin
      // For now, we will use the Supabase Auth UI pattern
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.setlist://login-callback/',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error signing in: $e'), backgroundColor: SolarizedTheme.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [SolarizedTheme.base03, SolarizedTheme.base02],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo / Branding
            const Icon(
              Icons.music_note_rounded,
              size: 100,
              color: SolarizedTheme.blue,
            )
            .animate()
            .fade(duration: 800.ms)
            .scale(delay: 200.ms)
            .shimmer(delay: 1000.ms, duration: 1500.ms, color: SolarizedTheme.cyan),
            
            const SizedBox(height: 24),
            
            Text(
              "SETLIST",
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: SolarizedTheme.blue,
                    fontSize: 48,
                    letterSpacing: 4,
                  ),
            )
            .animate()
            .fade(delay: 400.ms)
            .slideY(begin: 0.2, end: 0),
            
            Text(
              "The Music Clash Game",
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: SolarizedTheme.cyan,
                    letterSpacing: 1.2,
                  ),
            )
            .animate()
            .fade(delay: 600.ms),
            
            const SizedBox(height: 80),
            
            // Login Button
            if (_isLoading)
              const CircularProgressIndicator(color: SolarizedTheme.blue)
            else
              ElevatedButton.icon(
                onPressed: _handleGoogleSignIn,
                icon: const Icon(Icons.login_rounded),
                label: const Text("SIGN IN WITH GOOGLE"),
              )
              .animate()
              .fade(delay: 1000.ms)
              .scale(delay: 1100.ms, curve: Curves.elasticOut),
              
            const SizedBox(height: 16),
            
            Text(
              "Level 1 awaits your judgment.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: SolarizedTheme.base01,
                    fontStyle: FontStyle.italic,
                  ),
            )
            .animate()
            .fade(delay: 1500.ms),
          ],
        ),
      ),
    );
  }
}
