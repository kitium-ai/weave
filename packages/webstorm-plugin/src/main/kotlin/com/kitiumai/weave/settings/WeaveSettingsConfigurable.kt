package com.kitiumai.weave.settings

import com.intellij.openapi.options.Configurable
import com.intellij.openapi.options.ConfigurationException
import com.intellij.openapi.project.Project
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPasswordField
import com.intellij.ui.components.JBTextField
import com.intellij.ui.dsl.builder.bindItem
import com.intellij.ui.dsl.builder.bindSelected
import com.intellij.ui.dsl.builder.bindText
import com.intellij.ui.dsl.builder.panel
import javax.swing.JComponent

/**
 * Weave Settings Configurable UI
 * Settings panel for WebStorm plugin
 */
class WeaveSettingsConfigurable(private val project: Project) : Configurable {
  private lateinit var settings: WeaveSettings
  private lateinit var settingsUI: WeaveSettingsPanel

  override fun getDisplayName(): String = "Weave AI Assistant"

  override fun getHelpTopic(): String? = "com.kitiumai.weave.help"

  override fun createComponent(): JComponent {
    settings = WeaveSettings.getInstance(project)
    settingsUI = WeaveSettingsPanel()
    return settingsUI.panel
  }

  override fun isModified(): Boolean {
    return settingsUI.isModified(settings)
  }

  override fun apply() {
    settingsUI.apply(settings)
  }

  override fun reset() {
    settingsUI.reset(settings)
  }

  override fun disposeUIResources() {}
}

/**
 * Weave Settings Panel
 * UI components for settings
 */
class WeaveSettingsPanel {
  lateinit var panel: JComponent
  private var enabledCheckBox: Boolean = true
  private var apiKeyField: String = ""
  private var providerField: String = "anthropic"
  private var modelField: String = "claude-3-opus-20240229"
  private var temperatureField: Double = 0.7
  private var maxTokensField: Int = 2000
  private var enableChatCheckBox: Boolean = true
  private var enableInlineEditCheckBox: Boolean = true
  private var enableAnalysisCheckBox: Boolean = true
  private var enableOptimizationCheckBox: Boolean = true
  private var enableDocGenerationCheckBox: Boolean = true
  private var languageScopeField: String = "javascript,typescript,python,java,kotlin"

  init {
    panel = panel {
      // Basic Settings Section
      group("Basic Settings") {
        row {
          checkBox("Enable Weave AI")
            .bindSelected(::enabledCheckBox)
        }

        row("API Key:") {
          cell(JBPasswordField())
            .bindText(::apiKeyField)
            .comment("Get your API key from https://console.anthropic.com")
        }

        row("Provider:") {
          comboBox(listOf("anthropic", "openai", "local"))
            .bindItem(::providerField)
            .comment("AI provider (Anthropic recommended for WebStorm)")
        }

        row("Model:") {
          cell(JBTextField())
            .bindText(::modelField)
            .comment("AI model to use (e.g., claude-3-opus-20240229)")
        }
      }

      // Response Settings Section
      group("Response Settings") {
        row("Temperature:") {
          slider(0, 200, step = 10)
            .bindValue({ (temperatureField * 100).toInt() }, { temperatureField = it / 100.0 })
            .comment("0-0.5: Focused, 0.7: Balanced (default), 1.0-2.0: Creative")
        }

        row("Max Tokens:") {
          intTextField(100..10000, 100)
            .bindValue(::maxTokensField)
            .comment("Maximum response length (higher = more detailed)")
        }
      }

      // Feature Settings Section
      group("Feature Settings") {
        row {
          checkBox("Enable Chat Interface")
            .bindSelected(::enableChatCheckBox)
        }

        row {
          checkBox("Enable Inline Editing")
            .bindSelected(::enableInlineEditCheckBox)
        }

        row {
          checkBox("Enable Code Analysis")
            .bindSelected(::enableAnalysisCheckBox)
        }

        row {
          checkBox("Enable Optimization Suggestions")
            .bindSelected(::enableOptimizationCheckBox)
        }

        row {
          checkBox("Enable Documentation Generation")
            .bindSelected(::enableDocGenerationCheckBox)
        }
      }

      // Language Settings Section
      group("Language Settings") {
        row("Supported Languages:") {
          cell(JBTextField())
            .bindText(::languageScopeField)
            .comment("Comma-separated list (e.g., javascript,typescript,python)")
        }
      }

      // Information Section
      group("Information") {
        row {
          label("Keyboard Shortcuts:")
        }

        row {
          label("  • Ctrl+Shift+/: Open Chat")
        }

        row {
          label("  • Ctrl+K, Ctrl+I: Inline Edit")
        }

        row {
          label("  • Ctrl+Shift+W, A: Analyze Code")
        }

        row {
          label("  • Ctrl+Shift+W, O: Optimize Code")
        }

        row {
          label("  • Ctrl+Shift+W, P: Generate Prompt")
        }
      }
    }
  }

  fun isModified(settings: WeaveSettings): Boolean {
    return enabledCheckBox != settings.enabled
      || apiKeyField != settings.apiKey
      || providerField != settings.provider
      || modelField != settings.model
      || temperatureField != settings.temperature
      || maxTokensField != settings.maxTokens
      || enableChatCheckBox != settings.enableChat
      || enableInlineEditCheckBox != settings.enableInlineEdit
      || enableAnalysisCheckBox != settings.enableAnalysis
      || enableOptimizationCheckBox != settings.enableOptimization
      || enableDocGenerationCheckBox != settings.enableDocGeneration
      || languageScopeField != settings.languageScope
  }

  fun apply(settings: WeaveSettings) {
    settings.enabled = enabledCheckBox
    settings.apiKey = apiKeyField
    settings.provider = providerField
    settings.model = modelField
    settings.temperature = temperatureField
    settings.maxTokens = maxTokensField
    settings.enableChat = enableChatCheckBox
    settings.enableInlineEdit = enableInlineEditCheckBox
    settings.enableAnalysis = enableAnalysisCheckBox
    settings.enableOptimization = enableOptimizationCheckBox
    settings.enableDocGeneration = enableDocGenerationCheckBox
    settings.languageScope = languageScopeField
  }

  fun reset(settings: WeaveSettings) {
    enabledCheckBox = settings.enabled
    apiKeyField = settings.apiKey
    providerField = settings.provider
    modelField = settings.model
    temperatureField = settings.temperature
    maxTokensField = settings.maxTokens
    enableChatCheckBox = settings.enableChat
    enableInlineEditCheckBox = settings.enableInlineEdit
    enableAnalysisCheckBox = settings.enableAnalysis
    enableOptimizationCheckBox = settings.enableOptimization
    enableDocGenerationCheckBox = settings.enableDocGeneration
    languageScopeField = settings.languageScope
  }
}
