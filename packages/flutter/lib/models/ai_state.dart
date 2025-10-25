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

  /// Creates an AIState instance
  const AIState({
    this.data,
    this.loading = false,
    this.error,
    this.status = AIStatus.idle,
  });

  /// Creates a copy with optional overrides
  AIState<T> copyWith({
    T? data,
    bool? loading,
    Exception? error,
    AIStatus? status,
  }) {
    return AIState<T>(
      data: data ?? this.data,
      loading: loading ?? this.loading,
      error: error ?? this.error,
      status: status ?? this.status,
    );
  }

  /// Creates an idle state
  factory AIState.idle() => const AIState();

  /// Creates a loading state
  factory AIState.loading() => const AIState(loading: true, status: AIStatus.loading);

  /// Creates a success state
  factory AIState.success(T data) => AIState(data: data, status: AIStatus.success);

  /// Creates an error state
  factory AIState.error(Exception error) => AIState(error: error, status: AIStatus.error);
}

/// Status enum for AI operations
enum AIStatus {
  idle,
  loading,
  success,
  error,
}
