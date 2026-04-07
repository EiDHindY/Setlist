import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/under_development_state.dart';

class PartyScreen extends StatelessWidget {
  const PartyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: UnderDevelopmentState(
        title: "PARTY",
        icon: Icons.speaker_group_rounded,
      ),
    );
  }
}
