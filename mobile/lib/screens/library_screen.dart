import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20), // Global Header Space
          const Text(
            "Your imported songs & sets.",
            style: TextStyle(color: SolarizedTheme.base01, fontSize: 16),
          ),
          const Spacer(),
          Center(
            child: Icon(
              Icons.library_music_rounded,
              size: 80,
              color: SolarizedTheme.base01.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text(
              "No sets yet.",
              style: TextStyle(color: SolarizedTheme.base01),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
