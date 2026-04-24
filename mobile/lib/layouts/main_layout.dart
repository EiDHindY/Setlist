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
import '../widgets/producer_icon.dart';
import '../widgets/mixer_icon.dart';
import '../widgets/song_icon.dart';
import '../widgets/album_icon.dart';
import '../widgets/setlist_icon.dart';
import '../widgets/vip_badge.dart';
import '../models/nav_models.dart';
import '../widgets/nav_bar/main_nav_item.dart';
import '../widgets/nav_bar/sub_nav_item.dart';
import '../screens/home_screen.dart';
import '../screens/library_screen.dart';
import '../screens/clash_screen.dart';
import '../screens/party_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/profile_screen.dart';



class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> with TickerProviderStateMixin {
  int _currentIndex = 0;
  final List<NavPoint> _navigationHistory = [const NavPoint(0)];
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

  late List<Widget?> _screens;
  late List<AnimationController> _fadeControllers;
  late List<Animation<double>> _fadeAnimations;
  final Map<int, Widget> _cachedSubNavRows = {};

  void _initScreens() {
    _screens = List.filled(5, null);
    
    // Always pre-load Home
    _screens[0] = const HomeScreen();
    
    _fadeControllers = List.generate(5, (i) => AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
      value: i == 0 ? 1.0 : 0.0,
    ));

    _fadeAnimations = _fadeControllers.map((c) => CurvedAnimation(
      parent: c,
      curve: Curves.easeInOut,
    )).toList();

