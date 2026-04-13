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
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);

    Widget content = SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // HEADBAND (Sleek curve)
          Positioned(
            top: 4,
            child: Container(
              width: size * 0.75,
              height: size * 0.5,
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: themeColor, width: 1.5),
                  left: BorderSide(color: themeColor, width: 1.5),
                  right: BorderSide(color: themeColor, width: 1.5),
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(50)),
              ),
            ),
          ),
          // Earpad Left (Slimmer)
          Positioned(
            left: 2,
            bottom: 4,
            child: _buildEarpad(isSelected),
          ),
          // Earpad Right (Slimmer)
          Positioned(
            right: 2,
            bottom: 4,
            child: _buildEarpad(isSelected),
          ),
          // Floating Music Notes (only render when selected)
          if (isSelected) ...[
            // Left floating note
            Positioned(
              left: -5,
              bottom: 15,
              child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.magenta, size: 10)
                  .animate(onPlay: (controller) => controller.repeat())
                  .fade(duration: 200.ms)
                  .move(begin: const Offset(0, 0), end: const Offset(-12, -18), duration: 1200.ms, curve: Curves.easeOut)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1.1, 1.1), duration: 1200.ms)
                  .fadeOut(delay: 800.ms, duration: 400.ms),
            ),
            // Right floating note
            Positioned(
              right: -2,
              bottom: 17,
              child: const Icon(Icons.music_note_rounded, color: SolarizedTheme.magenta, size: 8)
                  .animate(onPlay: (controller) => controller.repeat(), delay: 600.ms)
                  .fade(duration: 200.ms)
                  .move(begin: const Offset(0, 0), end: const Offset(12, -15), duration: 1100.ms, curve: Curves.easeOut)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1.2, 1.2), duration: 1100.ms)
                  .fadeOut(delay: 700.ms, duration: 400.ms),
            ),
          ],
        ],
      ),
    );

    if (isSelected) {
      content = content
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .scaleXY(begin: 1.0, end: 1.12, duration: 400.ms, curve: Curves.easeInOutSine)
          .shimmer(duration: 2500.ms, color: SolarizedTheme.base3.withOpacity(0.4));
    }

    return content;
  }

  Widget _buildEarpad(bool isSelected) {
    return Container(
      width: size * 0.22,
      height: size * 0.45,
      decoration: BoxDecoration(
        color: isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6),
        borderRadius: BorderRadius.circular(size), // Pill shaped
      ),
    );
  }
}
