import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class MixerIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const MixerIcon({
    super.key,
    required this.isSelected,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);
    
    return RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildFader(0, color),
            _buildFader(1, color),
            _buildFader(2, color),
          ],
        ),
      ),
    );
  }

  Widget _buildFader(int index, Color color) {
    // Determine the positions for the knobs
    // Using a simple wave pattern for the selected state
    double beginPos = 0.3; // Default middle-ish
    if (index == 1) {
      beginPos = 0.6;
    } else if (index == 2) {
      beginPos = 0.4;
    }

    return Container(
      width: 2, // Very thin elegant track
      height: size * 0.8,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(1),
      ),
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // The track (already background of container)
          
          // The Knob (Thumb)
          Container(
            width: 6,
            height: 3,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(1),
              boxShadow: isSelected ? [
                BoxShadow(
                  color: color.withValues(alpha: 0.3),
                  blurRadius: 4,
                  spreadRadius: 0.5,
                )
              ] : null,
            ),
          ).maybeAnimate(isSelected, (anim) => anim.moveY(
            begin: index == 0 ? -4 : (index == 1 ? 4 : 0),
            end: index == 0 ? 4 : (index == 1 ? -4 : 0),
            duration: 1000.ms,
            delay: (index * 200).ms,
            curve: Curves.easeInOutSine
          )),
        ],
      ),
    );
  }
}

extension on Widget {
  Widget maybeAnimate(bool shouldAnimate, Widget Function(Animate) builder) {
    if (!shouldAnimate) return this;
    return builder(animate(onPlay: (c) => c.repeat(reverse: true)));
  }
}
