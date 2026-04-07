import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/under_development_state.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: UnderDevelopmentState(
        title: "PROFILE",
        icon: Icons.person_rounded,
      ),
    );
  }
}
