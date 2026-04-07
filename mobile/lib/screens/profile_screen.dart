import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/solarized_theme.dart';

class ProfileScreen extends StatefulWidget {
  final User? user;
  final bool autoOpenSubNav;
  final bool showFloatingLabels;
  final ValueChanged<bool> onToggleAutoOpen;
  final ValueChanged<bool> onToggleFloatingLabels;

  const ProfileScreen({
    super.key,
    this.user,
    required this.autoOpenSubNav,
    required this.showFloatingLabels,
    required this.onToggleAutoOpen,
    required this.onToggleFloatingLabels,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _showSettings = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          transitionBuilder: (Widget child, Animation<double> animation) {
            return FadeTransition(opacity: animation, child: child);
          },
          child: _showSettings ? _buildSettingsView() : _buildProfileView(),
        ),
      ),
    );
  }

  Widget _buildProfileView() {
    final metadata = widget.user?.userMetadata;
    final String? avatarUrl = metadata?['avatar_url'] ?? metadata?['picture'];
    final String displayName = metadata?['full_name'] ?? metadata?['name'] ?? "DODO";

    return Padding(
      key: const ValueKey('profile_overview'),
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 32),
                // Identity Layer
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: SolarizedTheme.cyan.withOpacity(0.5), width: 2),
                  ),
                  child: CircleAvatar(
                    radius: 60,
                    backgroundColor: SolarizedTheme.base02,
                    backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                    child: avatarUrl == null 
                      ? const Icon(Icons.person_rounded, size: 60, color: SolarizedTheme.cyan)
                      : null,
                  ),
                ).animate().scale(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutBack),
                
                const SizedBox(height: 24),
                Text(
                  displayName.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.cinzel(
                    color: SolarizedTheme.base3,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 4.0,
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                
                const SizedBox(height: 48),

                // Navigation Layer
                _buildActionTile(
                  icon: Icons.settings_rounded,
                  title: "SETTINGS",
                  subtitle: "Preferences & UI Customization",
                  onTap: () => setState(() => _showSettings = true),
                ),

                _buildActionTile(
                  icon: Icons.history_rounded,
                  title: "HISTORY",
                  subtitle: "Your past activities",
                  onTap: () {},
                ),

                _buildActionTile(
                  icon: Icons.logout_rounded,
                  title: "SIGN OUT",
                  subtitle: "Logout of your account",
                  onTap: () => Supabase.instance.client.auth.signOut(),
                  isCritical: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsView() {
    return Padding(
      key: const ValueKey('settings_view'),
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          // Back Button
          GestureDetector(
            onTap: () => setState(() => _showSettings = false),
            child: Row(
              children: [
                const Icon(Icons.arrow_back_ios_new_rounded, color: SolarizedTheme.cyan, size: 18),
                const SizedBox(width: 8),
                Text(
                  "BACK",
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.cyan,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          Text(
            "APP SETTINGS",
            style: GoogleFonts.cinzel(
              color: SolarizedTheme.base3,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
          
          const SizedBox(height: 24),
          
          _buildToggleTile(
            icon: Icons.auto_awesome_rounded,
            title: "Auto-Open Sub-Nav",
            subtitle: "Immediately open sub-options on tap",
            value: widget.autoOpenSubNav,
            onChanged: widget.onToggleAutoOpen,
          ),

          _buildToggleTile(
            icon: Icons.label_important_rounded,
            title: "Show Floating Labels",
            subtitle: "Display tab names above the nav bar",
            value: widget.showFloatingLabels,
            onChanged: widget.onToggleFloatingLabels,
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isCritical = false,
  }) {
    final color = isCritical ? SolarizedTheme.magenta : SolarizedTheme.base1;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: SolarizedTheme.base02.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: SolarizedTheme.base01.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color.withOpacity(0.8), size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.montserrat(
                      color: SolarizedTheme.base3,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.0,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.montserrat(
                      color: SolarizedTheme.base1.withOpacity(0.7),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: SolarizedTheme.base01, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: SolarizedTheme.base02.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SolarizedTheme.base01.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: SolarizedTheme.base1, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.base3,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.montserrat(
                    color: SolarizedTheme.base1.withOpacity(0.7),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: SolarizedTheme.cyan,
            activeTrackColor: SolarizedTheme.cyan.withOpacity(0.3),
            inactiveThumbColor: SolarizedTheme.base01,
            inactiveTrackColor: SolarizedTheme.base02,
          ),
        ],
      ),
    );
  }
}
