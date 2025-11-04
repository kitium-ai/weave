package com.kitiumai.weave.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.InputValidator
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.wm.ToolWindowManager
import com.kitiumai.weave.services.CodeContext
import com.kitiumai.weave.services.WeaveAIService
import com.kitiumai.weave.toolwindow.WeaveChatToolWindow
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

/**
 * Base Weave Action
 * Common functionality for all Weave actions
 */
abstract class BaseWeaveAction : AnAction() {
  protected fun getSelectedText(editor: Editor?): String? {
    if (editor == null) return null
    val selectionModel = editor.selectionModel
    return if (selectionModel.hasSelection()) {
      selectionModel.selectedText
    } else {
      null
    }
  }

  protected fun getCodeContext(project: Project?, editor: Editor?): CodeContext? {
    if (project == null || editor == null) return null

    val selectedText = getSelectedText(editor) ?: return null
    val document = editor.document
    val file = FileDocumentManager.getInstance().getFile(document) ?: return null

    val selectionModel = editor.selectionModel
    val startLine = document.getLineNumber(selectionModel.selectionStart)
    val endLine = document.getLineNumber(selectionModel.selectionEnd)

    return CodeContext(
      code = selectedText,
      language = detectLanguage(file.fileType.name),
      fileName = file.name,
      lineStart = startLine,
      lineEnd = endLine
    )
  }

  protected fun detectLanguage(fileType: String): String {
    return when {
      fileType.contains("JavaScript", ignoreCase = true) -> "javascript"
      fileType.contains("TypeScript", ignoreCase = true) -> "typescript"
      fileType.contains("Python", ignoreCase = true) -> "python"
      fileType.contains("Java", ignoreCase = true) -> "java"
      fileType.contains("Kotlin", ignoreCase = true) -> "kotlin"
      fileType.contains("HTML", ignoreCase = true) -> "html"
      fileType.contains("CSS", ignoreCase = true) -> "css"
      fileType.contains("SQL", ignoreCase = true) -> "sql"
      else -> "plaintext"
    }
  }

  protected fun showNotification(project: Project, title: String, message: String, isError: Boolean = false) {
    if (isError) {
      Messages.showErrorDialog(project, message, title)
    } else {
      Messages.showInfoMessage(project, message, title)
    }
  }

  protected fun showResultPanel(project: Project, title: String, content: String) {
    val toolWindowManager = ToolWindowManager.getInstance(project)
    val toolWindow = toolWindowManager.getToolWindow("Weave AI Chat")

    if (toolWindow != null) {
      toolWindow.activate(null)
      val contentManager = toolWindow.contentManager
      val component = contentManager.getContent(0)?.component

      if (component is WeaveChatToolWindow) {
        component.displayResult(title, content)
      }
    }
  }
}

/**
 * Chat Action
 * Opens the chat tool window
 */
class ChatAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val toolWindowManager = ToolWindowManager.getInstance(project)
    val toolWindow = toolWindowManager.getToolWindow("Weave AI Chat")

    if (toolWindow != null) {
      toolWindow.activate(null)
    }
  }

  override fun update(e: AnActionEvent) {
    val project = e.project
    e.presentation.isEnabled = project != null
  }
}

/**
 * Inline Edit Action
 * Edit selected code with AI
 */
class InlineEditAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val editor = e.getData(CommonDataKeys.EDITOR) ?: return

    val selectedText = getSelectedText(editor) ?: run {
      showNotification(project, "Weave", "Please select code to edit", isError = true)
      return
    }

    val language = getCodeContext(project, editor)?.language ?: "plaintext"

    val instruction = Messages.showInputDialog(
      project,
      "Enter edit instruction:",
      "Weave: Inline Edit",
      Messages.getQuestionIcon(),
      "",
      object : InputValidator {
        override fun checkInput(inputString: String): Boolean = inputString.isNotEmpty()
        override fun canClose(inputString: String): Boolean = inputString.isNotEmpty()
      }
    )

    if (instruction.isNullOrEmpty()) return

    val aiService = WeaveAIService.getInstance(project)
    if (!aiService.isConfigured()) {
      showNotification(project, "Weave", "API key not configured", isError = true)
      return
    }

    GlobalScope.launch {
      try {
        val editedCode = aiService.inlineEdit(selectedText, instruction, language)

        // Replace selected text
        WriteCommandAction.runWriteCommandAction(project) {
          editor.document.replaceString(
            editor.selectionModel.selectionStart,
            editor.selectionModel.selectionEnd,
            editedCode
          )
        }

        showNotification(project, "Weave", "Code edited successfully")
      } catch (ex: Exception) {
        showNotification(project, "Weave", "Error: ${ex.message}", isError = true)
      }
    }
  }

  override fun update(e: AnActionEvent) {
    val editor = e.getData(CommonDataKeys.EDITOR)
    e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
  }
}

