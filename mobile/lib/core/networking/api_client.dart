import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';
import '../storage/secure_storage.dart';
import 'api_endpoints.dart';

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
  static const Duration _timeout = Duration(seconds: 18);
  static bool _isRefreshing = false;

  static Map<String, String> _buildHeaders(String? token, [Map<String, String>? extraHeaders]) {
    final reqId = 'req_mob_${DateTime.now().millisecondsSinceEpoch}';
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': reqId,
      'X-Client-Platform': 'flutter-android',
      'X-Client-Version': '5.0.0',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  /// Attempts to refresh access token using stored refresh token
  static Future<String?> _attemptTokenRefresh() async {
    if (_isRefreshing) return null;
    _isRefreshing = true;
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      final uri = Uri.parse('${EnvConfig.baseUrl}${ApiEndpoints.refresh}');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: jsonEncode({'refresh': refreshToken}),
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic> && data['access'] != null) {
          final newAccess = data['access'].toString();
          await SecureStorageService.saveTokens(
            accessToken: newAccess,
            refreshToken: data['refresh']?.toString() ?? refreshToken,
          );
          return newAccess;
        }
      }
      return null;
    } catch (e) {
      debugPrint('[ApiClient] Token refresh failed: $e');
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode == 401) {
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
      errorMsg = 'Server error (${response.statusCode})';
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

      var response = await http
          .get(uri, headers: _buildHeaders(token))
          .timeout(_timeout);

      // Handle token expiration & automatic retry
      if (response.statusCode == 401) {
        final newToken = await _attemptTokenRefresh();
        if (newToken != null) {
          response = await http
              .get(uri, headers: _buildHeaders(newToken))
              .timeout(_timeout);
        } else {
          await SecureStorageService.clearTokens();
          onUnauthorized?.call();
        }
      }

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

  static Future<Uint8List> getBytes(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      var uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      var response = await http
          .get(uri, headers: _buildHeaders(token, {'Accept': 'application/pdf, application/octet-stream'}))
          .timeout(_timeout);

      if (response.statusCode == 401) {
        final newToken = await _attemptTokenRefresh();
        if (newToken != null) {
          response = await http
              .get(uri, headers: _buildHeaders(newToken, {'Accept': 'application/pdf, application/octet-stream'}))
              .timeout(_timeout);
        } else {
          await SecureStorageService.clearTokens();
          onUnauthorized?.call();
          throw ApiException('Session expired', 401);
        }
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.bodyBytes;
      }
      throw ApiException('Download failed with status ${response.statusCode}', response.statusCode);
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

      var response = await http
          .post(uri, headers: _buildHeaders(token), body: jsonEncode(body))
          .timeout(_timeout);

      if (response.statusCode == 401) {
        final newToken = await _attemptTokenRefresh();
        if (newToken != null) {
          response = await http
              .post(uri, headers: _buildHeaders(newToken), body: jsonEncode(body))
              .timeout(_timeout);
        } else {
          await SecureStorageService.clearTokens();
          onUnauthorized?.call();
        }
      }

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

      var response = await http
          .patch(uri, headers: _buildHeaders(token), body: jsonEncode(body))
          .timeout(_timeout);

      if (response.statusCode == 401) {
        final newToken = await _attemptTokenRefresh();
        if (newToken != null) {
          response = await http
              .patch(uri, headers: _buildHeaders(newToken), body: jsonEncode(body))
              .timeout(_timeout);
        } else {
          await SecureStorageService.clearTokens();
          onUnauthorized?.call();
        }
      }

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

      var response = await http
          .delete(uri, headers: _buildHeaders(token))
          .timeout(_timeout);

      if (response.statusCode == 401) {
        final newToken = await _attemptTokenRefresh();
        if (newToken != null) {
          response = await http
              .delete(uri, headers: _buildHeaders(newToken))
              .timeout(_timeout);
        } else {
          await SecureStorageService.clearTokens();
          onUnauthorized?.call();
        }
      }

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

  /// Multipart file upload for receipts and documents
  static Future<dynamic> uploadFile(
    String endpoint, {
    required List<int> fileBytes,
    required String filename,
    String fieldName = 'file',
    Map<String, String>? fields,
  }) async {
    try {
      final token = await SecureStorageService.getAccessToken();
      final uri = Uri.parse('${EnvConfig.baseUrl}$endpoint');

      final request = http.MultipartRequest('POST', uri);
      request.headers.addAll({
        'Accept': 'application/json',
        'X-Request-ID': 'req_upload_${DateTime.now().millisecondsSinceEpoch}',
        'X-Client-Platform': 'flutter-android',
        'X-Client-Version': '5.0.0',
      });
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      if (fields != null) {
        request.fields.addAll(fields);
      }

      request.files.add(http.MultipartFile.fromBytes(
        fieldName,
        fileBytes,
        filename: filename,
      ));

      final streamedResponse = await request.send().timeout(_timeout);
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot reach MONVEX API. Please check your internet connection.');
    } on TimeoutException {
      throw ApiException('Upload timed out. Please try again.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }
}
