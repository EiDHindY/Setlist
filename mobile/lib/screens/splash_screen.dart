import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/animated_logo.dart';
import '../config/app_config.dart';
import '../widgets/auth_wrapper.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: Center(
        child: AnimatedSolarizedLogo(
          onComplete: () {
            // Mark as animated so future wrappers skip the drawing
            AppConfig.hasLogoAnimated = true;
            
            // Smooth transition to the AuthWrapper
            Navigator.of(context).pushReplacement(
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) => const AuthWrapper(),
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return FadeTransition(
                    opacity: animation,
                    child: child,
                  );
                },
                transitionDuration: const Duration(milliseconds: 800),
              ),
            );
          },
        ),
      ),
    );
  }
}
