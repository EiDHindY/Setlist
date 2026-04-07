import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class SyncedHeadsetsIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const SyncedHeadsetsIcon({
    super.key,
    required this.isSelected,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size + 20,
      height: size + 20,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // The Shared Equalizer (Middle)
          if (isSelected)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildBar(15).animate(onPlay: (c) => c.repeat(reverse: true)).scaleY(begin: 0.3, end: 1.2, duration: 400.ms),
                const SizedBox(width: 2),
                _buildBar(20).animate(onPlay: (c) => c.repeat(reverse: true)).scaleY(begin: 0.2, end: 1.5, duration: 300.ms, delay: 100.ms),
                const SizedBox(width: 2),
                _buildBar(12).animate(onPlay: (c) => c.repeat(reverse: true)).scaleY(begin: 0.4, end: 1.0, duration: 500.ms, delay: 200.ms),
              ],
            ),

          // Background Headphone (Cyan)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutBack,
            left: isSelected ? 4 : 8,
            top: isSelected ? 4 : 8,
            child: Opacity(
              opacity: isSelected ? 1.0 : 0.4,
              child: Icon(
                Icons.headphones_rounded,
                size: size,
                color: isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01,
              ),
            ),
          ),

          // Foreground Headphone (Magenta)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutBack,
            right: isSelected ? 4 : 8,
            bottom: isSelected ? 4 : 8,
            child: Icon(
              Icons.headphones_rounded,
              size: size,
              color: isSelected ? SolarizedTheme.magenta : SolarizedTheme.base01.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(double height) {
    return Container(
      width: 3,
      height: height,
      decoration: BoxDecoration(
        color: SolarizedTheme.base3,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}
