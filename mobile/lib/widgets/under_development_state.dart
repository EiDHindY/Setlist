import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class UnderDevelopmentState extends StatelessWidget {
  final String title;
  final IconData icon;

  const UnderDevelopmentState({
    super.key,
    required this.title,
    this.icon = Icons.construction_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Glassmorphic Icon Container
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: SolarizedTheme.base02.withOpacity(0.5),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: SolarizedTheme.base01, width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Center(
                    child: Icon(
                      icon,
                      size: 48,
                      color: SolarizedTheme.cyan,
                    ),
                  ),
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.05, 1.05), duration: 2.seconds, curve: Curves.easeInOutSine)
             .shimmer(duration: 3.seconds, color: SolarizedTheme.base3.withOpacity(0.3)),

            const SizedBox(height: 32),

            Text(
              "Under Development",
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: SolarizedTheme.base2, 
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ).animate().fade(delay: 300.ms).slideY(begin: 0.2),

            const SizedBox(height: 12),

            Text(
              "The $title feature is currently being tuned for a premium experience. Check back soon!",
              textAlign: TextAlign.center,
              style: TextStyle(color: SolarizedTheme.base01, height: 1.5),
            ).animate().fade(delay: 600.ms).slideY(begin: 0.2),
          ],
        ),
      ),
    );
  }
}
