import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/solarized_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _user = Supabase.instance.client.auth.currentUser;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                    backgroundImage: _user?.userMetadata?['avatar_url'] != null 
                        ? NetworkImage(_user!.userMetadata!['avatar_url']) 
                        : null,
                    child: _user?.userMetadata?['avatar_url'] == null 
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
                          _user?.userMetadata?['full_name'] ?? "Music Legend",
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
                    child: const Text(
                      "LVL 1",
                      style: TextStyle(color: SolarizedTheme.blue, fontWeight: FontWeight.bold),
                    ),
                  )
                  .animate()
                  .fade(delay: 800.ms)
                  .slideX(begin: 0.5, end: 0),
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
                      const Text("0 / 100 XP", style: TextStyle(color: SolarizedTheme.cyan, fontSize: 12)),
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
                      widthFactor: 0.1, // Placeholder for XP
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
    );
  }
}