    // Lazy load Collections tab after the first frame to keep startup instant
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {
          _screens[1] = LibraryScreen(subNavIndex: _subNavIndex);
        });
      }
    });
  }

  void _ensureScreenLoaded(int index) {
    if (_screens[index] == null) {
      setState(() {
        if (index == 4) {
          _screens[4] = _buildProfileScreen();
        } else {
          _screens[index] = _getScreenByIndex(index);
        }
      });
    }
  }

  Widget _getScreenByIndex(int index) {
    switch (index) {
      case 0: return const HomeScreen();
      case 1: return LibraryScreen(subNavIndex: _subNavIndex);
      case 2: return const ClashScreen();
      case 3: return const PartyScreen();
      case 4: return _buildProfileScreen();
      default: return const SizedBox.shrink();
    }
  }

  void _preCacheSubNavRows(BoxConstraints constraints) {
    if (_cachedSubNavRows.isNotEmpty) return;
    for (var entry in _subNavConfigs.entries) {
      _cachedSubNavRows[entry.key] = _buildSubNavRow(constraints, tabIndex: entry.key);
    }
  }

  Widget _buildProfileScreen() {
    return ProfileScreen(
      user: _supabaseUser,
      autoOpenSubNav: _autoOpenSubNav,
      showFloatingLabels: _showFloatingLabels,
      onToggleAutoOpen: (val) {
        setState(() {
          _autoOpenSubNav = val;
          _updateProfileScreen();
        });
      },
      onToggleFloatingLabels: (val) {
        setState(() {
          _showFloatingLabels = val;
          _updateProfileScreen();
        });
      },
    );
  }

  void _updateProfileScreen() {
    if (_screens[4] != null) {
      _screens[4] = _buildProfileScreen();
    }
  }


  final Map<int, List<SubNavItemData>> _subNavConfigs = {
    1: [
      SubNavItemData(
        label: 'Songs',
        customIconBuilder: (isSelected) => SongIcon(isSelected: isSelected),
      ),
      SubNavItemData(
        label: 'Setlists',
        customIconBuilder: (isSelected) => SetlistIcon(isSelected: isSelected),
      ),
      SubNavItemData(
        label: 'Albums',
        customIconBuilder: (isSelected) => AlbumIcon(isSelected: isSelected),
      ),
      SubNavItemData(icon: Icons.person_rounded, label: 'Artists'),
      SubNavItemData(
        label: 'Producers',
        customIconBuilder: (isSelected) => ProducerIcon(
          isSelected: isSelected,
          variant: ProducerIconVariant.monitor,
        ),
      ),
      SubNavItemData(
        label: 'Mixers',
        customIconBuilder: (isSelected) => MixerIcon(isSelected: isSelected),
      ),
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

    _initScreens();
  }

  @override
  void dispose() {
    _morphController.dispose();
    _expansionController.dispose();
    for (var c in _fadeControllers) {
      c.dispose();
    }
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
        _pushHistory(NavPoint(_currentIndex, subNavIndex: 0, isSubNavMode: true));
      }
    });
    HapticFeedback.mediumImpact();
    _morphController.forward();
  }

  void _pushHistory(NavPoint point) {
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
            Stack(
              children: List.generate(_screens.length, (i) {
                return FadeTransition(
                  opacity: _fadeAnimations[i],
                  child: IgnorePointer(
                    ignoring: _currentIndex != i,
                    child: TickerMode(
                      enabled: _currentIndex == i || _fadeAnimations[i].value > 0,
                      child: _screens[i] ?? const SizedBox.shrink(),
                    ),
                  ),
                );
              }),
            ),

            // Global Player Overlay is now in main.dart builder

            // Top Left Branded Logo (Hidden on Profile)
            if (_currentIndex != 4)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 20, top: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: SolarizedTheme.base02.withOpacity(0.9),
                          shape: BoxShape.circle,
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
                      ).animate(delay: 1000.ms)
                       .fade(duration: 500.ms)
                       .slideX(begin: 0.2, curve: Curves.easeOutCubic),
                      const SizedBox(width: 8),
                      const VipBadge(size: 10),
                    ],
                  ).animate(delay: 1000.ms)
                   .fade(duration: 600.ms)
                   .slideY(begin: -1.0, curve: Curves.easeOutCubic, duration: 700.ms),
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
                                _preCacheSubNavRows(constraints);
                                return Stack(
                                  alignment: Alignment.bottomCenter,
                                  clipBehavior: Clip.none,
                                  children: [


                                    // 1.5. Swipe Hint (Appears ABOVE the label chip)
                                    if (_showSubNavHint && _currentIndex == _lastHintIndex)
                                      Positioned(
                                        left: 0,
                                        right: 0,
                                        bottom: 95, // Above the bar
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


          ],
        ),
      ),
    );
  }

  // ── FLOATING LABEL BUILDER ─────────────────────────────────────────



  // ── NAV ROW BUILDERS ──────────────────────────────────────────────

  Widget _buildMainNavRow(BoxConstraints constraints) {
    final labels = ['HOME', 'COLLECTIONS', 'CLASH', 'PARTY', 'PROFILE'];
    final w = constraints.maxWidth;
    final selectedW = w * 0.40;
    final unselectedW = (w - selectedW) / 4;

    return Row(
      children: List.generate(5, (i) {
        final avatarUrl = _supabaseUser?.userMetadata?['avatar_url'];
        Widget? iconOverride;
        if (i == 4) {
          iconOverride = AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.all(_currentIndex == i ? 2 : 0),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: _currentIndex == i ? Border.all(color: SolarizedTheme.cyan, width: 2) : null,
            ),
            child: CircleAvatar(
              radius: 11,
              backgroundColor: SolarizedTheme.base01,
              backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
              child: avatarUrl == null
                  ? const Icon(Icons.person, size: 14, color: SolarizedTheme.base2)
                  : null,
            ),
          );
        }

        return AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOutCubic,
          width: _currentIndex == i ? selectedW : unselectedW,
          height: 75,
          child: MainNavItem(
            index: i,
            label: labels[i],
            isSelected: _currentIndex == i,
            iconOverride: iconOverride,
            onTap: () {
              if (_currentIndex != i) {
                HapticFeedback.lightImpact();
                setState(() {
                  _oldIndex = _currentIndex;
                  _currentIndex = i;
                  _pushHistory(NavPoint(i));
                  
                  _ensureScreenLoaded(i);

                  // Manage Cross-Fade Animations
                  _fadeControllers[_oldIndex].reverse();
                  _fadeControllers[_currentIndex].forward();
                });
              }

              if (_hasSubNav(i)) {
                if (_autoOpenSubNav) {
                  _morphToSubNav();
                } else {
                  setState(() {
                    _showSubNavHint = true;
                    _lastHintIndex = i;
                  });
                  Future.delayed(const Duration(milliseconds: 2500), () {
                    if (mounted) setState(() => _showSubNavHint = false);
                  });
                }
              }
            },
          ),
        );
      }),
    );
  }

  Widget _buildSubNavRow(BoxConstraints constraints, {int? tabIndex}) {
    final activeIndex = tabIndex ?? _currentIndex;
    final subItems = _subNavConfigs[activeIndex];
    if (subItems == null) return const SizedBox.shrink();
    final count = subItems.length;
    final w = constraints.maxWidth;
    final selectedW = w * 0.30;
    final unselectedW = (w - selectedW) / (count - 1);

    return ClipRect(
      child: Row(
        children: List.generate(count, (i) {
          return AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeOutCubic,
            width: _subNavIndex == i ? selectedW : unselectedW,
            height: 75,
            child: SubNavItem(
              index: i,
              item: subItems[i],
              isSelected: _subNavIndex == i,
              onTap: () {
                if (_subNavIndex != i) {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _oldSubNavIndex = _subNavIndex;
                    _subNavIndex = i;
                    
                    // Force refresh Collections screen with new index
                    if (_currentIndex == 1) {
                      _screens[1] = LibraryScreen(subNavIndex: i);
                    }
                    
                    _pushHistory(NavPoint(_currentIndex, subNavIndex: i, isSubNavMode: true));
                  });
                }
              },
            ),
          );
        }),
      ),
    );
  }

  // ── NAV ITEM BUILDERS ─────────────────────────────────────────────
}
