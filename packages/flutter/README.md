# Weave Flutter - AI Integration for Flutter Apps

[![Pub Version](https://img.shields.io/pub/v/weave_flutter)](https://pub.dev/packages/weave_flutter)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Flutter](https://img.shields.io/badge/Flutter-3.0+-blue)](https://flutter.dev)

Weave Flutter is a powerful, production-ready library for integrating AI capabilities into Flutter applications. It provides built-in cost tracking, budget management, error handling, and streaming support for seamless AI integration.

## Features

✨ **Multi-Provider Support**
- OpenAI (GPT-4, GPT-3.5-turbo)
- Anthropic (Claude 3)
- Google (Gemini)
- Custom providers

🚀 **Streaming Responses**
- Real-time token streaming
- Progress tracking
- Better UX for long responses

💰 **Cost Tracking & Budgets**
- Per-session budget limits
- Per-hour and per-day budgets
- Automatic budget validation
- Cost tracking per operation

🔄 **Retry Logic**
- Exponential backoff
- Configurable retry attempts
- Automatic error recovery

📝 **Prompt Management**
- Create and manage prompts
- Test prompt rendering
- Template variable substitution
- Export/import functionality

🛡️ **Type Safety**
- Full Dart type safety
- Null-safe code
- Proper error handling

## Installation

Add this to your `pubspec.yaml`:

```yaml
dependencies:
  weave_flutter: ^1.0.0
```

Then run:

```bash
flutter pub get
```

## Quick Start

### 1. Basic Generation

```dart
import 'package:weave_flutter/weave_flutter.dart';

final provider = GenerateProvider(
  baseUrl: 'http://localhost:3000',
);

final result = await provider.generate('Write a poem about Flutter');
print(result);
```

### 2. With Budget Limits

```dart
final provider = GenerateProvider(
  baseUrl: 'http://localhost:3000',
);

// Set budget configuration
provider.setBudgetConfig(
  const BudgetConfig(
    perSession: 1.0,
    perHour: 10.0,
    onBudgetExceeded: 'warn',
  ),
);

// Generate content
final result = await provider.generate('Your prompt here');

// Check if budget exceeded
if (provider.state.budgetExceeded) {
  print('Budget exceeded!');
}

// Get total cost
print('Total cost: \$${provider.totalCost}');
```

### 3. Streaming Responses

```dart
final provider = GenerateProvider(
  baseUrl: 'http://localhost:3000',
);

// Stream tokens as they arrive
provider.generateStream('Write a story').listen((token) {
  print(token); // Print each token
});
```

### 4. With State Management (Provider)

```dart
import 'package:provider/provider.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => GenerateProvider(
            baseUrl: 'http://localhost:3000',
          ),
        ),
      ],
      child: MyHome(),
    );
  }
}

class MyHome extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<GenerateProvider>(context);

    return Scaffold(
      body: Column(
        children: [
          if (provider.state.loading)
            const CircularProgressIndicator()
          else if (provider.state.error != null)
            Text('Error: ${provider.state.error}')
          else if (provider.state.data != null)
            Text(provider.state.data!),
          ElevatedButton(
            onPressed: () => provider.generate('Write a poem'),
            child: const Text('Generate'),
          ),
        ],
      ),
    );
  }
}
```

### 5. Prompt Management

```dart
final promptProvider = PromptProvider(
  baseUrl: 'http://localhost:3000',
);

// Create a prompt
final prompt = await promptProvider.createPrompt(
  'Article Writer',
  'Write an article about {{topic}} in {{style}} style',
  description: 'Generate articles for any topic',
  tags: ['content', 'articles'],
);

// Test prompt rendering
final testResult = await promptProvider.testPrompt(
  'Write an article about {{topic}}',
  {'topic': 'Flutter'},
);

print(testResult);
```

## API Reference

### AIProvider<T>

Base provider for all AI operations.

**Methods:**
- `Future<T?> execute(Future<T> Function() fn, {double estimatedCost = 0.0})` - Execute operation with cost tracking
- `Future<T?> executeWithRetry(...)` - Execute with retry logic
- `void setBudgetConfig(BudgetConfig config)` - Set budget limits
- `void reset()` - Reset to idle state
- `void resetCost()` - Reset cost tracking

**Properties:**
- `AIState<T> state` - Current state
- `double totalCost` - Total cost spent
- `BudgetConfig? budgetConfig` - Current budget config

### GenerateProvider

Text generation provider.

**Methods:**
- `Future<String?> generate(String prompt, [Map<String, dynamic>? options])` - Generate text
- `Stream<String> generateStream(String prompt, [Map<String, dynamic>? options])` - Stream generation

### ClassifyProvider

Text classification provider.

**Methods:**
- `Future<Map<String, dynamic>?> classify(String text, List<String> labels)` - Classify text

### ExtractProvider

Data extraction provider.

**Methods:**
- `Future<Map<String, dynamic>?> extract(String text, Map<String, dynamic> schema)` - Extract data

### PromptProvider

Prompt management provider.

**Methods:**
- `Future<Map<String, dynamic>?> createPrompt(String name, String template, ...)` - Create prompt
- `Future<Map<String, dynamic>?> getPrompt(String promptId)` - Get prompt
- `Future<Map<String, dynamic>?> testPrompt(String template, Map<String, dynamic> variables)` - Test prompt

### AIState<T>

State model for AI operations.

**Properties:**
- `T? data` - Operation result
- `bool loading` - Is loading
- `Exception? error` - Error if any
- `AIStatus status` - Current status
- `int progress` - Progress percentage (0-100)
- `CostSummary? cost` - Cost information
- `bool budgetExceeded` - Is budget exceeded

### BudgetConfig

Budget configuration.

**Properties:**
- `double? perSession` - Session budget limit
- `double? perHour` - Hourly budget limit
- `double? perDay` - Daily budget limit
- `String onBudgetExceeded` - Action: 'error', 'warn', 'ignore'

## Configuration

### Backend Setup

Weave Flutter requires a Weave backend API running. Set up the backend at:
- http://localhost:3000 (development)
- Your production URL (production)

### Environment Variables

```dart
const String apiUrl = String.fromEnvironment('API_URL',
  defaultValue: 'http://localhost:3000');

final provider = GenerateProvider(baseUrl: apiUrl);
```

## Best Practices

### 1. Always Set Budget Limits

```dart
provider.setBudgetConfig(
  const BudgetConfig(
    perSession: 1.0,
    onBudgetExceeded: 'warn',
  ),
);
```

### 2. Handle Errors Gracefully

```dart
try {
  final result = await provider.generate(prompt);
} on Exception catch (e) {
  print('Error: $e');
}
```

### 3. Use Streaming for Long Responses

```dart
provider.generateStream(prompt).listen(
  (token) => print(token),
  onError: (error) => print('Error: $error'),
);
```

### 4. Track Costs

```dart
print('Cost: \$${provider.totalCost}');
print('Budget exceeded: ${provider.state.budgetExceeded}');
```

### 5. Reset When Needed

```dart
provider.reset(); // Reset state
provider.resetCost(); // Reset cost tracking
```

## Examples

See the `example/` directory for complete Flutter app examples:

- Basic generation with UI
- Cost tracking dashboard
- Streaming responses
- Prompt management
- Budget alerts

Run examples with:

```bash
cd example
flutter run
```

## Troubleshooting

### Connection Refused

Make sure your Weave backend is running:
```bash
npm run dev:backend  # or your backend start command
```

### Budget Exceeded

Check your budget configuration:
```dart
print(provider.totalCost);  // Current cost
print(provider.budgetConfig);  // Current limits
```

### Streaming Not Working

Verify backend supports streaming:
- Check backend logs
- Ensure SSE headers are set correctly
- Test with curl first

### Type Errors

Ensure you're using proper type annotations:
```dart
final provider = GenerateProvider(...);  // Correct
final provider = provider as GenerateProvider;  // Avoid casting
```

## Dependencies

- `dio`: ^5.0.0 - HTTP client
- `flutter`: ^3.0.0

## Platform Support

- ✅ Android
- ✅ iOS
- ✅ Web
- ✅ macOS
- ✅ Windows
- ✅ Linux

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Support

- 📚 [Weave Documentation](https://kitiumai.com/weave)
- 🐛 [Report Issues](https://github.com/kitium-ai/weave/issues)
- 💬 [Community Discord] - Launching Soon

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Built with ❤️ for Flutter developers by the Kitium AI team.**
