import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';
import '../widgets/animated_logo.dart';
import '../widgets/exit_dialog.dart';

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
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldExit = await showExitDialog(context);
        if (shouldExit) SystemNavigator.pop();
      },
      child: Scaffold(
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
            const AnimatedSolarizedLogo(width: 320, height: 350),
            
            const SizedBox(height: 40),
            
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
              

          ],
        ),
      ),
    ),
    );
  }
}
