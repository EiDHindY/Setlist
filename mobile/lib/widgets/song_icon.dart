import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class SongIcon extends StatelessWidget {
  final bool isSelected;
  final double size;

  const SongIcon({
    super.key,
    required this.isSelected,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);

    Widget note1 = CustomPaint(
      size: Size(size * 0.6, size),
      painter: _NotePainter(color: themeColor),
    );

    Widget note2 = CustomPaint(
      size: Size(size * 0.5, size * 0.8),
      painter: _NotePainter(color: themeColor),
    );

    if (isSelected) {
      note1 = note1.animate(onPlay: (c) => c.repeat(reverse: true))
          .moveY(begin: 0, end: -2.5, duration: 600.ms, curve: Curves.easeInOutSine)
          .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 600.ms);
          
      note2 = note2.animate(onPlay: (c) => c.repeat(reverse: true))
          .moveY(begin: 0, end: -2.0, duration: 750.ms, curve: Curves.easeInOutSine, delay: 150.ms)
          .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 750.ms, delay: 150.ms);
    }

    return RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          children: [
            Positioned(
              left: 0,
              bottom: 0,
              child: note1,
            ),
            Positioned(
              right: 0,
              bottom: size * 0.05,
              child: note2,
            ),
          ],
        ),
      ),
    );
  }
}

class _NotePainter extends CustomPainter {
  final Color color;

  _NotePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final h = size.height;

    // 1. Draw Notehead (Oval at bottom, slightly tilted)
    final headWidth = w * 0.65;
    final headHeight = h * 0.3;
    final headRect = Rect.fromLTWH(0, h - headHeight, headWidth, headHeight);
    
    canvas.save();
    canvas.translate(headWidth / 2, h - headHeight / 2);
    canvas.rotate(-0.3); // ~17 degrees tilt
    canvas.drawOval(
      Rect.fromCenter(center: Offset.zero, width: headWidth, height: headHeight),
      paint,
    );
    canvas.restore();

    // 2. Draw Stem (Rising from right side of notehead)
    final stemX = headWidth;
    final stemTopY = h * 0.15;
    final stemBottomY = h - headHeight / 2;
    canvas.drawLine(Offset(stemX, stemBottomY), Offset(stemX, stemTopY), paint);

    // 3. Draw Flag (Single wave flag)
    final flagPath = Path();
    flagPath.moveTo(stemX, stemTopY);
    flagPath.quadraticBezierTo(
      stemX + w * 0.35, stemTopY + h * 0.1, 
      stemX + w * 0.25, stemTopY + h * 0.35
    );
    canvas.drawPath(flagPath, paint);
  }

  @override
  bool shouldRepaint(covariant _NotePainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
