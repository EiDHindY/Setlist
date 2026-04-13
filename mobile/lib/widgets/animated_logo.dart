import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/solarized_theme.dart';

class AnimatedSolarizedLogo extends StatefulWidget {
  final double width;
  final double height;
  final VoidCallback? onComplete;
  
  const AnimatedSolarizedLogo({
    super.key, 
    this.width = 320, 
    this.height = 350,
    this.onComplete,
  });

  @override
  State<AnimatedSolarizedLogo> createState() => _AnimatedSolarizedLogoState();
}

class _AnimatedSolarizedLogoState extends State<AnimatedSolarizedLogo> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pathAnimation;
  late Animation<double> _ghostAnimation;
  late Animation<double> _staffAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 4500));
    
    _pathAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.2, 0.9, curve: Curves.easeInOutCubic),
    );
    
    _ghostAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.25, 0.95, curve: Curves.easeInOutCubic),
    );
    
    _staffAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.6, curve: Curves.easeInOut),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete?.call();
      }
    });

    // Micro delay to ensure layout passes complete before triggering
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo SVG Container exactly mapped to ViewBox
              SizedBox(
                width: 140,
                height: 140,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: _controller,
                        builder: (context, child) {
                          return CustomPaint(
                            size: const Size(140, 140),
                            painter: _LogoPainter(
                              pathProgress: _pathAnimation.value,
                              ghostProgress: _ghostAnimation.value,
                              staffProgress: _staffAnimation.value,
                            ),
                          );
                        },
                      ),
                    ),
                    
                    // Fixed Note Head exactly at M 30 80 (+20 x offset for centering)
                    Positioned(
                      left: 50 - 9, // cx=30 + 20, rx=9
                      top: 80 - 6,   // cy=80, ry=6
                      child: Transform.rotate(
                        angle: -0.25,
                        child: Container(
                          width: 18, height: 12,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: SolarizedTheme.base3,
                            boxShadow: [BoxShadow(color: SolarizedTheme.cyan.withOpacity(0.4), blurRadius: 6)],
                          ),
                        ).animate().fade(delay: 3500.ms, duration: 200.ms).scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1), delay: 3500.ms, curve: Curves.elasticOut),
                      ),
                    ),
                    
                    // Ghost Note Head exactly shifted
                    Positioned(
                      left: 50 - 9 - 3, 
                      top: 80 - 6 + 3,
                      child: Transform.rotate(
                        angle: -0.25,
                        child: Container(
                          width: 18, height: 12,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: SolarizedTheme.cyan.withOpacity(0.6),
                          ),
                        ).animate().fade(delay: 3800.ms, duration: 200.ms).scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1), delay: 3800.ms, curve: Curves.elasticOut),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              
              Text(
                "SETLIST",
                style: GoogleFonts.cinzel(
                  fontSize: 34,
                  letterSpacing: 24,
                  fontWeight: FontWeight.w400,
                  color: SolarizedTheme.base3,
                  shadows: [const Shadow(color: Colors.black54, blurRadius: 10, offset: Offset(0, 3))],
                ),
              ).animate().fade(delay: 2000.ms, duration: 1500.ms).slideY(begin: 0.2, end: 0, delay: 2000.ms),
              

            ],
          ),
        ],
      ),
    );
  }
}



class _LogoPainter extends CustomPainter {
  final double pathProgress;
  final double ghostProgress;
  final double staffProgress;

  _LogoPainter({required this.pathProgress, required this.ghostProgress, required this.staffProgress});

  @override
  void paint(Canvas canvas, Size size) {
    // Visually center the SVG coordinates (center 50) within the canvas 140x140 (center 70)
    canvas.translate(20, 0);

    // 1. Draw Staff Lines
    final staffPaint = Paint()
      ..color = SolarizedTheme.base01.withOpacity(0.6)
      ..strokeWidth = 1.0 // Increased thickness for visibility
      ..style = PaintingStyle.stroke;

    final staffBaseX = -40.0;
    final staffEndX = 140.0;

    for (int i = 0; i < 4; i++) {
       final y = 40.0 + (i * 20);
       final path = Path();
       path.moveTo(staffBaseX, y);
       path.quadraticBezierTo(50, y - 5, staffEndX, y);
       
       if (staffProgress > 0) {
         final lineProgress = ((staffProgress - (i * 0.1)) / 0.7).clamp(0.0, 1.0);
         final metrics = path.computeMetrics().toList();
         for (final metric in metrics) {
           canvas.drawPath(metric.extractPath(0, metric.length * lineProgress), staffPaint);
         }
       }
    }

    // 2. Prepare Geometric S Path
    final sPath = Path();
    sPath.moveTo(30, 80);
    sPath.arcToPoint(const Offset(50, 100), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(70, 80), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(50, 60), radius: const Radius.circular(20), clockwise: false);
    sPath.arcToPoint(const Offset(34, 44), radius: const Radius.circular(16), clockwise: true);
    sPath.arcToPoint(const Offset(50, 28), radius: const Radius.circular(16), clockwise: true);
    sPath.arcToPoint(const Offset(66, 44), radius: const Radius.circular(16), clockwise: true);

    // Securely aggregate total length of multi-contour path mapping from SVG
    final sMetrics = sPath.computeMetrics().toList();
    if (sMetrics.isEmpty) return;
    
    final totalLength = sMetrics.fold<double>(0.0, (prev, metric) => prev + metric.length);

    // Helper to safely extract partial path from multiple metrics
    Path extractPartialPath(double targetLength) {
      final p = Path();
      double currentLength = 0.0;
      for (final metric in sMetrics) {
        if (currentLength >= targetLength) break;
        final nextLength = currentLength + metric.length;
        if (targetLength >= nextLength) {
          p.addPath(metric.extractPath(0, metric.length), Offset.zero);
        } else {
          p.addPath(metric.extractPath(0, targetLength - currentLength), Offset.zero);
        }
        currentLength = nextLength;
      }
      return p;
    }

    // 3. Draw Ghost Stroke
    if (ghostProgress > 0) {
      final ghostPaint = Paint()
        ..color = SolarizedTheme.cyan.withOpacity(0.6)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
        
      final ghostPath = extractPartialPath(totalLength * ghostProgress);
      canvas.save();
      canvas.translate(-3, 3);
      canvas.drawPath(ghostPath, ghostPaint);
      canvas.restore();
    }

    // 4. Draw Main Stroke
    if (pathProgress > 0) {
      final mainPaint = Paint()
        ..color = SolarizedTheme.base3
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
        
      final shadowPaint = Paint()
        ..color = SolarizedTheme.base3.withOpacity(0.2)
        ..strokeWidth = 6.0 // Cheap solid aura instead of buggy MaskFilter.blur
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;

      final mainPath = extractPartialPath(totalLength * pathProgress);
      
      canvas.save();
      canvas.translate(0, 2);
      canvas.drawPath(mainPath, shadowPaint);
      canvas.restore();

      canvas.drawPath(mainPath, mainPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _LogoPainter oldDelegate) {
    return oldDelegate.pathProgress != pathProgress || 
           oldDelegate.ghostProgress != ghostProgress ||
           oldDelegate.staffProgress != staffProgress;
  }
}
