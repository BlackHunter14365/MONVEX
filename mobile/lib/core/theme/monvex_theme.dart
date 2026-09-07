import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/colors.dart';

class MonvexTheme {
  static ThemeData get darkTheme {
    final baseTextTheme = ThemeData.dark().textTheme;
    final interTextTheme = GoogleFonts.interTextTheme(baseTextTheme).copyWith(
      displayLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.w800, letterSpacing: -1.0),
      displayMedium: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.w700, letterSpacing: -0.8),
      titleLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 19, letterSpacing: -0.4),
      titleMedium: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 16),
      titleSmall: GoogleFonts.inter(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 14),
      bodyLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w400),
      bodyMedium: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13.5, fontWeight: FontWeight.w400),
      bodySmall: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w400),
      labelLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
      labelMedium: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w500),
      labelSmall: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.surface,
        error: AppColors.expense,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimary,
      ),
      textTheme: interTextTheme,
      fontFamily: GoogleFonts.inter().fontFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardTheme(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceElevated,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.expense),
        ),
        hintStyle: GoogleFonts.inter(
          color: AppColors.textMuted,
          fontSize: 13,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500),
      ),
    );
  }
}
