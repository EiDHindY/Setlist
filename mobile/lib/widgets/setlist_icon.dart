import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class SetlistIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const SetlistIcon({
    super.key,
    required this.isSelected,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);

    return RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size,
        child: ClipRect(
          child: CustomPaint(
            painter: _SetlistPainter(
              color: themeColor,
              isSelected: isSelected,
            ),
          ).maybeAnimate(isSelected, (anim) => anim.custom(
            duration: 2000.ms,
            builder: (context, value, child) {
              return CustomPaint(
                size: Size(size, size),
                painter: _SetlistPainter(
                  color: themeColor,
                  isSelected: isSelected,
                  scrollProgress: value,
                ),
              );
            },
          )),
        ),
      ),
    );
  }
}

class _SetlistPainter extends CustomPainter {
  final Color color;
  final bool isSelected;
  final double scrollProgress;

  _SetlistPainter({
    required this.color,
    required this.isSelected,
    this.scrollProgress = 0.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;

    // Draw Scrolling List Bars
    final barStartX = 0.0;
    final barEndX = w - 1;
    final barSpacing = h * 0.3;
    final totalBars = 4;

    for (int i = -1; i < totalBars; i++) {
        // Calculate Y with wrap-around logic
        double y = (i * barSpacing) + (scrollProgress * barSpacing);
        
        // Only draw if within visible range (plus a bit for smoothness)
        if (y > -5 && y < h + 5) {
            // Vary the bar width slightly for a skeletal feel
            final widthReduction = (i % 2 == 0) ? w * 0.1 : 0.0;
            canvas.drawLine(
                Offset(barStartX, y), 
                Offset(barEndX - widthReduction, y), 
                paint..color = color.withValues(alpha: isSelected ? 0.8 : 0.4)
            );
        }
    }
  }

  @override
  bool shouldRepaint(covariant _SetlistPainter oldDelegate) {
    return oldDelegate.color != color || 
           oldDelegate.isSelected != isSelected || 
           oldDelegate.scrollProgress != scrollProgress;
  }
}

extension on Widget {
  Widget maybeAnimate(bool shouldAnimate, Widget Function(Animate) builder) {
    if (!shouldAnimate) return this;
    return builder(animate(onPlay: (c) => c.repeat()));
  }
}
