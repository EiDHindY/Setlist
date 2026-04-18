import 'package:flutter/material.dart';
import '../theme/solarized_theme.dart';
import '../widgets/animated_logo.dart';
import '../config/app_config.dart';

class AuthSplashWrapper extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onReady;

  const AuthSplashWrapper({
    super.key,
    required this.child,
    required this.onReady,
  });

  @override
  State<AuthSplashWrapper> createState() => _AuthSplashWrapperState();
}

class _AuthSplashWrapperState extends State<AuthSplashWrapper> {
  bool _animationFinished = false;
  bool _appReady = false;
  bool _transitionStarted = false;

  @override
  void initState() {
    super.initState();
    // If the logo already animated on boot, we skip straight to the pulse/ready check
    if (AppConfig.hasLogoAnimated) {
      _animationFinished = true;
    }
    _startLoading();
  }

  bool _isMainAppRequested = false;

  Future<void> _startLoading() async {
    try {
      await widget.onReady();
    } catch (e) {
      debugPrint('Error during auth splash loading: $e');
    } finally {
      if (mounted) {
        setState(() {
          _appReady = true;
        });
        _checkTransition();
      }
    }
  }

  void _onAnimationComplete() {
    if (mounted) {
      setState(() {
        _animationFinished = true;
      });
      _checkTransition();
    }
  }

  void _checkTransition() {
    if (_animationFinished && _appReady && !_transitionStarted) {
      _transitionStarted = true;
      // We don't need to do anything here, the build method will switch to the child
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 800),
      child: (!_animationFinished || !_appReady)
          ? Scaffold(
              key: const ValueKey('splash'),
              backgroundColor: SolarizedTheme.base03,
              body: Center(
                child: AnimatedSolarizedLogo(
                  onComplete: _onAnimationComplete,
                  isLooping: _animationFinished && !_appReady,
                  startAtFull: AppConfig.hasLogoAnimated,
                ),
              ),
            )
          : widget.child,
    );
  }
}
