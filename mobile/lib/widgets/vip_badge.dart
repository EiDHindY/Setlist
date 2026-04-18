import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';
import '../config/app_config.dart';

class VipBadge extends StatelessWidget {
  final double size;
  
  const VipBadge({super.key, this.size = 12.0});

  @override
  Widget build(BuildContext context) {
    if (!AppConfig.isVip) {
      return const SizedBox.shrink(); // Don't show anything in PlayStore build
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: size * 0.8, vertical: size * 0.3),
      decoration: BoxDecoration(
        color: const Color(0xFFb58900), // Solarized Yellow / Gold
        borderRadius: BorderRadius.circular(size),
        border: Border.all(color: SolarizedTheme.base03.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFb58900).withOpacity(0.4),
            blurRadius: size,
            spreadRadius: size * 0.1,
          )
        ],
      ),
      child: Text(
        "VIP",
        style: GoogleFonts.montserrat(
          color: SolarizedTheme.base03, // Dark text on gold background
          fontWeight: FontWeight.w900,
          fontSize: size,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}
