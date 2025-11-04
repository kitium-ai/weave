package com.kitiumai.weave.listeners

import com.intellij.ide.AppLifecycleListener
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManagerListener
import com.kitiumai.weave.services.WeaveAIService
import org.slf4j.LoggerFactory

/**
 * Weave Startup Listener
 * Handles plugin startup
 */
class WeaveStartupListener : AppLifecycleListener {
  private val logger = LoggerFactory.getLogger(javaClass)

  override fun appStarted() {
    logger.info("Weave AI Assistant plugin started")
  }

  override fun appClosing() {
    logger.info("Weave AI Assistant plugin closing")
  }
}

/**
 * Weave Project Listener
 * Handles project events
 */
class WeaveProjectListener : ProjectManagerListener {
  private val logger = LoggerFactory.getLogger(javaClass)

  override fun projectOpened(project: Project) {
    logger.info("Weave: Project opened - ${project.name}")

    // Initialize AI service for this project
    val aiService = WeaveAIService.getInstance(project)
    logger.debug("Weave AI Service initialized for project: ${project.name}")
  }

  override fun projectClosing(project: Project) {
    logger.info("Weave: Project closing - ${project.name}")

    // Cleanup AI service
    val aiService = WeaveAIService.getInstance(project)
    aiService.dispose()
    logger.debug("Weave AI Service disposed for project: ${project.name}")
  }
}
