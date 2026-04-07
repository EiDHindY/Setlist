import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/under_development_state.dart';

class ClashScreen extends StatelessWidget {
  const ClashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: UnderDevelopmentState(
        title: "CLASH",
        icon: Icons.bolt_rounded,
      ),
    );
  }
}
