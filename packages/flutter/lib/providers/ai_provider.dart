/// AI provider for Flutter state management
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/ai_state.dart';

/// Base AI provider for state management
class AIProvider<T> extends ChangeNotifier {
  /// Current state
  AIState<T> _state = AIState.idle();

  /// Cost tracking
  double _totalCost = 0.0;

  /// Budget configuration
  BudgetConfig? _budgetConfig;

  /// Get current state
  AIState<T> get state => _state;

  /// Get total cost
  double get totalCost => _totalCost;

  /// Get budget config
  BudgetConfig? get budgetConfig => _budgetConfig;

  /// Check if budget is exceeded
  bool _checkBudgetExceeded(double sessionCost) {
    if (_budgetConfig == null) return false;

    if (_budgetConfig!.perSession != null &&
        sessionCost > _budgetConfig!.perSession!) {
      return true;
    }

    return false;
  }

  /// Update state
  void _setState(AIState<T> newState) {
    _state = newState;
    notifyListeners();
  }

  /// Set budget configuration
  void setBudgetConfig(BudgetConfig config) {
    _budgetConfig = config;
    notifyListeners();
  }

  /// Execute async operation with state management and cost tracking
  Future<T?> execute(
    Future<T> Function() fn, {
    double estimatedCost = 0.0,
  }) async {
    try {
      _setState(AIState.loading());

      final result = await fn();
      _totalCost += estimatedCost;

      // Check budget
      final budgetExceeded = _checkBudgetExceeded(_totalCost);

      final cost = CostSummary(
        totalCost: estimatedCost,
      );

      _setState(AIState.success(
        result,
        cost: cost,
      ).copyWith(budgetExceeded: budgetExceeded));

      return result;
    } catch (e) {
      final error = e is Exception ? e : Exception(e.toString());
      _setState(AIState.error(error));
      return null;
    }
  }

  /// Execute with retry logic
  Future<T?> executeWithRetry(
    Future<T> Function() fn, {
    int maxAttempts = 3,
    Duration delayMs = const Duration(milliseconds: 1000),
    double estimatedCost = 0.0,
  }) async {
    Exception? lastError;

    for (int attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await execute(fn, estimatedCost: estimatedCost);
      } catch (e) {
        lastError = e is Exception ? e : Exception(e.toString());

        if (attempt < maxAttempts - 1) {
          await Future.delayed(
            Duration(milliseconds: delayMs.inMilliseconds * (attempt + 1)),
          );
        }
      }
    }

    if (lastError != null) {
      _setState(AIState.error(lastError));
    }

    return null;
  }

  /// Reset to idle state
  void reset() {
    _setState(AIState.idle());
  }

  /// Reset cost tracking
  void resetCost() {
    _totalCost = 0.0;
    notifyListeners();
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
  Future<String?> generate(
    String prompt, [
    Map<String, dynamic>? options,
  ]) async {
    return executeWithRetry(
      () async {
        final response = await _dio.post(
          '$_baseUrl/api/generate',
          data: {
            'prompt': prompt,
            if (options != null) ...options,
          },
        );
        return response.data['data']?['text'] ?? '';
      },
      maxAttempts: 3,
      estimatedCost: 0.002,
    );
  }

  /// Generate with streaming
  Stream<String> generateStream(
    String prompt, [
    Map<String, dynamic>? options,
  ]) async* {
    try {
      _setState(AIState.loading());

      final response = await _dio.post(
        '$_baseUrl/api/generate/stream',
        data: {
          'prompt': prompt,
          if (options != null) ...options,
        },
        options: Options(responseType: ResponseType.stream),
      );

      int progress = 0;
      String buffer = '';

      await for (final chunk in response.data.stream) {
        final text = String.fromCharCodes(chunk);
        buffer += text;

        // Parse SSE format
        if (buffer.contains('\n')) {
          final lines = buffer.split('\n');
          buffer = lines.last;

          for (final line in lines.sublist(0, lines.length - 1)) {
            if (line.startsWith('data: ')) {
              try {
                final data = line.substring(6);
                yield data;
                progress = (progress + 5).clamp(0, 99);
                _setState(state.copyWith(progress: progress));
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      _setState(state.copyWith(
        progress: 100,
        status: AIStatus.success,
      ));
    } catch (e) {
      final error = e is Exception ? e : Exception(e.toString());
      _setState(AIState.error(error));
    }
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
  Future<Map<String, dynamic>?> classify(
    String text,
    List<String> labels,
  ) async {
    return executeWithRetry(
      () async {
        final response = await _dio.post(
          '$_baseUrl/api/classify',
          data: {
            'text': text,
            'labels': labels,
          },
        );
        return Map<String, dynamic>.from(
          response.data['data'] ?? response.data,
        );
      },
      maxAttempts: 3,
      estimatedCost: 0.001,
    );
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
  Future<Map<String, dynamic>?> extract(
    String text,
    Map<String, dynamic> schema,
  ) async {
    return executeWithRetry(
      () async {
        final response = await _dio.post(
          '$_baseUrl/api/extract',
          data: {
            'text': text,
            'schema': schema,
          },
        );
        return Map<String, dynamic>.from(
          response.data['data'] ?? response.data,
        );
      },
      maxAttempts: 3,
      estimatedCost: 0.002,
    );
  }
}

/// Prompt provider for prompt management
class PromptProvider extends AIProvider<Map<String, dynamic>> {
  final Dio _dio;
  final String _baseUrl;

  /// Creates a PromptProvider
  PromptProvider({
    required String baseUrl,
    Dio? dio,
  })  : _baseUrl = baseUrl,
        _dio = dio ?? Dio();

  /// Create a new prompt
  Future<Map<String, dynamic>?> createPrompt(
    String name,
    String template, {
    String? description,
    List<String>? tags,
  }) async {
    return execute(() async {
      final response = await _dio.post(
        '$_baseUrl/api/prompts',
        data: {
          'name': name,
          'template': template,
          'description': description,
          'tags': tags,
        },
      );
      return Map<String, dynamic>.from(
        response.data['data'] ?? response.data,
      );
    });
  }

  /// Get prompt by ID
  Future<Map<String, dynamic>?> getPrompt(String promptId) async {
    return execute(() async {
      final response = await _dio.get(
        '$_baseUrl/api/prompts/$promptId',
      );
      return Map<String, dynamic>.from(
        response.data['data'] ?? response.data,
      );
    });
  }

  /// Test prompt rendering
  Future<Map<String, dynamic>?> testPrompt(
    String template,
    Map<String, dynamic> variables,
  ) async {
    return execute(() async {
      final response = await _dio.post(
        '$_baseUrl/api/generate/test',
        data: {
          'template': template,
          'variables': variables,
        },
      );
      return Map<String, dynamic>.from(
        response.data['data'] ?? response.data,
      );
    });
  }
}
