import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';

class SmallLogoIcon extends StatelessWidget {
  final double size;
  
  const SmallLogoIcon({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _SmallLogoPainter(),
      ),
    );
  }
}

class _SmallLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 140;
    canvas.scale(scale, scale);
    canvas.translate(20, 0);

    // Main Geometric S Path
    final sPath = Path();
    sPath.moveTo(30, 80);
    sPath.arcToPoint(const Offset(50, 100), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(70, 80), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(50, 60), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(34, 44), radius: const Radius.circular(16), clockwise: true);
    sPath.arcToPoint(const Offset(50, 28), radius: const Radius.circular(16), clockwise: true);
    sPath.arcToPoint(const Offset(66, 44), radius: const Radius.circular(16), clockwise: true);

    // Cyan Ghost Shadow
    final ghostPaint = Paint()
      ..color = SolarizedTheme.cyan.withOpacity(0.6)
      ..strokeWidth = 2.0 // Slightly thicker for small scale
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.save();
    canvas.translate(-2, 2);
    canvas.drawPath(sPath, ghostPaint);
    canvas.restore();

    // Main Stroke
    final mainPaint = Paint()
      ..color = SolarizedTheme.base3
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
      
    canvas.drawPath(sPath, mainPaint);
    
    // Note Head
    canvas.save();
    canvas.translate(30, 80);
    canvas.rotate(-0.25);
    final notePaint = Paint()..color = SolarizedTheme.base3;
    final rrect = RRect.fromRectAndRadius(const Rect.fromLTWH(-9, -6, 18, 12), const Radius.circular(10));
    canvas.drawRRect(rrect, notePaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
