import 'package:flutter/services.dart';

/// Centralized Android tactile feedback utility.
/// Provides subtle, non-intrusive haptic feedback for key user actions.
class AppHaptics {
  /// Button taps, chip selections, tab switches
  static void selection() {
    HapticFeedback.selectionClick();
  }

  /// Subtle touch feedback
  static void light() {
    HapticFeedback.lightImpact();
  }

  /// Transaction created, budget set, goal milestone reached
  static void medium() {
    HapticFeedback.mediumImpact();
  }

  /// Confirmations, biometric approval, receipt scanned
  static void success() {
    HapticFeedback.heavyImpact();
  }

  /// Delete actions, warnings, invalid attempts
  static void warning() {
    HapticFeedback.vibrate();
  }
}
