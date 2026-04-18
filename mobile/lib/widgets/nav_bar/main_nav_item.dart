import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/solarized_theme.dart';
import '../../widgets/bumping_headphones_icon.dart';
import '../../widgets/bleeding_clash_icon.dart';
import '../../widgets/synced_headsets_icon.dart';

class MainNavItem extends StatelessWidget {
  final int index;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget? iconOverride;

  const MainNavItem({
    super.key,
    required this.index,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.iconOverride,
  });

  @override
  Widget build(BuildContext context) {
    final themeColor = (index == 2) ? SolarizedTheme.magenta : SolarizedTheme.cyan;
    final color = isSelected ? themeColor : SolarizedTheme.base01.withValues(alpha: 0.6);

    Widget iconWidget;
    if (iconOverride != null) {
      iconWidget = iconOverride!;
    } else {
      switch (index) {
        case 1:
          iconWidget = BumpingHeadphonesIcon(isSelected: isSelected, size: 24);
          break;
        case 2:
          iconWidget = BleedingClashIcon(isSelected: isSelected, size: 24);
          break;
        case 3:
          iconWidget = SyncedHeadsetsIcon(isSelected: isSelected, size: 24);
          break;
        case 0:
          iconWidget = Icon(Icons.home_rounded, color: color, size: 24);
          break;
        default:
          iconWidget = Icon(Icons.person_rounded, color: color, size: 24);
      }
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOutCubic,
          padding: EdgeInsets.symmetric(
            horizontal: isSelected ? 8 : 0,
            vertical: isSelected ? 8 : 0,
          ),
          decoration: BoxDecoration(
            color: isSelected ? themeColor.withValues(alpha: 0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isSelected ? themeColor.withValues(alpha: 0.3) : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Center(
                  child: OverflowBox(
                    maxWidth: 40,
                    maxHeight: 40,
                    child: iconWidget,
                  ),
                ),
              ),
              if (isSelected)
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5),
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.montserrat(
                        color: themeColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
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
