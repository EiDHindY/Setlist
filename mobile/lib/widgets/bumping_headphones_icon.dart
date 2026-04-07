import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class BumpingHeadphonesIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const BumpingHeadphonesIcon({
    super.key,
    required this.isSelected,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    Widget icon = AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      child: Icon(
        Icons.headphones_rounded,
        size: isSelected ? size : 24,
        color: isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6),
      ),
    );

    // Apply continuous bumping animation only when selected
    if (isSelected) {
      icon = icon
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .scaleXY(begin: 1.0, end: 1.15, duration: 300.ms, curve: Curves.easeInOutSine)
          .shimmer(duration: 2000.ms, color: SolarizedTheme.base3.withOpacity(0.5));
    }

    return SizedBox(
      width: size + 20,
      height: size + 20,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // Floating Music Notes (only render when selected)
          if (isSelected) ...[
            // Left floating note
            Positioned(
              left: -5,
              bottom: 10,
              child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.magenta, size: 12)
                  .animate(onPlay: (controller) => controller.repeat())
                  .fade(duration: 200.ms)
                  .move(begin: const Offset(0, 0), end: const Offset(-15, -20), duration: 1000.ms, curve: Curves.easeOut)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1.2, 1.2), duration: 1000.ms)
                  .fadeOut(delay: 700.ms, duration: 300.ms),
            ),
            // Right floating note
            Positioned(
              right: -2,
              bottom: 12,
              child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.magenta, size: 10)
                  .animate(onPlay: (controller) => controller.repeat(), delay: 500.ms)
                  .fade(duration: 200.ms)
                  .move(begin: const Offset(0, 0), end: const Offset(15, -18), duration: 900.ms, curve: Curves.easeOut)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1.3, 1.3), duration: 900.ms)
                  .fadeOut(delay: 600.ms, duration: 300.ms),
            ),
          ],
          
          // Base Headphone Icon (Bumps when selected)
          icon,
        ],
      ),
    );
  }
}
