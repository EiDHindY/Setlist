import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class BleedingClashIcon extends StatefulWidget {
  final bool isSelected;
  final double size;

  const BleedingClashIcon({
    super.key,
    required this.isSelected,
    this.size = 28,
  });

  @override
  State<BleedingClashIcon> createState() => _BleedingClashIconState();
}

class _BleedingClashIconState extends State<BleedingClashIcon> with SingleTickerProviderStateMixin {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size + 10,
      height: widget.size + 15, // Extra height for the drips
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // The base music note
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            child: Icon(
              Icons.music_note_rounded,
              size: widget.size,
              color: widget.isSelected ? SolarizedTheme.magenta : SolarizedTheme.base01.withOpacity(0.6),
            ),
          )
          .animate(target: widget.isSelected ? 1 : 0)
          .shimmer(duration: 2000.ms, color: SolarizedTheme.base3.withOpacity(0.5)),

          // Dripping animation when selected
          if (widget.isSelected) ...[
            // Drip 1
            Positioned(
              left: (widget.size / 2) - 6,
              top: widget.size + 2, // Start at the bottom of the note
              child: _buildDrip().animate(onPlay: (controller) => controller.repeat())
                .fade(duration: 200.ms)
                .scaleY(begin: 0.5, end: 1.5, duration: 600.ms, curve: Curves.easeIn) // Stretch down
                .moveY(begin: 0, end: 15, duration: 800.ms) // Fall
                .fadeOut(delay: 500.ms, duration: 200.ms), // Snap and disappear
            ),
            // Drip 2
            Positioned(
              left: (widget.size / 2) + 2,
              top: widget.size + 2, // Start at the bottom of the note
              child: _buildDrip().animate(onPlay: (controller) => controller.repeat(), delay: 600.ms)
                .fade(duration: 200.ms)
                .scaleY(begin: 0.5, end: 1.5, duration: 600.ms, curve: Curves.easeIn)
                .moveY(begin: 0, end: 10, duration: 800.ms)
                .fadeOut(delay: 400.ms, duration: 200.ms),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildDrip() {
    return Container(
      width: 4,
      height: 6,
      decoration: const BoxDecoration(
        color: SolarizedTheme.magenta,
        borderRadius: BorderRadius.all(Radius.elliptical(4, 6)),
      ),
    );
  }
}
