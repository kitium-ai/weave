package com.kitiumai.weave.editor

import com.intellij.openapi.editor.EditorFactory
import com.intellij.openapi.editor.event.EditorFactoryEvent
import com.intellij.openapi.editor.event.EditorFactoryListener
import org.slf4j.LoggerFactory

/**
 * Weave Editor Listener
 * Monitors editor events
 */
class WeaveEditorListener : EditorFactoryListener {
  private val logger = LoggerFactory.getLogger(javaClass)

  override fun editorCreated(event: EditorFactoryEvent) {
    val editor = event.editor
    logger.debug("Editor created - ${editor.virtualFile?.name ?: "Unknown file"}")
  }

  override fun editorReleased(event: EditorFactoryEvent) {
    val editor = event.editor
    logger.debug("Editor released - ${editor.virtualFile?.name ?: "Unknown file"}")
  }
}
