import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

enum ProducerIconVariant {
  mpc,
  mic,
  faders,
  reel,
  monitor,
}

class ProducerIcon extends StatelessWidget {
  final bool isSelected;
  final double size;
  final ProducerIconVariant variant;

  const ProducerIcon({
    super.key,
    required this.isSelected,
    this.size = 24,
    this.variant = ProducerIconVariant.mpc,
  });

  @override
  Widget build(BuildContext context) {
    Widget icon;
    switch (variant) {
      case ProducerIconVariant.mpc:
        icon = _buildMPC(context);
        break;
      case ProducerIconVariant.mic:
        icon = _buildMic(context);
        break;
      case ProducerIconVariant.faders:
        icon = _buildFaders(context);
        break;
      case ProducerIconVariant.reel:
        icon = _buildReel(context);
        break;
      case ProducerIconVariant.monitor:
        icon = _buildMonitor(context);
        break;
    }
    return RepaintBoundary(child: icon);
  }

  Widget _buildMPC(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);
    final padSize = (size - 4) / 2;

    return SizedBox(
      width: size,
      height: size,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildPad(0, padSize, themeColor),
              const SizedBox(width: 2),
              _buildPad(1, padSize, themeColor),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildPad(2, padSize, themeColor),
              const SizedBox(width: 2),
              _buildPad(3, padSize, themeColor),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPad(int index, double padSize, Color color) {
    Widget pad = Container(
      width: padSize,
      height: padSize,
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: Border.all(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
    );

    if (isSelected) {
      // Create a rhythmic sequence
      final delay = index * 200;
      pad = pad.animate(onPlay: (c) => c.repeat())
        .custom(
          duration: 1200.ms,
          delay: delay.ms,
          builder: (context, value, child) {
            final isLit = (value > 0.0 && value < 0.25);
            return Container(
              width: padSize,
              height: padSize,
              decoration: BoxDecoration(
                color: isLit ? color.withOpacity(0.8) : Colors.transparent,
                border: Border.all(color: color, width: 1.5),
                borderRadius: BorderRadius.circular(4),
                boxShadow: isLit ? [
                  BoxShadow(color: color.withOpacity(0.4), blurRadius: 4, spreadRadius: 1)
                ] : null,
              ),
            );
          },
        );
    }

    return pad;
  }

  Widget _buildMic(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);
    final micWidth = size * 0.45;
    final micHeight = size * 0.8;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // MIC STAND (Base)
          Positioned(
            bottom: 0,
            child: Container(
              width: 2,
              height: size * 0.2,
              color: themeColor,
            ),
          ),
          Positioned(
            bottom: 0,
            child: Container(
              width: size * 0.3,
              height: 1.5,
              color: themeColor,
            ),
          ),
          
          // MIC BODY (Capsule)
          Container(
            width: micWidth,
            height: micHeight,
            margin: EdgeInsets.only(bottom: size * 0.1),
            decoration: BoxDecoration(
              color: Colors.transparent,
              border: Border.all(color: themeColor, width: 1.5),
              borderRadius: BorderRadius.circular(micWidth),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Grill lines
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (i) => Container(
                    margin: const EdgeInsets.symmetric(vertical: 1),
                    width: micWidth * 0.6,
                    height: 1,
                    color: themeColor.withOpacity(0.3),
                  )),
                ),
                // Recording Dot
                if (isSelected)
                  Positioned(
                    bottom: micHeight * 0.2,
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: SolarizedTheme.magenta,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: SolarizedTheme.magenta, blurRadius: 4, spreadRadius: 1)
                        ]
                      ),
                    ).animate(onPlay: (c) => c.repeat(reverse: true))
                     .fade(duration: 600.ms)
                     .scale(begin: const Offset(0.7, 0.7), end: const Offset(1.1, 1.1), duration: 600.ms),
                  ),
              ],
            ),
          ),
          
          // Glow effect when selected
          if (isSelected)
            Container(
              width: micWidth + 4,
              height: micHeight + 2,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(micWidth + 2),
                boxShadow: [
                  BoxShadow(
                    color: SolarizedTheme.cyan.withOpacity(0.1),
                    blurRadius: 10,
                    spreadRadius: 2,
                  )
                ],
              ),
            ).animate().fadeIn(duration: 400.ms),
        ],
      ),
    );
  }

  Widget _buildFaders(BuildContext context) {
    // Placeholder for next iteration
    return Icon(Icons.tune_rounded, size: size, color: isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6));
  }

  Widget _buildReel(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);
    final reelSize = size * 0.45;

    Widget reel = Container(
      width: reelSize,
      height: reelSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: themeColor, width: 1.5),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: List.generate(3, (i) {
          return Transform.rotate(
            angle: (i * 120) * 3.14159 / 180,
            child: Container(
              width: 1.5,
              height: reelSize * 0.7,
              color: themeColor.withValues(alpha: 0.5),
            ),
          );
        }),
      ),
    );

    if (isSelected) {
      reel = reel.animate(onPlay: (c) => c.repeat())
          .rotate(duration: 3000.ms, begin: 0, end: 1);
    }

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Tape Path (Connecting Line)
          Positioned(
            bottom: size * 0.25,
            child: Container(
              width: size * 0.8,
              height: 1.2,
              color: themeColor.withValues(alpha: 0.3),
            ),
          ),
          // Two Reels
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              reel,
              const SizedBox(width: 1),
              reel,
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMonitor(BuildContext context) {
    final themeColor = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withValues(alpha: 0.6);
    final monitorWidth = size * 0.7;
    final monitorHeight = size;

    return Center(
      child: Container(
        width: monitorWidth,
        height: monitorHeight,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(3),
          border: Border.all(color: themeColor, width: 1.5),
        ),
        child: Column(
          children: [
            const Spacer(flex: 3),
            // Tweeter
            Container(
              width: monitorWidth * 0.3,
              height: monitorWidth * 0.3,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: themeColor, width: 1.5),
              ),
            ),
            const Spacer(flex: 2),
            // Woofer
            Container(
              width: monitorWidth * 0.6,
              height: monitorWidth * 0.6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: themeColor, width: 1.5),
              ),
            ).maybeAnimate(isSelected, (anim) => anim.scale(
              begin: const Offset(1, 1), 
              end: const Offset(1.15, 1.15), 
              duration: 600.ms, 
              curve: Curves.easeInOutSine
            )),
            const Spacer(flex: 3),
          ],
        ),
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
