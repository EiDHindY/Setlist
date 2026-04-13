import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/solarized_theme.dart';
import '../../models/nav_models.dart';

class SubNavItem extends StatelessWidget {
  final int index;
  final SubNavItemData item; // Use the new data model
  final bool isSelected;
  final VoidCallback onTap;

  const SubNavItem({
    super.key,
    required this.index,
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          margin: const EdgeInsets.symmetric(vertical: 9), // (50 - 32) / 2 = 9px margin top/bottom
          height: 32,
          decoration: BoxDecoration(
            color: isSelected ? SolarizedTheme.cyan.withValues(alpha: 0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? SolarizedTheme.cyan.withValues(alpha: 0.3) : Colors.transparent,
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Custom Icon Builder or Material Icon fallback
              item.customIconBuilder?.call(isSelected) ?? 
              Icon(item.icon!, color: color, size: isSelected ? 20 : 16),
              
              if (isSelected)
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        item.label.toUpperCase(),
                        style: GoogleFonts.montserrat(
                          color: SolarizedTheme.cyan,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ).animate().fadeIn(duration: 250.ms),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
