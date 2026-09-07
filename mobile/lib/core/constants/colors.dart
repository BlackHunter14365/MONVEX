import 'package:flutter/material.dart';

/// Semantic Color System for MONVEX Android V5.0
class AppColors {
  // Backgrounds & Semantic Surfaces
  static const Color background = Color(0xFF0C0E14);        // Warm deep obsidian
  static const Color surface = Color(0xFF161922);           // Base elevated card surface
  static const Color surfaceElevated = Color(0xFF1E2230);   // Modals, sheets & popups
  static const Color surfaceHigher = Color(0xFF282D40);     // Active input & focused cards
  static const Color border = Color(0x24FFFFFF);            // Crisp card border
  static const Color borderSubtle = Color(0x12FFFFFF);      // Micro divider

  // Semantic Surfaces & Brand Accents
  static const Color deepPlum = Color(0xFF281838);          // High-emphasis executive brand surface
  static const Color deepPlumBorder = Color(0xFF4C2A6A);    // Plum highlight border
  static const Color primary = Color(0xFF4F46E5);           // Controlled indigo
  static const Color primaryLight = Color(0xFF6366F1);      // Bright indigo
  static const Color primaryDark = Color(0xFF3730A3);       // Muted indigo
  static const Color accent = Color(0xFF818CF8);            // Soft lavender accent

  // Financial Domain Semantics
  static const Color netWorth = Color(0xFF818CF8);          // Lavender for Net Worth & Reserves
  static const Color netWorthBg = Color(0x1F818CF8);
  static const Color income = Color(0xFF10B981);            // Emerald Green for Income & Surplus
  static const Color incomeBg = Color(0x1F10B981);
  static const Color expense = Color(0xFFF43F5E);           // Rose for Outflow & Spending
  static const Color expenseBg = Color(0x1FF43F5E);
  static const Color cashflow = Color(0xFF06B6D4);          // Cyan for Cashflow & Forecasting
  static const Color cashflowBg = Color(0x1F06B6D4);
  static const Color warning = Color(0xFFF59E0B);           // Amber for Budget Warnings & Near-Cap
  static const Color warningBg = Color(0x1FF59E0B);
  static const Color info = Color(0xFF06B6D4);              // Cyan for transfers & info
  static const Color infoBg = Color(0x1F06B6D4);
  static const Color ai = Color(0xFF818CF8);                 // Indigo/Cyan for Copilot
  static const Color aiCyan = Color(0xFF06B6D4);

  // Text Hierarchy
  static const Color textPrimary = Color(0xFFF8FAFC);       // Pure crisp white
  static const Color textSecondary = Color(0xFFCBD5E1);     // Soft cool gray
  static const Color textMuted = Color(0xFF94A3B8);         // Slate gray
  static const Color textInverse = Color(0xFF0C0E14);       // Deep dark for light buttons
}
