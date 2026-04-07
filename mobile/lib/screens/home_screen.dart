import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20), // Placeholder space for the now global logo header
          const Text(
            "Curated for your ears only.",
            style: TextStyle(color: SolarizedTheme.base01, fontSize: 16),
          ).animate().fade(delay: 500.ms),
          
          const SizedBox(height: 48),
          
          // Smart Content Placeholder
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome_rounded, size: 64, color: SolarizedTheme.base01.withOpacity(0.5)),
                  const SizedBox(height: 16),
                  Text(
                    "Your feed is empty.",
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: SolarizedTheme.base01),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Ready to discover something new?",
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: SolarizedTheme.base01),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(backgroundColor: SolarizedTheme.cyan),
                    child: const Text("DISCOVER MUSIC"),
                  ),
                ],
              ),
            ).animate().fade(delay: 1500.ms),
          ),
        ],
      ),
    );
  }
}
