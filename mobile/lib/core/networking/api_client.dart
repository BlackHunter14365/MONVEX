import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';
import '../storage/secure_storage.dart';

typedef OnUnauthorizedCallback = void Function();

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiClient {
  static OnUnauthorizedCallback? onUnauthorized;
  static const Duration _timeout = Duration(seconds: 15);

  static Map<String, String> _buildHeaders(String? token, [Map<String, String>? extraHeaders]) {
    final reqId = 'req_mob_${DateTime.now().millisecondsSinceEpoch}';
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': reqId,
      'X-Client-Platform': 'flutter-android',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode == 401) {
      SecureStorageService.clearTokens();
      if (onUnauthorized != null) {
        onUnauthorized!();
      }
      throw ApiException('Your session has expired. Please sign in again.', 401);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    }

    String errorMsg = 'An unexpected server error occurred.';
    try {
      final err = jsonDecode(response.body);
      if (err is Map<String, dynamic>) {
        if (err['message'] != null) {
          errorMsg = err['message'].toString();
        } else if (err['detail'] != null) {
          errorMsg = err['detail'].toString();
        } else if (err['error'] != null) {
          errorMsg = err['error'] is Map ? (err['error']['message'] ?? err['error'].toString()) : err['error'].toString();
        } else if (err.values.isNotEmpty) {
          final first = err.values.first;
          errorMsg = first is List ? first.join(' ') : first.toString();
        }
      }
    } catch (_) {
      errorMsg = 'Server returned status ${response.statusCode}';
    }

    throw ApiException(errorMsg, response.statusCode);
  }

  static Future<dynamic> get(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      var uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http
          .get(uri, headers: _buildHeaders(token))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot reach MONVEX API. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Connection timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      final uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');

      final response = await http
          .post(uri, headers: _buildHeaders(token), body: jsonEncode(body))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot reach MONVEX API. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Connection timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      final uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');

      final response = await http
          .patch(uri, headers: _buildHeaders(token), body: jsonEncode(body))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot reach MONVEX API. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Connection timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  static Future<dynamic> delete(String endpoint) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      final uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');

      final response = await http
          .delete(uri, headers: _buildHeaders(token))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot reach MONVEX API. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Connection timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }
}
