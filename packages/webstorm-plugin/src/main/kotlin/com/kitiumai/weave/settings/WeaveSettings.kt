package com.kitiumai.weave.settings

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.project.Project
import com.intellij.util.xmlb.XmlSerializerUtil

/**
 * Weave Settings State
 * Manages plugin configuration persistence
 */
@State(
  name = "WeaveSettings",
  storages = [Storage("weaveSettings.xml")]
)
class WeaveSettings : PersistentStateComponent<WeaveSettings> {
  // Basic Settings
  var enabled: Boolean = true
  var apiKey: String = ""
  var provider: String = "anthropic"  // Default to Anthropic for WebStorm
  var model: String = "claude-3-opus-20240229"

  // Response Settings
  var temperature: Double = 0.7
  var maxTokens: Int = 2000

  // Feature Settings
  var enableChat: Boolean = true
  var enableInlineEdit: Boolean = true
  var enableAnalysis: Boolean = true
  var enableOptimization: Boolean = true
  var enableDocGeneration: Boolean = true

  // Language Settings
  var languageScope: String = "javascript,typescript,python,java,kotlin"

  override fun getState(): WeaveSettings {
    return this
  }

  override fun loadState(state: WeaveSettings) {
    XmlSerializerUtil.copyBean(state, this)
  }

  companion object {
    fun getInstance(project: Project): WeaveSettings {
      return project.getService(WeaveSettings::class.java)
    }
  }
}

/**
 * Weave Settings Holder
 * Provides convenient access to settings
 */
class WeaveSettingsHolder {
  var enabled: Boolean = true
    private set

  var apiKey: String = ""
    private set

  var provider: String = "anthropic"
    private set

  var model: String = "claude-3-opus-20240229"
    private set

  var temperature: Double = 0.7
    private set

  var maxTokens: Int = 2000
    private set

  var enableChat: Boolean = true
    private set

  var enableInlineEdit: Boolean = true
    private set

  var enableAnalysis: Boolean = true
    private set

  var enableOptimization: Boolean = true
    private set

  var enableDocGeneration: Boolean = true
    private set

  var languageScope: List<String> = listOf("javascript", "typescript", "python", "java", "kotlin")
    private set

  fun updateSettings(settings: WeaveSettings) {
    enabled = settings.enabled
    apiKey = settings.apiKey
    provider = settings.provider
    model = settings.model
    temperature = settings.temperature
    maxTokens = settings.maxTokens
    enableChat = settings.enableChat
    enableInlineEdit = settings.enableInlineEdit
    enableAnalysis = settings.enableAnalysis
    enableOptimization = settings.enableOptimization
    enableDocGeneration = settings.enableDocGeneration
    languageScope = settings.languageScope.split(",").map { it.trim() }
  }

  fun isLanguageInScope(languageId: String): Boolean {
    return languageScope.contains(languageId.lowercase())
  }

  fun isFeatureEnabled(feature: String): Boolean {
    return when (feature) {
      "chat" -> enableChat
      "inlineEdit" -> enableInlineEdit
      "analysis" -> enableAnalysis
      "optimization" -> enableOptimization
      "docGeneration" -> enableDocGeneration
      else -> false
    }
  }
}
