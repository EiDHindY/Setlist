import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/solarized_theme.dart';

/// Shows a premium glassmorphic exit confirmation dialog.
/// Returns `true` if the user confirms exit, `false` otherwise.
Future<bool> showExitDialog(BuildContext context) async {
  final result = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Exit Dialog',
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 350),
    transitionBuilder: (context, animation, secondaryAnimation, child) {
      final curvedAnimation = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutBack,
        reverseCurve: Curves.easeInCubic,
      );
      return ScaleTransition(
        scale: Tween<double>(begin: 0.85, end: 1.0).animate(curvedAnimation),
        child: FadeTransition(
          opacity: curvedAnimation,
          child: child,
        ),
      );
    },
    pageBuilder: (context, animation, secondaryAnimation) {
      return Center(
        child: Material(
          type: MaterialType.transparency,
          child: _ExitDialogContent(),
        ),
      );
    },
  );
  return result ?? false;
}

class _ExitDialogContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          width: 300,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          decoration: BoxDecoration(
            color: SolarizedTheme.base02.withOpacity(0.85),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: SolarizedTheme.base01.withOpacity(0.3),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: SolarizedTheme.base03.withOpacity(0.6),
                  border: Border.all(
                    color: SolarizedTheme.cyan.withOpacity(0.4),
                    width: 1.5,
                  ),
                ),
                child: const Icon(
                  Icons.music_off_rounded,
                  color: SolarizedTheme.cyan,
                  size: 26,
                ),
              ),

              const SizedBox(height: 20),

              // Title
              const Text(
                'Sure want to exit?',
                style: TextStyle(
                  color: SolarizedTheme.base3,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                  decoration: TextDecoration.none,
                ),
              ),

              const SizedBox(height: 28),

              // Buttons
              Row(
                children: [
                  // Stay Button
                  Expanded(
                    child: _DialogButton(
                      label: 'STAY',
                      isPrimary: true,
                      onTap: () => Navigator.of(context).pop(false),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Exit Button
                  Expanded(
                    child: _DialogButton(
                      label: 'EXIT',
                      isPrimary: false,
                      onTap: () => Navigator.of(context).pop(true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DialogButton extends StatefulWidget {
  final String label;
  final bool isPrimary;
  final VoidCallback onTap;

  const _DialogButton({
    required this.label,
    required this.isPrimary,
    required this.onTap,
  });

  @override
  State<_DialogButton> createState() => _DialogButtonState();
}

class _DialogButtonState extends State<_DialogButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        HapticFeedback.lightImpact();
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.93 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: Container(
          height: 46,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: widget.isPrimary
                ? SolarizedTheme.cyan.withOpacity(0.9)
                : Colors.transparent,
            border: Border.all(
              color: widget.isPrimary
                  ? SolarizedTheme.cyan
                  : SolarizedTheme.base01.withOpacity(0.5),
              width: 1.2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            widget.label,
            style: TextStyle(
              color: widget.isPrimary
                  ? SolarizedTheme.base03
                  : SolarizedTheme.base1,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
              decoration: TextDecoration.none,
            ),
          ),
        ),
      ),
    );
  }
}