/**
 * Analyze Code Action
 * Analyze code with AI
 */
class AnalyzeCodeAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val editor = e.getData(CommonDataKeys.EDITOR) ?: return

    val context = getCodeContext(project, editor) ?: run {
      showNotification(project, "Weave", "Please select code to analyze", isError = true)
      return
    }

    val aiService = WeaveAIService.getInstance(project)
    if (!aiService.isConfigured()) {
      showNotification(project, "Weave", "API key not configured", isError = true)
      return
    }

    GlobalScope.launch {
      try {
        val analysis = aiService.analyzeCode(context.code, context.language)
        showResultPanel(project, "Code Analysis", analysis)
      } catch (ex: Exception) {
        showNotification(project, "Weave", "Error: ${ex.message}", isError = true)
      }
    }
  }

  override fun update(e: AnActionEvent) {
    val editor = e.getData(CommonDataKeys.EDITOR)
    e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
  }
}

/**
 * Optimize Action
 * Get optimization suggestions
 */
class OptimizeAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val editor = e.getData(CommonDataKeys.EDITOR) ?: return

    val context = getCodeContext(project, editor) ?: run {
      showNotification(project, "Weave", "Please select code to optimize", isError = true)
      return
    }

    val aiService = WeaveAIService.getInstance(project)
    if (!aiService.isConfigured()) {
      showNotification(project, "Weave", "API key not configured", isError = true)
      return
    }

    GlobalScope.launch {
      try {
        val suggestions = aiService.suggestOptimization(context.code, context.language)
        showResultPanel(project, "Optimization Suggestions", suggestions)
      } catch (ex: Exception) {
        showNotification(project, "Weave", "Error: ${ex.message}", isError = true)
      }
    }
  }

  override fun update(e: AnActionEvent) {
    val editor = e.getData(CommonDataKeys.EDITOR)
    e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
  }
}

/**
 * Generate Prompt Action
 * Generate AI-optimized prompt
 */
class GeneratePromptAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val editor = e.getData(CommonDataKeys.EDITOR) ?: return

    val context = getCodeContext(project, editor) ?: run {
      showNotification(project, "Weave", "Please select code", isError = true)
      return
    }

    val aiService = WeaveAIService.getInstance(project)
    if (!aiService.isConfigured()) {
      showNotification(project, "Weave", "API key not configured", isError = true)
      return
    }

    GlobalScope.launch {
      try {
        val prompt = aiService.generatePrompt(context.code, context.language)
        showResultPanel(project, "Generated Prompt", prompt)
      } catch (ex: Exception) {
        showNotification(project, "Weave", "Error: ${ex.message}", isError = true)
      }
    }
  }

  override fun update(e: AnActionEvent) {
    val editor = e.getData(CommonDataKeys.EDITOR)
    e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
  }
}

/**
 * Generate Documentation Action
 * Generate code documentation
 */
class GenerateDocAction : BaseWeaveAction() {
  override fun actionPerformed(e: AnActionEvent) {
    val project = e.project ?: return
    val editor = e.getData(CommonDataKeys.EDITOR) ?: return

    val context = getCodeContext(project, editor) ?: run {
      showNotification(project, "Weave", "Please select code", isError = true)
      return
    }

    val aiService = WeaveAIService.getInstance(project)
    if (!aiService.isConfigured()) {
      showNotification(project, "Weave", "API key not configured", isError = true)
      return
    }

    GlobalScope.launch {
      try {
        val documentation = aiService.generateDocumentation(context.code, context.language)
        showResultPanel(project, "Generated Documentation", documentation)
      } catch (ex: Exception) {
        showNotification(project, "Weave", "Error: ${ex.message}", isError = true)
      }
    }
  }

  override fun update(e: AnActionEvent) {
    val editor = e.getData(CommonDataKeys.EDITOR)
    e.presentation.isEnabled = editor?.selectionModel?.hasSelection() == true
  }
}
