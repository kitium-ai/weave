import 'package:flutter_test/flutter_test.dart';
import 'package:weave_flutter/models/ai_state.dart';
import 'package:weave_flutter/providers/ai_provider.dart';

void main() {
  group('AIState', () {
    test('should create idle state', () {
      final state = AIState<String>.idle();
      expect(state.data, isNull);
      expect(state.loading, false);
      expect(state.error, isNull);
      expect(state.status, AIStatus.idle);
    });

    test('should create loading state', () {
      final state = AIState<String>.loading();
      expect(state.loading, true);
      expect(state.status, AIStatus.loading);
    });

    test('should create success state', () {
      final state = AIState<String>.success('result');
      expect(state.data, 'result');
      expect(state.status, AIStatus.success);
    });

    test('should create error state', () {
      final error = Exception('Test error');
      final state = AIState<String>.error(error);
      expect(state.error, error);
      expect(state.status, AIStatus.error);
    });

    test('should copyWith override data', () {
      final originalState = AIState<String>(data: 'original');
      final newState = originalState.copyWith(data: 'updated');

      expect(newState.data, 'updated');
      expect(originalState.data, 'original');
    });

    test('should copyWith override status', () {
      final originalState = AIState<String>.idle();
      final newState = originalState.copyWith(status: AIStatus.loading);

      expect(newState.status, AIStatus.loading);
      expect(originalState.status, AIStatus.idle);
    });
  });

  group('AIProvider', () => {
    late AIProvider<String> provider;

    setUp(() {
      provider = AIProvider<String>();
    });

    test('should initialize with idle state', () {
      expect(provider.state.status, AIStatus.idle);
      expect(provider.state.data, isNull);
      expect(provider.state.loading, false);
    });

    test('should execute and update state successfully', () async {
      var stateChanges = <AIState<String>>[];
      provider.addListener(() {
        stateChanges.add(provider.state);
      });

      final result = await provider.execute(() async => 'success');

      expect(result, 'success');
      expect(stateChanges.isNotEmpty, true);
      expect(provider.state.data, 'success');
      expect(provider.state.status, AIStatus.success);
    });

    test('should handle execution error', () async {
      var stateChanges = <AIState<String>>[];
      provider.addListener(() {
        stateChanges.add(provider.state);
      });

      final result = await provider.execute(() async {
        throw Exception('Test error');
      });

      expect(result, isNull);
      expect(provider.state.status, AIStatus.error);
      expect(provider.state.error, isNotNull);
    });

    test('should reset to idle state', () async {
      await provider.execute(() async => 'result');
      expect(provider.state.status, AIStatus.success);

      provider.reset();
      expect(provider.state.status, AIStatus.idle);
      expect(provider.state.data, isNull);
      expect(provider.state.error, isNull);
    });
  });

  group('GenerateProvider', () {
    late GenerateProvider provider;

    setUp(() {
      provider = GenerateProvider(baseUrl: 'http://localhost:3000');
    });

    test('should initialize correctly', () {
      expect(provider.state.status, AIStatus.idle);
    });

    test('should generate text', () async {
      // Note: This test would need a mock HTTP server or mock Dio
      // For now, we're just testing the provider creation
      expect(provider, isNotNull);
    });
  });

  group('ClassifyProvider', () {
    late ClassifyProvider provider;

    setUp(() {
      provider = ClassifyProvider(baseUrl: 'http://localhost:3000');
    });

    test('should initialize correctly', () {
      expect(provider.state.status, AIStatus.idle);
    });
  });

  group('ExtractProvider', () {
    late ExtractProvider provider;

    setUp(() {
      provider = ExtractProvider(baseUrl: 'http://localhost:3000');
    });

    test('should initialize correctly', () {
      expect(provider.state.status, AIStatus.idle);
    });
  });
}
