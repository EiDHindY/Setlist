import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';
import '../services/auth_service.dart';
import '../widgets/exit_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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
        setState(() {
          _backendUser = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print('🛑 Error fetching profile: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Current Level and XP (Prefer Backend data, fallback to level 1)
    final level = _backendUser?['level'] ?? 1;
    final xp = _backendUser?['experiencePoints'] ?? 0;
    final xpFactor = (xp % 100) / 100.0;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldExit = await showExitDialog(context);
        if (shouldExit) SystemNavigator.pop();
      },
      child: Scaffold(
      backgroundColor: SolarizedTheme.base03,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: SolarizedTheme.base02,
                    backgroundImage: _supabaseUser?.userMetadata?['avatar_url'] != null 
                        ? NetworkImage(_supabaseUser!.userMetadata!['avatar_url']) 
                        : null,
                    child: _supabaseUser?.userMetadata?['avatar_url'] == null 
                        ? const Icon(Icons.person, color: SolarizedTheme.blue) 
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
                          "Welcome back,",
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SolarizedTheme.cyan),
                        ),
                        Text(
                          _supabaseUser?.userMetadata?['full_name'] ?? "Music Legend",
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: SolarizedTheme.base2,
                            fontSize: 24,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Level Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: SolarizedTheme.blue.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: SolarizedTheme.blue, width: 1),
                    ),
                    child: Text(
                      "LVL $level",
                      style: const TextStyle(color: SolarizedTheme.blue, fontWeight: FontWeight.bold),
                    ),
                  )
                  .animate()
                  .fade(delay: 800.ms)
                  .slideX(begin: 0.5, end: 0),
                  
                  // Sign Out Button
                  IconButton(
                    icon: const Icon(Icons.logout, color: SolarizedTheme.base01),
                    onPressed: () async {
                      await AuthService.signOut();
                    },
                  )
                  .animate()
                  .fade(delay: 1000.ms),
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
                      Text("EXPERIENCE", style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SolarizedTheme.base01, letterSpacing: 1.5)),
                      Text("${(xp % 100).toInt()} / 100 XP", style: const TextStyle(color: SolarizedTheme.cyan, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
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
                  ).animate().shimmer(delay: 1200.ms, duration: 2.seconds),
                ],
              ),
              
              const SizedBox(height: 48),
              
              // Smart Content Placeholder
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.auto_awesome_rounded, size: 64, color: SolarizedTheme.base01.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text(
                        "Your library is empty.",
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: SolarizedTheme.base01),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Clash with friends to earn your first XP!",
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: SolarizedTheme.base01),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(backgroundColor: SolarizedTheme.cyan),
                        child: const Text("IMPORT SONGS"),
                      ),
                    ],
                  ),
                ).animate().fade(delay: 1500.ms),
              ),
            ],
          ),
        ),
      ),
    ),
    );
  }
}
