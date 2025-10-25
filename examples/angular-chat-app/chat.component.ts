/**
 * Angular Chat Component Example
 * Demonstrates AIService with RxJS Observables
 */

import { Component, OnInit } from '@angular/core';
import { AIService } from '@weave/angular';
import type { ChatMessage } from '@weave/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  input = '';
  loading = false;
  error: Error | null = null;
  status = 'idle';

  constructor(private aiService: AIService) {}

  ngOnInit(): void {
    // Subscribe to AI service state
    this.aiService.state$.subscribe((state) => {
      this.messages = state.data || [];
      this.loading = state.loading;
      this.error = state.error;
      this.status = state.status;
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.input.trim()) return;

    const userMessage = this.input;
    this.input = '';

    // Send message and get response
    const response = await this.aiService.execute(async () => {
      // Call underlying chat model
      return Promise.resolve(userMessage);
    });

    if (response) {
      // Add assistant message
      this.messages.push({
        role: 'assistant',
        content: response,
      });
    }
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
