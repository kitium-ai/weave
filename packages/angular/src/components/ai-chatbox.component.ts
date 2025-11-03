import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * AIChatbox Component
 * Full-featured chat interface
 */
@Component({
  selector: 'weave-ai-chatbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weave-chatbox" [class]="'weave-chatbox--' + theme">
      <div class="weave-chatbox__messages" #messagesContainer>
        <div
          *ngFor="let message of messages"
          [class]="'weave-chatbox__message weave-chatbox__message--' + message.role"
        >
          <div class="weave-chatbox__message-content">
            <span *ngIf="!enableMarkdown">{{ message.content }}</span>
            <span *ngIf="enableMarkdown" [innerHTML]="formatMarkdown(message.content)"></span>
          </div>
          <div *ngIf="showTimestamps && message.timestamp" class="weave-chatbox__timestamp">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
        <div *ngIf="isLoading" class="weave-chatbox__loading">
          <span></span><span></span><span></span>
        </div>
      </div>
      <form class="weave-chatbox__form" (ngSubmit)="handleSend()">
        <textarea
          [(ngModel)]="inputMessage"
          [placeholder]="placeholder"
          class="weave-chatbox__input"
          name="message"
          (keydown.ctrl.enter)="handleSend()"
        ></textarea>
        <button
          type="submit"
          class="weave-chatbox__send-button"
          [disabled]="!inputMessage || isLoading"
        >
          Send
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .weave-chatbox {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 600px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background-color: #fff;
      }

      .weave-chatbox--dark {
        background-color: #1a1a1a;
        border-color: #333;
      }

      .weave-chatbox__messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .weave-chatbox__message {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 80%;
        animation: messageSlide 0.3s ease-out;
      }

      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .weave-chatbox__message--user {
        align-self: flex-end;
      }

      .weave-chatbox__message--assistant {
        align-self: flex-start;
      }

      .weave-chatbox__message-content {
        padding: 12px 16px;
        border-radius: 8px;
        word-wrap: break-word;
      }

      .weave-chatbox__message--user .weave-chatbox__message-content {
        background-color: #007bff;
        color: white;
      }

      .weave-chatbox--dark .weave-chatbox__message--user .weave-chatbox__message-content {
        background-color: #0056b3;
      }

      .weave-chatbox__message--assistant .weave-chatbox__message-content {
        background-color: #f0f0f0;
        color: #000;
      }

      .weave-chatbox--dark .weave-chatbox__message--assistant .weave-chatbox__message-content {
        background-color: #333;
        color: #fff;
      }

      .weave-chatbox__timestamp {
        font-size: 0.75rem;
        color: #999;
        margin: 0 4px;
      }

      .weave-chatbox__loading {
        display: flex;
        gap: 4px;
        padding: 12px;
      }

      .weave-chatbox__loading span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #999;
        animation: pulse 1.4s infinite;
      }

      .weave-chatbox__loading span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .weave-chatbox__loading span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes pulse {
        0%,
        80%,
        100% {
          opacity: 0.3;
        }
        40% {
          opacity: 1;
        }
      }

      .weave-chatbox__form {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e0e0e0;
        background-color: #fafafa;
      }

      .weave-chatbox--dark .weave-chatbox__form {
        background-color: #252525;
        border-top-color: #333;
      }

      .weave-chatbox__input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 40px;
        max-height: 120px;
      }

      .weave-chatbox--dark .weave-chatbox__input {
        background-color: #333;
        border-color: #555;
        color: #fff;
      }

      .weave-chatbox__send-button {
        padding: 10px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }

      .weave-chatbox__send-button:hover:not(:disabled) {
        background-color: #0056b3;
      }

      .weave-chatbox__send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AIChatboxComponent implements OnInit, AfterViewChecked {
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() onSendMessage?: (message: string) => Promise<void>;
  @Input() initialMessages: ChatMessage[] = [];
  @Input() showTimestamps: boolean = false;
  @Input() enableMarkdown: boolean = false;
  @Input() placeholder: string = 'Type your message...';
  @Output() sendMessage = new EventEmitter<string>();
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  messages: ChatMessage[] = [];
  inputMessage: string = '';
  isLoading: boolean = false;
  private shouldScroll: boolean = true;

  ngOnInit(): void {
    this.messages = this.initialMessages;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  }

  async handleSend(): Promise<void> {
    if (!this.inputMessage.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: this.inputMessage,
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    const messageToSend = this.inputMessage;
    this.inputMessage = '';
    this.shouldScroll = true;

    this.sendMessage.emit(messageToSend);

    if (this.onSendMessage) {
      this.isLoading = true;
      try {
        await this.onSendMessage(messageToSend);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
