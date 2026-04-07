import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';
import '../services/auth_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _supabaseUser = Supabase.instance.client.auth.currentUser;
  Map<String, dynamic>? _backendUser;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBackendProfile();
  }

  Future<void> _fetchBackendProfile() async {
    if (_supabaseUser == null) return;

    try {
      final response = await http.get(
        Uri.parse('http://192.168.8.109:5169/api/user/${_supabaseUser.id}'),
      );

      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _backendUser = jsonDecode(response.body);
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      print('🛑 Error fetching profile: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Current Level and XP (Prefer Backend data, fallback to level 1)
    final level = _backendUser?['level'] ?? 1;
    final xp = _backendUser?['experiencePoints'] ?? 0;
    final xpFactor = (xp % 100) / 100.0;

    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile Header
          Row(
            children: [
              CircleAvatar(
                radius: 35,
                backgroundColor: SolarizedTheme.base02,
                backgroundImage: _supabaseUser?.userMetadata?['avatar_url'] != null 
                    ? NetworkImage(_supabaseUser!.userMetadata!['avatar_url']) 
                    : null,
                child: _supabaseUser?.userMetadata?['avatar_url'] == null 
                    ? const Icon(Icons.person, color: SolarizedTheme.blue, size: 30) 
                    : null,
              )
              .animate()
              .fade(duration: 500.ms)
              .scale(delay: 200.ms, curve: Curves.elasticOut),
              
              const SizedBox(width: 16),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _backendUser?['displayName'] ?? _supabaseUser?.userMetadata?['full_name'] ?? "Music Legend",
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: SolarizedTheme.base2,
                        fontSize: 24,
                      ),
                    ),
                    Text(
                      _supabaseUser?.email ?? "",
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SolarizedTheme.base01),
                    ),
                  ],
                ),
              ),
              
              // Sign Out Button
              IconButton(
                icon: const Icon(Icons.logout, color: SolarizedTheme.red),
                onPressed: () async {
                  await AuthService.signOut();
                },
              )
              .animate()
              .fade(delay: 400.ms),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // XP Progress Bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Row(
                     children: [
                       Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: SolarizedTheme.blue.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: SolarizedTheme.blue, width: 1),
                        ),
                        child: Text(
                          "LVL $level",
                          style: const TextStyle(color: SolarizedTheme.blue, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                       const SizedBox(width: 8),
                       Text("EXPERIENCE", style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SolarizedTheme.base01, letterSpacing: 1.5)),
                     ],
                   ),
                  Text("${(xp % 100).toInt()} / 100 XP", style: const TextStyle(color: SolarizedTheme.cyan, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 8,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: SolarizedTheme.base02,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: xpFactor > 0 ? xpFactor : 0.01,
                  child: Container(
                    decoration: BoxDecoration(
                      color: SolarizedTheme.blue,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: [
                        BoxShadow(color: SolarizedTheme.blue.withValues(alpha: 0.5), blurRadius: 8, spreadRadius: 1),
                      ],
                    ),
                  ),
                ),
              ).animate().shimmer(delay: 800.ms, duration: 2.seconds),
            ],
          ),
          
          const SizedBox(height: 48),

          Text("Settings", style: Theme.of(context).textTheme.titleLarge?.copyWith(color: SolarizedTheme.base1)),
          const SizedBox(height: 16),
          _buildSettingsTile(Icons.music_note_rounded, "Audio Quality"),
          _buildSettingsTile(Icons.color_lens_rounded, "Theme Appearance"),
          _buildSettingsTile(Icons.info_outline_rounded, "About Setlist"),

          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildSettingsTile(IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: SolarizedTheme.base02,
          borderRadius: BorderRadius.circular(8)
        ),
        child: Icon(icon, color: SolarizedTheme.cyan)
      ),
      title: Text(title, style: const TextStyle(color: SolarizedTheme.base2)),
      trailing: const Icon(Icons.chevron_right_rounded, color: SolarizedTheme.base01),
      onTap: () {},
    );
  }
}
