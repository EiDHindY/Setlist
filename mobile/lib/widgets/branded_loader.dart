import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class BrandedLoader extends StatelessWidget {
  final double size;
  
  const BrandedLoader({super.key, this.size = 80});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Subtle glow effect behind the logo
          Container(
            width: size * 0.6,
            height: size * 0.6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: SolarizedTheme.cyan.withOpacity(0.2),
                  blurRadius: 30,
                  spreadRadius: 10,
                )
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.2, 1.2), duration: 1500.ms, curve: Curves.easeInOutSine),

          // Custom drawn S logo scaled down for loading
          SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _LoadingLogoPainter(),
            ),
          )
          .animate(onPlay: (controller) => controller.repeat())
          .shimmer(duration: 2000.ms, color: SolarizedTheme.base3.withOpacity(0.5)) // Highlight sweeping across
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .fade(begin: 0.6, end: 1.0, duration: 1000.ms),
        ],
      ),
    );
  }
}

class _LoadingLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Scale canvas to match the original 100x120 SVG viewBox proportion roughly
    final scale = size.width / 140;
    canvas.scale(scale, scale);
    canvas.translate(20, 0); // Center adjustment

    // 1. Draw Staff Lines (Static for loader)
    final staffPaint = Paint()
      ..color = SolarizedTheme.base01.withOpacity(0.4)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    for (int i = 0; i < 4; i++) {
       final y = 40.0 + (i * 20);
       final path = Path();
       path.moveTo(-20, y);
       path.quadraticBezierTo(50, y - 5, 120, y);
       canvas.drawPath(path, staffPaint);
    }

    // 2. Main Geometric S Path
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
      ..strokeWidth = 1.5
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
      ..strokeWidth = 2.5
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
