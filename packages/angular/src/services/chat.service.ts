/**
 * Angular service for managing AI chat sessions with streaming support.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Weave, ChatMessage, GenerateOptions } from '@weaveai/core';
import {
  ChatController,
  type ChatControllerOptions,
  type ChatControllerState,
  type CostSummary,
} from '@weaveai/shared';

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  streaming: boolean;
  error: Error | null;
  costSummary: CostSummary | null;
}

const DEFAULT_STATE: ChatState = {
  messages: [],
  isLoading: false,
  streaming: false,
  error: null,
  costSummary: null,
};

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private controller: ChatController;
  private controllerUnsubscribe: (() => void) | null = null;
  private readonly stateSubject = new BehaviorSubject<ChatState>(DEFAULT_STATE);
  readonly state$: Observable<ChatState> = this.stateSubject.asObservable();

  constructor(private readonly weave: Weave) {
    this.controller = this.createController();
  }

  /**
   * Configure chat behaviour (streaming, persistence, etc.)
   */
  configure(options: ChatControllerOptions): void {
    this.controller = this.createController(options);
  }

  /**
   * Get current state snapshot.
   */
  getState(): ChatState {
    return this.stateSubject.value;
  }

  /**
   * Send a message to the assistant.
   */
  sendMessage(content: string, options?: GenerateOptions): Promise<string | null> {
    return this.controller.sendMessage(content, options);
  }

  addMessage(message: ChatMessage): void {
    this.controller.addMessage(message);
  }

  removeMessage(index: number): void {
    this.controller.removeMessage(index);
  }

  clear(): void {
    this.controller.clear();
  }

  download(): string {
    return this.controller.download();
  }

  private createController(options?: ChatControllerOptions): ChatController {
    if (this.controllerUnsubscribe) {
      this.controllerUnsubscribe();
      this.controllerUnsubscribe = null;
    }

    const controller = new ChatController(
      (prompt, generateOptions) => this.weave.generate(prompt, generateOptions),
      {
        streaming: { enabled: false, framework: 'angular' },
        ...(options ?? {}),
      }
    );

    const initial = controller.getState();
    this.stateSubject.next({
      messages: [...initial.messages],
      isLoading: initial.isLoading,
      streaming: initial.streaming,
      error: initial.error,
      costSummary: initial.costSummary,
    });

    this.controllerUnsubscribe = controller.subscribe((state: ChatControllerState) => {
      this.stateSubject.next({
        messages: [...state.messages],
        isLoading: state.isLoading,
        streaming: state.streaming,
        error: state.error,
        costSummary: state.costSummary,
      });
    });

    return controller;
  }
}
