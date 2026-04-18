import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../theme/solarized_theme.dart';

class BrandedLoader extends StatefulWidget {
  final double size;
  final double strokeWidth;
  
  const BrandedLoader({
    super.key, 
    this.size = 120,
    this.strokeWidth = 6.0,
  });

  @override
  State<BrandedLoader> createState() => _BrandedLoaderState();
}

class _BrandedLoaderState extends State<BrandedLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return SizedBox(
            width: widget.size,
            height: widget.size,
            child: CustomPaint(
              painter: _LoaderPainter(
                progress: _controller.value,
                color: SolarizedTheme.cyan,
                strokeWidth: widget.strokeWidth,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _LoaderPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _LoaderPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    
    // Draw background track (very subtle)
    final trackPaint = Paint()
      ..color = color.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    canvas.drawCircle(center, radius, trackPaint);

    // Draw active arc
    final arcPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Use a sweeping arc that grows and shrinks or just rotates
    // For a premium look, we'll do a rotating 270-degree arc
    const sweepAngle = 3 * math.pi / 2; // 270 degrees
    final startAngle = progress * 2 * math.pi;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(_LoaderPainter oldDelegate) => 
      oldDelegate.progress != progress || oldDelegate.color != color;
}
