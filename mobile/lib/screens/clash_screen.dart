import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';

class ClashScreen extends StatelessWidget {
  const ClashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text(
            "Challenge friends & earn XP.",
            style: TextStyle(color: SolarizedTheme.base01, fontSize: 16),
          ),
          const Spacer(),
          Center(
            child: Icon(
              Icons.bolt_rounded,
              size: 100,
              color: SolarizedTheme.cyan.withOpacity(0.4),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.person_add_rounded),
              label: const Text("FIND FRIENDS"),
              style: ElevatedButton.styleFrom(
                backgroundColor: SolarizedTheme.cyan,
                foregroundColor: SolarizedTheme.base03,
              ),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
