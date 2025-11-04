# Weave AI Assistant for WebStorm - Development Guide

## Project Structure

```
webstorm-plugin/
├── build.gradle.kts                      # Build configuration
├── src/
│   └── main/
│       ├── kotlin/com/kitiumai/weave/
│       │   ├── settings/
│       │   │   ├── WeaveSettings.kt
│       │   │   └── WeaveSettingsConfigurable.kt
│       │   ├── services/
│       │   │   └── WeaveAIService.kt
│       │   ├── actions/
│       │   │   └── WeaveActions.kt
│       │   ├── toolwindow/
│       │   │   └── WeaveChatToolWindow.kt
│       │   ├── listeners/
│       │   │   └── WeaveListeners.kt
│       │   └── editor/
│       │       └── WeaveEditorListener.kt
│       └── resources/
│           └── META-INF/
│               └── plugin.xml
├── README.md                             # User documentation
├── QUICKSTART.md                         # Quick start guide
└── DEVELOPMENT.md                        # This file
```

## Architecture

### Core Components

#### 1. **WeaveSettings** (`services/WeaveSettings.kt`)
Persistent state management for plugin configuration.

**Responsibilities:**
- Store API key, model, provider settings
- Manage feature toggles
- Language scope configuration

**Key Properties:**
```kotlin
var enabled: Boolean = true
var apiKey: String = ""
var provider: String = "anthropic"
var model: String = "claude-3-opus-20240229"
var temperature: Double = 0.7
var maxTokens: Int = 2000
var languageScope: String = "javascript,typescript,python,java,kotlin"
```

#### 2. **WeaveSettingsConfigurable** (`settings/WeaveSettingsConfigurable.kt`)
UI for settings panel in WebStorm preferences.

**Features:**
- Settings form with UI components
- Input validation
- Live modification detection
- Apply/Reset functionality

#### 3. **WeaveAIService** (`services/WeaveAIService.kt`)
Main service for AI operations - this is the core intelligence.

**Key Methods:**
```kotlin
suspend fun sendChatMessage(message: String): String
suspend fun analyzeCode(code: String, language: String): String
suspend fun inlineEdit(code: String, instruction: String, language: String): String
suspend fun suggestOptimization(code: String, language: String): String
suspend fun generateDocumentation(code: String, language: String): String
suspend fun generatePrompt(code: String, language: String): String
```

**Implementation Details:**
- HTTP client for API calls (OkHttp3)
- Async/await with Coroutines
- JSON serialization (Gson)
- Error handling with meaningful messages

#### 4. **WeaveActions** (`actions/WeaveActions.kt`)
Implements all user-triggered actions.

**Actions:**
- `ChatAction` - Opens chat tool window
- `InlineEditAction` - Edit code with AI
- `AnalyzeCodeAction` - Analyze selected code
- `OptimizeAction` - Get optimization suggestions
- `GeneratePromptAction` - Generate AI prompt
- `GenerateDocAction` - Generate documentation

**Base Class:** `BaseWeaveAction`
- Common utility methods
- Code context detection
- Language detection
- Result display

#### 5. **WeaveChatToolWindow** (`toolwindow/WeaveChatToolWindow.kt`)
Chat interface as JetBrains tool window.

**Features:**
- Chat display area (scrollable)
- Input field
- Send/Clear buttons
- Message formatting
- History management

#### 6. **WeaveListeners** (`listeners/WeaveListeners.kt`)
Lifecycle event handling.

**Listeners:**
- `WeaveStartupListener` - Plugin initialization
- `WeaveProjectListener` - Project open/close events

## Plugin Lifecycle

```
IDE Startup
    ↓
WeaveStartupListener.appStarted()
    ↓
Project Opens
    ↓
WeaveProjectListener.projectOpened()
    ├── WeaveAIService initialized
    └── Chat tool window available
    ↓
User Actions
    ├── Chat (ChatAction)
    ├── Edit (InlineEditAction)
    ├── Analyze (AnalyzeCodeAction)
    └── ... other actions
    ↓
Project Closes
    ↓
WeaveProjectListener.projectClosing()
    └── WeaveAIService disposed()
    ↓
IDE Shutdown
```

