import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/under_development_state.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: UnderDevelopmentState(
        title: "HOME",
        icon: Icons.dashboard_rounded,
      ),
    );
  }
}
