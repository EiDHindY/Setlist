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

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  final _supabaseUser = Supabase.instance.client.auth.currentUser;

  final List<Widget> _screens = const [
    HomeScreen(),
    LibraryScreen(),
    ClashScreen(),
    PartyScreen(),
    ProfileScreen()
  ];

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
          return;
        }
        
        final shouldExit = await showExitDialog(context);
        if (shouldExit) SystemNavigator.pop();
      },
      child: Scaffold(
        backgroundColor: SolarizedTheme.base03,
        body: Stack(
          children: [
            // Active Screen
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (Widget child, Animation<double> animation) {
                return FadeTransition(opacity: animation, child: child);
              },
              child: _screens[_currentIndex],
            ),

            // Top Left Branded Logo (Hidden on Profile)
            if (_currentIndex != 4)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 20, top: 10),
                  child: Row(
                    children: [
                      // Rounded Logo Wrapper (Favicon style)
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
                      // Dynamic Tab Title
                      Text(
                        _currentIndex == 0 ? "HOME" : 
                        _currentIndex == 1 ? "COLLECTION" : 
                        _currentIndex == 2 ? "CLASH" : "PARTY",
                        style: GoogleFonts.cinzel(
                          color: SolarizedTheme.base3,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                        ),
                      ).animate(key: ValueKey(_currentIndex))
                       .fade(duration: 400.ms)
                       .slideX(begin: 0.2, curve: Curves.easeOutCubic),
                    ],
                  ).animate().fade(duration: 300.ms).slideX(begin: -0.2),
                ),
              ),

            // Floating Glassmorphic Nav Bar
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
                height: 75, // Slimmer height now that text is gone
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
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(37.5),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                    child: Container(
                      color: SolarizedTheme.base02.withOpacity(0.7),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          // The slots are 1/5th of the total width
                          final double slotWidth = constraints.maxWidth / 5;
                          const double bubbleSize = 50.0;
                          
                          // Exactly find the center of the active slot, then offset to center the bubble there
                          final double bubbleLeft = (slotWidth * _currentIndex) + (slotWidth / 2) - (bubbleSize / 2);

                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              // The Springy Bubble Indicator
                              AnimatedPositioned(
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.elasticOut,
                                left: bubbleLeft,
                                top: 12.5, // Perfectly dead-center in the 75px container
                                width: bubbleSize,
                                height: bubbleSize,
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _currentIndex == 2 
                                        ? SolarizedTheme.magenta.withOpacity(0.25)
                                        : SolarizedTheme.cyan.withOpacity(0.25),
                                  ),
                                ),
                              ),
                              
                              // The Navigation Tabs Content
                              Row(
                                children: [
                                  Expanded(child: _buildNavItem(0, "Home", icon: Icons.home_rounded)),
                                  Expanded(child: _buildNavItem(1, "Collection", isCustom: true)),
                                  Expanded(child: _buildNavItem(2, "Clash", isCustom: true)),
                                  Expanded(child: _buildNavItem(3, "Party", isCustom: true)),
                                  Expanded(child: _buildNavItem(4, "Profile", isCustom: true)),
                                ],
                              ),
                            ],
                          );
                        }
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, String label, {IconData? icon, bool isCustom = false}) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? SolarizedTheme.cyan : SolarizedTheme.base01.withOpacity(0.6);

    Widget iconWidget;
    
    if (index == 1) {
      // The Custom Bumping Headphones Icon
      iconWidget = BumpingHeadphonesIcon(isSelected: isSelected);
    } else if (index == 2) {
      // The Custom Bleeding Clash Icon
      iconWidget = BleedingClashIcon(isSelected: isSelected);
    } else if (index == 3) {
      // The Custom Synced Headsets Icon
      iconWidget = SyncedHeadsetsIcon(isSelected: isSelected);
    } else if (index == 4) {
      // The Profile Avatar Icon
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
      // Standard Icons
      iconWidget = AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        child: Icon(icon, color: color, size: isSelected ? 28 : 24),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        HapticFeedback.lightImpact();
        setState(() => _currentIndex = index);
      },
      child: Center(
        child: SizedBox(
           width: 50,
           height: 50,
           child: Center(child: iconWidget),
        ),
      ),
    );
  }
}