## Building and Testing

### Prerequisites
- Java 17+
- Gradle 8.0+
- IntelliJ IDEA SDK (bundled by plugin)

### Building
```bash
# Build the plugin
./gradlew build

# Build distribution package
./gradlew buildPlugin
```

### Running in IDE
```bash
# Run plugin in development IDE
./gradlew runIde
```

### Creating Distribution
```bash
# Create .zip file for distribution
./gradlew buildPlugin
# Output: build/distributions/webstorm-plugin-1.0.0.zip
```

## API Integration

### Anthropic API Calls

```kotlin
// Build request body
val requestBody = JsonObject().apply {
  addProperty("model", "claude-3-opus-20240229")
  addProperty("max_tokens", 2000)
  addProperty("temperature", 0.7)
  add("messages", JsonArray().apply {
    add(JsonObject().apply {
      addProperty("role", "user")
      addProperty("content", prompt)
    })
  })
}

// Make API call
val request = Request.Builder()
  .url("https://api.anthropic.com/v1/messages")
  .header("Content-Type", "application/json")
  .header("x-api-key", apiKey)
  .header("anthropic-version", "2023-06-01")
  .post(requestBody.toString().toRequestBody())
  .build()

// Get response
val response = client.newCall(request).execute()
val responseText = response.body?.string()
```

## Configuration Schema (plugin.xml)

### Actions
```xml
<action id="Weave.ChatAction"
        class="com.kitiumai.weave.actions.ChatAction"
        text="Chat with Weave AI"
        description="Open Weave AI chat panel">
  <keyboard-shortcut keymap="$default" first-keystroke="ctrl shift slash"/>
  <add-to-group group-id="EditorPopupMenu" anchor="first"/>
</action>
```

### Settings
```xml
<projectConfigurable parentId="tools" id="Weave.Settings"
                     instance="com.kitiumai.weave.settings.WeaveSettingsConfigurable"
                     displayName="Weave AI Assistant"/>
```

### Tool Window
```xml
<toolWindowFactory id="Weave AI Chat"
                   implementation="com.kitiumai.weave.toolwindow.WeaveChatToolWindowFactory"
                   anchor="right"
                   icon="/icons/weave.svg"/>
```

## Language Detection

```kotlin
fun detectLanguage(fileType: String): String {
  return when {
    fileType.contains("JavaScript", ignoreCase = true) -> "javascript"
    fileType.contains("TypeScript", ignoreCase = true) -> "typescript"
    fileType.contains("Python", ignoreCase = true) -> "python"
    fileType.contains("Java", ignoreCase = true) -> "java"
    fileType.contains("Kotlin", ignoreCase = true) -> "kotlin"
    else -> "plaintext"
  }
}
```

## Error Handling

### Configuration Errors
```kotlin
if (!aiService.isConfigured()) {
  showNotification(project, "Weave", "API key not configured", isError = true)
  return
}
```

### API Errors
```kotlin
try {
  val response = callAnthropicAPI(prompt)
} catch (e: Exception) {
  showNotification(project, "Weave", "Error: ${e.message}", isError = true)
}
```

### UI Errors
```kotlin
val selectedText = getSelectedText(editor) ?: run {
  showNotification(project, "Weave", "Please select code", isError = true)
  return
}
```

## Testing

### Unit Tests
```kotlin
@Test
fun testLanguageDetection() {
  val action = AnalyzeCodeAction()
  assertEquals("javascript", action.detectLanguage("JavaScript"))
  assertEquals("typescript", action.detectLanguage("TypeScript"))
}
```

### Integration Tests
```kotlin
@Test
fun testChatMessage() {
  val service = WeaveAIService.getInstance(project)
  val response = runBlocking { service.sendChatMessage("Hello") }
  assert(response.isNotEmpty())
}
```

