import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:ui';

import '../theme/solarized_theme.dart';
import '../widgets/exit_dialog.dart';
import '../widgets/bleeding_clash_icon.dart';
import '../widgets/bumping_headphones_icon.dart';
import '../widgets/synced_headsets_icon.dart';
import '../widgets/small_logo_icon.dart';
import '../screens/home_screen.dart';
import '../screens/library_screen.dart';
import '../screens/clash_screen.dart';
import '../screens/party_screen.dart';
import '../screens/profile_screen.dart';

class _NavPoint {
  final int mainIndex;
  final int? subNavIndex;
  final bool isSubNavMode;
  const _NavPoint(this.mainIndex, {this.subNavIndex, this.isSubNavMode = false});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _NavPoint &&
          runtimeType == other.runtimeType &&
          mainIndex == other.mainIndex &&
          subNavIndex == other.subNavIndex &&
          isSubNavMode == other.isSubNavMode;

  @override
  int get hashCode => mainIndex.hashCode ^ subNavIndex.hashCode ^ isSubNavMode.hashCode;
}

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> with TickerProviderStateMixin {
  int _currentIndex = 0;
  final List<_NavPoint> _navigationHistory = [const _NavPoint(0)];
  final _supabaseUser = Supabase.instance.client.auth.currentUser;

  // Sub-nav morphing state
  bool _isSubNavMode = false;
  int _subNavIndex = 0;
  int _morphHintCount = 0;

  late AnimationController _morphController;
  late AnimationController _expansionController;
  late Animation<Offset> _outgoingSlide;
  late Animation<Offset> _incomingSlide;
  late Animation<double> _outgoingFade;
  late Animation<double> _incomingFade;

  int _oldIndex = 0;
  int _oldSubNavIndex = 0;

  bool _autoOpenSubNav = false;
  bool _showSubNavHint = false;
  bool _showFloatingLabels = true;

  // Track the last tab that triggered a hint
  int? _lastHintIndex;

  List<Widget> _buildScreens() => [
    const HomeScreen(),
    const LibraryScreen(),
    const ClashScreen(),
    const PartyScreen(),
    ProfileScreen(
      user: _supabaseUser,
      autoOpenSubNav: _autoOpenSubNav,
      showFloatingLabels: _showFloatingLabels,
      onToggleAutoOpen: (val) => setState(() => _autoOpenSubNav = val),
      onToggleFloatingLabels: (val) => setState(() => _showFloatingLabels = val),
    ),
  ];

  final Map<int, List<_SubNavItem>> _subNavConfigs = {
    1: [
      _SubNavItem(icon: Icons.music_note_rounded, label: 'Songs'),
      _SubNavItem(icon: Icons.queue_music_rounded, label: 'Setlists'),
      _SubNavItem(icon: Icons.album_rounded, label: 'Albums'),
      _SubNavItem(icon: Icons.person_rounded, label: 'Artists'),
      _SubNavItem(icon: Icons.headset_rounded, label: 'Producers'),
      _SubNavItem(icon: Icons.tune_rounded, label: 'Mixers'),
    ],
  };

  @override
  void initState() {
    super.initState();
    _morphController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _outgoingSlide = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(-1.5, 0),
    ).animate(CurvedAnimation(parent: _morphController, curve: Curves.easeInCubic));

    _outgoingFade = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _morphController, curve: const Interval(0.0, 0.6)));

    _incomingSlide = Tween<Offset>(
      begin: const Offset(1.5, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _morphController, curve: Curves.easeOutCubic));

    _incomingFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _morphController, curve: const Interval(0.4, 1.0)));

    _expansionController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    )..value = 1.0; // Start at full expansion for the initial tab
  }

  @override
  void dispose() {
    _morphController.dispose();
    _expansionController.dispose();
    super.dispose();
  }

  void _morphToSubNav({bool addToHistory = true}) {
    if (_isSubNavMode) return;
    final duration = _morphHintCount < 2
        ? const Duration(milliseconds: 800)
        : const Duration(milliseconds: 350);
    _morphHintCount++;
    _morphController.duration = duration;
    _morphController.reset();
    setState(() {
      _isSubNavMode = true;
      _subNavIndex = 0;
      if (addToHistory) {
        _pushHistory(_NavPoint(_currentIndex, subNavIndex: 0, isSubNavMode: true));
      }
    });
    HapticFeedback.mediumImpact();
    _morphController.forward();
  }

  void _pushHistory(_NavPoint point) {
    if (_navigationHistory.isEmpty || _navigationHistory.last != point) {
      _navigationHistory.add(point);
    }
  }

  void _morphToMainNav() {
    if (!_isSubNavMode) return;
    _morphController.duration = const Duration(milliseconds: 350);
    HapticFeedback.mediumImpact();
    _morphController.reverse().then((_) {
      setState(() => _isSubNavMode = false);
    });
  }

  bool _hasSubNav(int tabIndex) => _subNavConfigs.containsKey(tabIndex);

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        if (_navigationHistory.length > 1) {
          setState(() {
            _navigationHistory.removeLast(); // Remove current state
            final prev = _navigationHistory.last;
            
            _oldIndex = _currentIndex;
            _currentIndex = prev.mainIndex;
            _oldSubNavIndex = _subNavIndex;
            _subNavIndex = prev.subNavIndex ?? 0;

            // Handle mode transition
            if (_isSubNavMode && !prev.isSubNavMode) {
              _morphToMainNav();
            } else if (!_isSubNavMode && prev.isSubNavMode) {
              _morphToSubNav(addToHistory: false);
            } else {
              _isSubNavMode = prev.isSubNavMode;
            }
          });
          return;
        }

        final shouldExit = await showExitDialog(context);
        if (shouldExit) SystemNavigator.pop();
      },
      child: Scaffold(
        backgroundColor: SolarizedTheme.base03,
        body: Stack(
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (Widget child, Animation<double> animation) {
                return FadeTransition(opacity: animation, child: child);
              },
              child: _buildScreens()[_currentIndex],
            ),

            // Top Left Branded Logo (Hidden on Profile)
            if (_currentIndex != 4)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 20, top: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: SolarizedTheme.base02.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: SolarizedTheme.base01.withOpacity(0.5), width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: const SmallLogoIcon(size: 28),
                      ),
                      const SizedBox(width: 14),
                      Text(
                        "SETLIST",
                        style: GoogleFonts.cinzel(
                          color: SolarizedTheme.base3,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                        ),
                      ).animate()
                       .fade(duration: 400.ms)
                       .slideX(begin: 0.2, curve: Curves.easeOutCubic),
                    ],
                  ).animate().fade(duration: 300.ms).slideX(begin: -0.2),
                ),
              ),

            // Floating Glassmorphic Nav Bar
            Align(
              alignment: Alignment.bottomCenter,
              child: GestureDetector(
                onHorizontalDragEnd: (details) {
                  if (details.velocity.pixelsPerSecond.dx > 100 && _isSubNavMode) {
                    _morphToMainNav();
                  }
                  if (details.velocity.pixelsPerSecond.dx < -100 && !_isSubNavMode && _hasSubNav(_currentIndex)) {
                    _morphToSubNav();
                  }
                },
                child: Container(
                  margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
                  height: 75,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(37.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 2,
                        offset: const Offset(0, 10),
                      )
                    ]
                  ),
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            return AnimatedBuilder(
                              animation: _morphController,
                              builder: (context, _) {
                                return Stack(
                                  alignment: Alignment.bottomCenter,
                                  clipBehavior: Clip.none,
                                  children: [
                                    // 1. Floating Premium Living Label Chip (Positioned ABOVE the bar)
                                    _buildActiveLabel(constraints),

                                    // 1.5. Swipe Hint (Appears ABOVE the label chip)
                                    if (_showSubNavHint && _currentIndex == _lastHintIndex)
                                      Positioned(
                                        left: 0,
                                        right: 0,
                                        bottom: 115, // Above the 85px label chip
                                        child: Center(
                                          child: Text(
                                            "SWIPE THE NAV BAR TO THE LEFT",
                                            style: GoogleFonts.montserrat(
                                              color: SolarizedTheme.base1.withOpacity(0.8),
                                              fontSize: 8,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 1.5,
                                            ),
                                          )
                                          .animate(onPlay: (c) => c.repeat(reverse: true))
                                          .fadeIn(duration: 400.ms)
                                          .then()
                                          .scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 1000.ms),
                                        ).animate().fadeOut(delay: 2000.ms), // Disappear after 2 seconds
                                      ),

                                    // 2. The Main Blurred Navigation Bar
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(37.5),
                                      child: BackdropFilter(
                                        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                                        child: Container(
                                          height: 75,
                                          color: SolarizedTheme.base02.withOpacity(0.7),
                                          child: Stack(
                                            alignment: Alignment.center,
                                            clipBehavior: Clip.hardEdge,
                                            children: [
                                              if (!_isSubNavMode || _morphController.isAnimating)
                                                SlideTransition(
                                                  position: _isSubNavMode ? _outgoingSlide : const AlwaysStoppedAnimation(Offset.zero),
                                                  child: FadeTransition(
                                                    opacity: _isSubNavMode ? _outgoingFade : const AlwaysStoppedAnimation(1.0),
                                                    child: _buildMainNavRow(constraints),
                                                  ),
                                                ),
                                              if (_isSubNavMode)
                                                SlideTransition(
                                                  position: _incomingSlide,
                                                  child: FadeTransition(
                                                    opacity: _incomingFade,
                                                    child: _buildSubNavRow(constraints),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            );
                          }
                        ),
                ),
              ),
            ),

            // Sub-nav hint chevron
            if (_isSubNavMode)
              Positioned(
                bottom: 40,
                right: 8,
                child: Icon(
                  Icons.keyboard_arrow_right_rounded,
                  color: SolarizedTheme.base01.withOpacity(0.4),
                  size: 18,
                ).animate(onPlay: (c) => c.repeat(reverse: true))
                 .fade(begin: 0.3, end: 0.8, duration: 1200.ms)
                 .slideX(begin: 0, end: 0.3, duration: 1200.ms),
              ),
          ],
        ),
      ),
    );
  }

  // ── FLOATING LABEL BUILDER ─────────────────────────────────────────

  Widget _buildActiveLabel(BoxConstraints constraints) {
    if (!_showFloatingLabels) return const SizedBox.shrink();

    final labels = ['HOME', 'COLLECTION', 'CLASH', 'PARTY', 'PROFILE'];
    final subItems = _subNavConfigs[_currentIndex];
    
    String label;
    int index;
    int count;

    if (_isSubNavMode && subItems != null) {
      index = _subNavIndex;
      count = subItems.length;
      label = subItems[index].label.toUpperCase();
    } else {
      index = _currentIndex;
      count = 5;
      label = labels[index];
    }

    final double itemWidth = constraints.maxWidth / count;
    final double bLeft = index * itemWidth + (itemWidth / 2);
    final color = (_currentIndex == 2 && !_isSubNavMode) ? SolarizedTheme.magenta : SolarizedTheme.cyan;

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
      left: bLeft - 50, // Center 100px width chip over the icon
      width: 100,
      bottom: 85, // Positioned above the 75px bar
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withOpacity(0.4), width: 1),
            color: SolarizedTheme.base03.withOpacity(0.4),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
              child: Text(
                label,
                style: GoogleFonts.montserrat(
                  color: color,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
        )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .moveY(begin: 0, end: -3, duration: 2500.ms, curve: Curves.easeInOutSine),
      ),
    );
  }

  // ── NAV ROW BUILDERS ──────────────────────────────────────────────

  Widget _buildMainNavRow(BoxConstraints constraints) {
    const int count = 5;
    final double itemWidth = constraints.maxWidth / count;
    
    // Calculate circle position based on active index
    final double bLeft = _currentIndex * itemWidth + (itemWidth / 2 - 25);

    return Stack(
      alignment: Alignment.center,
      children: [
        // Floating Circle Highlighter
        AnimatedPositioned(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
          left: bLeft,
          top: 12.5,
          width: 50,
          height: 50,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: (_currentIndex == 2 ? SolarizedTheme.magenta : SolarizedTheme.cyan).withOpacity(0.35),
                width: 1.5,
              ),
              color: (_currentIndex == 2 ? SolarizedTheme.magenta : SolarizedTheme.cyan).withOpacity(0.22),
              boxShadow: [
                BoxShadow(
                  color: (_currentIndex == 2 ? SolarizedTheme.magenta : SolarizedTheme.cyan).withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 1,
                )
              ]
            ),
          ),
        ),
        Row(
          children: List.generate(count, (i) {
            return Expanded(
              child: _buildMainNavItem(i),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildSubNavRow(BoxConstraints constraints) {
    final subItems = _subNavConfigs[_currentIndex];
    if (subItems == null) return const SizedBox.shrink();

    final int count = subItems.length;
    final double itemWidth = constraints.maxWidth / count;
    
    // Calculate circle position based on active sub-nav index
    final double bLeft = _subNavIndex * itemWidth + (itemWidth / 2 - 25);

    return Stack(
      alignment: Alignment.center,
      children: [
        // Floating Circle Highlighter
        AnimatedPositioned(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
          left: bLeft,
          top: 12.5,
          width: 50,
          height: 50,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: SolarizedTheme.cyan.withOpacity(0.35),
                width: 1.5,
              ),
              color: SolarizedTheme.cyan.withOpacity(0.22),
              boxShadow: [
                BoxShadow(
                  color: SolarizedTheme.cyan.withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 1,
                )
              ]
            ),
          ),
        ),
        Row(
          children: List.generate(count, (i) {
            return Expanded(
              child: _buildSubNavItem(i, subItems[i]),
            );
          }),
        ),
      ],
    );
  }

  // ── NAV ITEM BUILDERS ─────────────────────────────────────────────

  Widget _buildMainNavItem(int index) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);

    Widget iconWidget;
    if (index == 1) {
      iconWidget = BumpingHeadphonesIcon(isSelected: isSelected);
    } else if (index == 2) {
      iconWidget = BleedingClashIcon(isSelected: isSelected);
    } else if (index == 3) {
      iconWidget = SyncedHeadsetsIcon(isSelected: isSelected);
    } else if (index == 4) {
      final avatarUrl = _supabaseUser?.userMetadata?['avatar_url'];
      iconWidget = AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.all(isSelected ? 2 : 0),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: isSelected ? Border.all(color: SolarizedTheme.cyan, width: 2) : null,
        ),
        child: CircleAvatar(
          radius: isSelected ? 14 : 12,
          backgroundColor: SolarizedTheme.base01,
          backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
          child: avatarUrl == null
              ? const Icon(Icons.person, size: 16, color: SolarizedTheme.base2)
              : null,
        ),
      );
    } else {
      iconWidget = Icon(Icons.home_rounded, color: color, size: isSelected ? 28 : 24);
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (_currentIndex != index) {
          HapticFeedback.lightImpact();
          setState(() {
            _oldIndex = _currentIndex;
            _currentIndex = index;
            _pushHistory(_NavPoint(index));
          });
        }

        // Handle sub-nav logic
        if (_hasSubNav(index)) {
          if (_autoOpenSubNav) {
            _morphToSubNav();
          } else {
            // Show the swipe hint
            setState(() {
              _showSubNavHint = true;
              _lastHintIndex = index;
            });
            // Auto hide hint after 2.5s
            Future.delayed(const Duration(milliseconds: 2500), () {
              if (mounted) setState(() => _showSubNavHint = false);
            });
          }
        }
      },
      child: Center(
        child: iconWidget,
      ),
    );
  }

  Widget _buildSubNavItem(int index, _SubNavItem item) {
    final isSelected = _subNavIndex == index;
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (_subNavIndex != index) {
          HapticFeedback.lightImpact();
          setState(() {
            _oldSubNavIndex = _subNavIndex;
            _subNavIndex = index;
            _pushHistory(_NavPoint(_currentIndex, subNavIndex: index, isSubNavMode: true));
          });
        }
      },
      child: Center(
        child: Icon(item.icon, color: color, size: isSelected ? 24 : 18),
      ),
    );
  }
}

class _SubNavItem {
  final IconData icon;
  final String label;
  const _SubNavItem({required this.icon, required this.label});
}
