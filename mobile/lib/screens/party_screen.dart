import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';

class PartyScreen extends StatelessWidget {
  const PartyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text(
            "Sync playback with your squad.",
            style: TextStyle(color: SolarizedTheme.base01, fontSize: 16),
          ),
          const Spacer(),
          Center(
            child: Icon(
              Icons.speaker_group_rounded,
              size: 100,
              color: SolarizedTheme.magenta.withOpacity(0.4),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add_rounded),
              label: const Text("CREATE ROOM"),
              style: ElevatedButton.styleFrom(
                backgroundColor: SolarizedTheme.magenta,
                foregroundColor: SolarizedTheme.base2,
              ),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
