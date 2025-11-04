/// Weave Flutter integration library
///
/// Provides Flutter widgets, providers, and hooks for integrating AI capabilities
/// into Flutter applications with built-in cost tracking, budget management, and
/// error handling.
///
/// Example usage:
/// ```dart
/// final provider = GenerateProvider(
///   baseUrl: 'http://localhost:3000',
/// );
///
/// provider.setBudgetConfig(
///   BudgetConfig(
///     perSession: 1.0,
///     onBudgetExceeded: 'warn',
///   ),
/// );
///
/// final result = await provider.generate('Write a poem about AI');
/// ```
library weave_flutter;

export 'models/ai_state.dart';
export 'providers/ai_provider.dart';
