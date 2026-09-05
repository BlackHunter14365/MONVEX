import 'package:flutter/material.dart';

/// Semantic Color System for MONVEX Android
class AppColors {
  // Backgrounds & Surface
  static const Color background = Color(0xFF12141C); // Obsidian black
  static const Color surface = Color(0xFF1A1D28);    // Executive card background
  static const Color surfaceElevated = Color(0xFF222634); // Modal / sheet background
  static const Color border = Color(0x1FFFFFFF);
  static const Color borderSubtle = Color(0x0FFFFFFF);

  // Brand Accents
  static const Color brandPurple = Color(0xFF2A1F3D); // Executive brand purple
  static const Color primary = Color(0xFF4056A1);      // Deep cobalt / indigo
  static const Color primaryDark = Color(0xFF2D3D72);
  static const Color primaryLight = Color(0xFF5A72C8);
  static const Color accent = Color(0xFF4056A1);

  // Financial Semantics
  static const Color income = Color(0xFF059669); // Emerald Green
  static const Color incomeBg = Color(0x1F059669);
  static const Color expense = Color(0xFFDC2626); // Crimson Red
  static const Color expenseBg = Color(0x1FDC2626);
  static const Color warning = Color(0xFFD97706); // Amber Warning
  static const Color warningBg = Color(0x1FD97706);
  static const Color info = Color(0xFF2563EB); // Sky / Royal Blue
  static const Color infoBg = Color(0x1F2563EB);

  // Text Hierarchy
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFFCBD5E1);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textInverse = Color(0xFF0F172A);
}