### Manual Testing
1. Run `./gradlew runIde`
2. Open WebStorm development instance
3. Test each action:
   - Press `Ctrl+Shift+/` for chat
   - Select code and press `Ctrl+K, Ctrl+I` for edit
   - Select code and press `Ctrl+Shift+W, A` for analysis
4. Check tool window displays correctly
5. Verify settings persist

## Debugging

### Enable Debug Mode
```kotlin
// In WeaveAIService.kt
private val logger = LoggerFactory.getLogger(javaClass)

logger.debug("Sending API request to Anthropic")
logger.error("API error: ${e.message}", e)
```

### View Logs
```
Help → Show Log in Explorer
```

### IDE Debugger
```
Run → Debug 'Run IDE with Plugin'
Set breakpoints and step through code
```

## Dependencies

### Gradle Dependencies
```kotlin
dependencies {
  implementation(kotlin("stdlib"))
  implementation("com.squareup.okhttp3:okhttp:4.11.0")
  implementation("com.google.code.gson:gson:2.10.1")
  implementation("org.slf4j:slf4j-api:2.0.9")
  testImplementation("junit:junit:4.13.2")
  testImplementation("org.mockito:mockito-core:5.5.0")
}
```

### IntelliJ Platform
```kotlin
intellij {
  version.set("2023.1")
  type.set("WS")  // WebStorm
  plugins.set(listOf("com.jetbrains.javascript"))
}
```

## Code Standards

### Kotlin Style
- Use `camelCase` for variables/functions
- Use `PascalCase` for classes
- Use `UPPER_CASE` for constants
- Max line length: 120 characters
- Use descriptive names

### Documentation
- JSDoc comments for public APIs
- Inline comments for complex logic
- README for user features
- DEVELOPMENT.md for technical details

### Error Handling
- Use try/catch for exceptions
- Log errors appropriately
- Show user-friendly messages
- Graceful degradation

## Publishing

### Build Distribution Package
```bash
./gradlew buildPlugin
# Output: build/distributions/webstorm-plugin-1.0.0.zip
```

### Publish to JetBrains Marketplace
```bash
./gradlew publishPlugin
```

**Requirements:**
- Account on JetBrains Marketplace
- Signing certificate (optional but recommended)
- GitHub releases

## Performance Considerations

### API Calls
- Use coroutines for async operations
- Implement timeouts (30s connect, 60s read)
- Handle rate limiting gracefully

### UI Responsiveness
- Don't block EDT (Event Dispatch Thread)
- Use `GlobalScope.launch` for background tasks
- Show progress indicators for long operations

### Memory Management
- Dispose resources in `projectClosing()`
- Limit chat history size
- Close HTTP connections properly

## Security

### API Key Handling
```kotlin
// ✅ Correct: Use WebStorm's secure storage
val apiKey = settings.apiKey

// ❌ Avoid: Logging API key
logger.info("API Key: $apiKey")

// ❌ Avoid: Storing in plain text
```

### Input Validation
```kotlin
// Validate user input
val message = inputArea.text.trim()
if (message.isEmpty()) return

// Sanitize code before sending
val cleanedCode = code.trim()
```

## Troubleshooting Development

### Plugin not loading
```
1. ./gradlew clean build
2. File → Invalidate Caches
3. Restart IDE
```

### API calls failing
```
1. Check API key in settings
2. Verify internet connection
3. Check Anthropic API status
4. Review error logs
```

### UI components not showing
```
1. Check plugin.xml syntax
2. Verify action IDs match references
3. Clear IDE caches
4. Restart IDE
```

## Resources

- [IntelliJ Plugin SDK](https://plugins.jetbrains.com/docs/intellij/)
- [Gradle Plugin](https://plugins.jetbrains.com/docs/intellij/gradle-prerequisites.html)
- [UI Components](https://plugins.jetbrains.com/docs/intellij/ui-components.html)
- [Anthropic API](https://docs.anthropic.com/)

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Follow code standards

## Support

- **Issues**: [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- **Questions**: [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- **SDK Docs**: [JetBrains](https://plugins.jetbrains.com/docs/intellij/)

---

**Happy Coding!** 🚀
