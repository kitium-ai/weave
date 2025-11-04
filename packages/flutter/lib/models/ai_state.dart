/// Cost summary for AI operations
class CostSummary {
  /// Total cost in USD
  final double totalCost;

  /// Cost per input token
  final double? costPerInputToken;

  /// Cost per output token
  final double? costPerOutputToken;

  /// Number of input tokens
  final int? inputTokens;

  /// Number of output tokens
  final int? outputTokens;

  /// Provider used
  final String? provider;

  /// Model used
  final String? model;

  /// Creates a CostSummary
  const CostSummary({
    required this.totalCost,
    this.costPerInputToken,
    this.costPerOutputToken,
    this.inputTokens,
    this.outputTokens,
    this.provider,
    this.model,
  });
}

/// Budget configuration for cost limiting
class BudgetConfig {
  /// Maximum budget per session in USD
  final double? perSession;

  /// Maximum budget per hour in USD
  final double? perHour;

  /// Maximum budget per day in USD
  final double? perDay;

  /// Action when budget exceeded: 'error', 'warn', 'ignore'
  final String onBudgetExceeded;

  /// Creates a BudgetConfig
  const BudgetConfig({
    this.perSession,
    this.perHour,
    this.perDay,
    this.onBudgetExceeded = 'warn',
  });
}

/// AI operation state model for Flutter
class AIState<T> {
  /// Current data from operation
  final T? data;

  /// Whether operation is in progress
  final bool loading;

  /// Error from operation
  final Exception? error;

  /// Current status
  final AIStatus status;

  /// Progress percentage (0-100)
  final int progress;

  /// Cost summary
  final CostSummary? cost;

  /// Whether budget is exceeded
  final bool budgetExceeded;

  /// Creates an AIState instance
  const AIState({
    this.data,
    this.loading = false,
    this.error,
    this.status = AIStatus.idle,
    this.progress = 0,
    this.cost,
    this.budgetExceeded = false,
  });

  /// Creates a copy with optional overrides
  AIState<T> copyWith({
    T? data,
    bool? loading,
    Exception? error,
    AIStatus? status,
    int? progress,
    CostSummary? cost,
    bool? budgetExceeded,
  }) {
    return AIState<T>(
      data: data ?? this.data,
      loading: loading ?? this.loading,
      error: error ?? this.error,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      cost: cost ?? this.cost,
      budgetExceeded: budgetExceeded ?? this.budgetExceeded,
    );
  }

  /// Creates an idle state
  factory AIState.idle() => const AIState();

  /// Creates a loading state
  factory AIState.loading() => const AIState(loading: true, status: AIStatus.loading);

  /// Creates a success state
  factory AIState.success(T data, {CostSummary? cost}) => AIState(
        data: data,
        status: AIStatus.success,
        cost: cost,
      );

  /// Creates an error state
  factory AIState.error(Exception error) => AIState(
        error: error,
        status: AIStatus.error,
      );
}

/// Status enum for AI operations
enum AIStatus {
  idle,
  loading,
  success,
  error,
  cancelled,
}
