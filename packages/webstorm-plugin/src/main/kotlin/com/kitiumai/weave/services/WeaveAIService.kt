package com.kitiumai.weave.services

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.kitiumai.weave.settings.WeaveSettings
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Weave AI Service
 * Handles communication with AI providers
 */
@Service(Service.Level.PROJECT)
class WeaveAIService(private val project: Project) {
  private val settings: WeaveSettings = WeaveSettings.getInstance(project)
  private val client = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .writeTimeout(60, TimeUnit.SECONDS)
    .build()

  private val gson = Gson()
  private val coroutineScope = CoroutineScope(Dispatchers.IO + Job())

  /**
   * Send chat message to AI
   */
  suspend fun sendChatMessage(message: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val response = callAnthropicAPI(message, "chat")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Analyze code with AI
   */
  suspend fun analyzeCode(code: String, language: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val prompt = """Analyze this $language code and provide insights:

```$language
$code
```

Include:
1. Code quality assessment
2. Potential issues
3. Performance considerations
4. Best practice recommendations"""

        val response = callAnthropicAPI(prompt, "analysis")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Edit code with AI
   */
  suspend fun inlineEdit(code: String, instruction: String, language: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val prompt = """Edit this $language code according to the instruction:

Instruction: $instruction

Original code:
```$language
$code
```

Provide only the edited code without explanation."""

        val response = callAnthropicAPI(prompt, "edit")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Suggest optimizations for code
   */
  suspend fun suggestOptimization(code: String, language: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val prompt = """Suggest optimizations for this $language code:

```$language
$code
```

For each suggestion, explain:
1. The current inefficiency
2. The optimized approach
3. Code example if applicable"""

        val response = callAnthropicAPI(prompt, "suggestion")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Generate documentation for code
   */
  suspend fun generateDocumentation(code: String, language: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val prompt = """Generate comprehensive documentation for this $language code:

```$language
$code
```

Include JSDoc/docstring format with descriptions, parameters, return types, and examples."""

        val response = callAnthropicAPI(prompt, "documentation")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Generate prompt for code
   */
  suspend fun generatePrompt(code: String, language: String): String {
    return withContext(coroutineScope.coroutineContext) {
      try {
        val prompt = """Generate an optimized prompt that describes this $language code:

```$language
$code
```

The prompt should be suitable for AI training or code documentation."""

        val response = callAnthropicAPI(prompt, "analysis")
        extractResponseText(response)
      } catch (e: Exception) {
        "Error: ${e.message}"
      }
    }
  }

  /**
   * Call Anthropic API
   */
  private fun callAnthropicAPI(prompt: String, type: String): String {
    if (!settings.enabled) {
      throw IllegalStateException("Weave is disabled")
    }

    if (settings.apiKey.isEmpty()) {
      throw IllegalArgumentException("API key not configured")
    }

    val requestBody = JsonObject().apply {
      addProperty("model", settings.model)
      addProperty("max_tokens", settings.maxTokens)
      addProperty("temperature", settings.temperature)
      add("messages", com.google.gson.JsonArray().apply {
        val messageObj = JsonObject().apply {
          addProperty("role", "user")
          addProperty("content", prompt)
        }
        add(messageObj)
      })
    }

    val request = Request.Builder()
      .url("https://api.anthropic.com/v1/messages")
      .header("Content-Type", "application/json")
      .header("x-api-key", settings.apiKey)
      .header("anthropic-version", "2023-06-01")
      .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
      .build()

    client.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw RuntimeException("API error: ${response.code} ${response.message}")
      }

      val responseBody = response.body?.string() ?: return ""
      return responseBody
    }
  }

  /**
   * Extract response text from API response
   */
  private fun extractResponseText(response: String): String {
    return try {
      val jsonObject = gson.fromJson(response, JsonObject::class.java)
      val content = jsonObject.getAsJsonArray("content")
        ?.get(0)
        ?.asJsonObject
        ?.get("text")
        ?.asString
      content ?: "No response from AI"
    } catch (e: Exception) {
      response
    }
  }

  /**
   * Check if API is configured
   */
  fun isConfigured(): Boolean {
    return settings.enabled && settings.apiKey.isNotEmpty()
  }

  /**
   * Cleanup resources
   */
  fun dispose() {
    coroutineScope.cancel()
    client.dispatcher.executorService.shutdown()
  }

  companion object {
    fun getInstance(project: Project): WeaveAIService {
      return project.getService(WeaveAIService::class.java)
    }
  }
}

/**
 * Chat message data class
 */
data class ChatMessage(
  val role: String,
  val content: String,
  val timestamp: Long = System.currentTimeMillis()
)

/**
 * Code context data class
 */
data class CodeContext(
  val code: String,
  val language: String,
  val fileName: String,
  val lineStart: Int,
  val lineEnd: Int
)
