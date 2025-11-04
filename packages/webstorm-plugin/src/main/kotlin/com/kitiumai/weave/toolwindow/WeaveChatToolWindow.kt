package com.kitiumai.weave.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.SimpleToolWindowPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import com.intellij.ui.dsl.builder.panel
import com.kitiumai.weave.services.ChatMessage
import com.kitiumai.weave.services.WeaveAIService
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import javax.swing.*

/**
 * Weave Chat Tool Window
 * Provides chat interface within WebStorm
 */
class WeaveChatToolWindow(private val project: Project) : SimpleToolWindowPanel(true, true) {
  private val aiService = WeaveAIService.getInstance(project)
  private val chatHistory = mutableListOf<ChatMessage>()
  private lateinit var chatArea: JBTextArea
  private lateinit var inputArea: JBTextArea
  private lateinit var sendButton: JButton
  private lateinit var clearButton: JButton

  init {
    initializeUI()
  }

  private fun initializeUI() {
    // Chat display area
    chatArea = JBTextArea().apply {
      isEditable = false
      lineWrap = true
      wrapStyleWord = true
      background = UIManager.getColor("EditorPane.background")
      foreground = UIManager.getColor("EditorPane.foreground")
    }

    val chatScrollPane = JBScrollPane(chatArea).apply {
      preferredSize = Dimension(400, 300)
    }

    // Input area
    inputArea = JBTextArea().apply {
      lineWrap = true
      wrapStyleWord = true
      preferredSize = Dimension(400, 100)
      font = UIManager.getFont("TextArea.font")
    }

    val inputScrollPane = JBScrollPane(inputArea)

    // Buttons
    sendButton = JButton("Send").apply {
      addActionListener { sendMessage() }
    }

    clearButton = JButton("Clear").apply {
      addActionListener { clearHistory() }
    }

    // Main layout
    val mainPanel = panel {
      row {
        label("Chat History:")
      }
      row {
        cell(chatScrollPane)
          .resizableColumn()
      }

      row {
        label("Your Message:")
      }
      row {
        cell(inputScrollPane)
          .resizableColumn()
      }

      row {
        cell(sendButton)
        cell(clearButton)
      }
    }

    setContent(mainPanel)
    toolbar = createToolbar()
  }

  private fun createToolbar(): JComponent {
    val toolbar = JPanel().apply {
      layout = BoxLayout(this, BoxLayout.X_AXIS)
      add(sendButton)
      add(Box.createHorizontalStrut(5))
      add(clearButton)
      add(Box.createHorizontalGlue())
    }
    return toolbar
  }

  private fun sendMessage() {
    val message = inputArea.text.trim()
    if (message.isEmpty()) {
      return
    }

    if (!aiService.isConfigured()) {
      appendToChatArea("Error: API key not configured. Check settings.")
      return
    }

    // Add user message
    appendUserMessage(message)
    inputArea.text = ""

    // Send to AI
    GlobalScope.launch {
      try {
        val response = aiService.sendChatMessage(message)
        appendAssistantMessage(response)
      } catch (e: Exception) {
        appendToChatArea("Error: ${e.message}")
      }
    }
  }

  private fun appendUserMessage(message: String) {
    chatHistory.add(ChatMessage("user", message))
    appendToChatArea("You: $message\n")
  }

  private fun appendAssistantMessage(message: String) {
    chatHistory.add(ChatMessage("assistant", message))
    appendToChatArea("Weave AI: $message\n\n")
  }

  private fun appendToChatArea(text: String) {
    chatArea.append(text)
    chatArea.caretPosition = chatArea.document.length
  }

  private fun clearHistory() {
    val confirmed = JOptionPane.showConfirmDialog(
      this,
      "Clear chat history?",
      "Weave Chat",
      JOptionPane.YES_NO_OPTION
    )

    if (confirmed == JOptionPane.YES_OPTION) {
      chatArea.text = ""
      chatHistory.clear()
    }
  }

  fun displayResult(title: String, content: String) {
    val result = "\n=== $title ===\n$content\n"
    appendToChatArea(result)
  }
}

/**
 * Weave Chat Tool Window Factory
 * Creates the tool window instance
 */
class WeaveChatToolWindowFactory : com.intellij.openapi.wm.ToolWindowFactory {
  override fun createToolWindowContent(project: Project, toolWindow: com.intellij.openapi.wm.ToolWindow) {
    val chatWindow = WeaveChatToolWindow(project)
    val contentManager = toolWindow.contentManager
    val content = contentManager.factory.createContent(chatWindow, null, false)
    contentManager.addContent(content)
  }

  override fun isApplicable(project: Project): Boolean = true
}
