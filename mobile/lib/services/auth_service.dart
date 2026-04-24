import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

class AuthService {
  /// Syncs the current Supabase user with the C# Backend
  static String get _backendUrl => '${AppConfig.baseUrl}/user/sync';

  /// Syncs the current Supabase user with the C# Backend
  /// This takes the Supabase Identity and registers it in our central database.
  static Future<void> syncUserWithBackend(Session session) async {
    final user = session.user;
    
    // The "Universal Blueprint" for the User
    final userData = {
      'id': user.id,
      'email': user.email,
      'fullName': user.userMetadata?['full_name'] ?? user.email?.split('@')[0] ?? 'Rockstar',
      'avatarUrl': user.userMetadata?['avatar_url'] ?? '',
    };

    try {
      print('🛰️ Sending Sync Request to Backend: $_backendUrl');
      
      final response = await http.post(
        Uri.parse(_backendUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(userData),
      ).timeout(const Duration(seconds: 3)); // 🛡️ Safety Timeout

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Backend Sync Successful: User Identity Locked! 🏯');
      } else {
        print('❌ Backend Sync Failed: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('🛑 Sync Hub Error: $e');
    }
  }

  /// Signs out from Supabase
  static Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
  }
}
