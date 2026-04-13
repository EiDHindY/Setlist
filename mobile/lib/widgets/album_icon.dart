import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class AlbumIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const AlbumIcon({
    super.key,
    required this.isSelected,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);

    Widget icon = SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _AlbumPainter(
          color: themeColor,
          isSelected: isSelected,
        ),
      ),
    );

    if (isSelected) {
      icon = icon.animate(onPlay: (c) => c.repeat())
          .rotate(duration: 3000.ms, begin: 0, end: 1);
          
      // Add a subtle light shimmer across the grooves
      icon = Stack(
        alignment: Alignment.center,
        children: [
          icon,
          Container(
            width: size * 0.8,
            height: size * 0.8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.transparent,
                  SolarizedTheme.cyan.withValues(alpha: 0.1),
                  Colors.transparent,
                ],
                stops: const [0.4, 0.5, 0.6],
              ),
            ),
          ).animate(onPlay: (c) => c.repeat())
           .rotate(duration: 2000.ms, begin: 0, end: 1),
        ],
      );
    }

    return RepaintBoundary(child: icon);
  }
}

class _AlbumPainter extends CustomPainter {
  final Color color;
  final bool isSelected;

  _AlbumPainter({
    required this.color,
    required this.isSelected,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final outerPaint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final groovePaint = Paint()
      ..color = color.withValues(alpha: 0.3)
      ..strokeWidth = 0.5
      ..style = PaintingStyle.stroke;

    final centerPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // 1. Outer Shell
    canvas.drawCircle(center, radius - 1, outerPaint);

    // 2. Grooves (concentric rings)
    canvas.drawCircle(center, radius * 0.75, groovePaint);
    canvas.drawCircle(center, radius * 0.6, groovePaint);
    canvas.drawCircle(center, radius * 0.45, groovePaint);

    // 3. Center Hole/Label
    canvas.drawCircle(center, 1.5, centerPaint);
    if (isSelected) {
       // Slightly larger center label when active
       canvas.drawCircle(center, 3.0, Paint()
         ..color = color.withValues(alpha: 0.1)
         ..style = PaintingStyle.fill
       );
    }
  }

  @override
  bool shouldRepaint(covariant _AlbumPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.isSelected != isSelected;
  }
}
