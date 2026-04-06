import 'package:flutter/material.dart';

class SolarizedTheme {
  // Solarized Dark Colors
  static const Color base03 = Color(0xFF002B36); // Background
  static const Color base02 = Color(0xFF073642); // Brighter background
  static const Color base01 = Color(0xFF586E75);
  static const Color base00 = Color(0xFF657B83);
  static const Color base0 = Color(0xFF839496);
  static const Color base1 = Color(0xFF93A1A1);
  static const Color base2 = Color(0xFFEEE8D5);
  static const Color base3 = Color(0xFFFDF6E3);
  
  static const Color yellow = Color(0xFFB58900);
  static const Color orange = Color(0xFFCB4B16);
  static const Color red = Color(0xFFDC322F);
  static const Color magenta = Color(0xFFD33682);
  static const Color violet = Color(0xFF6C71C4);
  static const Color blue = Color(0xFF268BD2);
  static const Color cyan = Color(0xFF2AA198);
  static const Color green = Color(0xFF859900);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: base03,
    colorScheme: const ColorScheme.dark(
      primary: blue,
      secondary: cyan,
      surface: base02,
      error: red,
      onPrimary: base3,
      onSecondary: base3,
      onSurface: base1,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(color: base1, fontWeight: FontWeight.bold, letterSpacing: -1.0),
      headlineMedium: TextStyle(color: base1, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: base0),
      bodyMedium: TextStyle(color: base00),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: blue,
        foregroundColor: base3,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 4,
      ),
    ),
  );
}
