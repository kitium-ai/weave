/// AI provider for Flutter state management
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/ai_state.dart';

/// Base AI provider for state management
class AIProvider<T> extends ChangeNotifier {
  /// Current state
  AIState<T> _state = AIState.idle();

  /// Get current state
  AIState<T> get state => _state;

  /// Update state
  void _setState(AIState<T> newState) {
    _state = newState;
    notifyListeners();
  }

  /// Execute async operation with state management
  Future<T?> execute(Future<T> Function() fn) async {
    try {
      _setState(AIState.loading());
      final result = await fn();
      _setState(AIState.success(result));
      return result;
    } catch (e) {
      final error = e is Exception ? e : Exception(e.toString());
      _setState(AIState.error(error));
      return null;
    }
  }

  /// Reset to idle state
  void reset() {
    _setState(AIState.idle());
  }
}

/// Generate provider for text generation
class GenerateProvider extends AIProvider<String> {
  final Dio _dio;
  final String _baseUrl;

  /// Creates a GenerateProvider
  GenerateProvider({
    required String baseUrl,
    Dio? dio,
  })  : _baseUrl = baseUrl,
        _dio = dio ?? Dio();

  /// Generate text from prompt
  Future<String?> generate(String prompt, [Map<String, dynamic>? options]) async {
    return execute(() async {
      final response = await _dio.post(
        '$_baseUrl/generate',
        data: {
          'prompt': prompt,
          if (options != null) 'options': options,
        },
      );
      return response.data['text'] ?? '';
    });
  }
}

/// Classify provider for text classification
class ClassifyProvider extends AIProvider<Map<String, dynamic>> {
  final Dio _dio;
  final String _baseUrl;

  /// Creates a ClassifyProvider
  ClassifyProvider({
    required String baseUrl,
    Dio? dio,
  })  : _baseUrl = baseUrl,
        _dio = dio ?? Dio();

  /// Classify text into categories
  Future<Map<String, dynamic>?> classify(String text, List<String> labels) async {
    return execute(() async {
      final response = await _dio.post(
        '$_baseUrl/classify',
        data: {
          'text': text,
          'labels': labels,
        },
      );
      return Map<String, dynamic>.from(response.data);
    });
  }
}

/// Extract provider for data extraction
class ExtractProvider extends AIProvider<Map<String, dynamic>> {
  final Dio _dio;
  final String _baseUrl;

  /// Creates an ExtractProvider
  ExtractProvider({
    required String baseUrl,
    Dio? dio,
  })  : _baseUrl = baseUrl,
        _dio = dio ?? Dio();

  /// Extract structured data from text
  Future<Map<String, dynamic>?> extract(String text, Map<String, dynamic> schema) async {
    return execute(() async {
      final response = await _dio.post(
        '$_baseUrl/extract',
        data: {
          'text': text,
          'schema': schema,
        },
      );
      return Map<String, dynamic>.from(response.data);
    });
  }
}
