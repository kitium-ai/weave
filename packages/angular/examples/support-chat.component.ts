import { Component, inject } from '@angular/core';
import { ChatService } from '@weaveai/angular';

@Component({
  selector: 'app-support-chat-example',
  templateUrl: './support-chat.component.html',
  styleUrls: ['./support-chat.component.css'],
})
export class SupportChatComponent {
  private readonly chat = inject(ChatService);
  readonly state$ = this.chat.state$;

  constructor() {
    this.chat.configure({
      systemPrompt: 'You are a concise, friendly support representative.',
      streaming: { enabled: true, renderer: 'markdown', framework: 'angular' },
      persistence: { key: 'support-chat-example', autoSave: true },
    });
  }

  send(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (!value) {
      return;
    }

    void this.chat.sendMessage(value);
    input.value = '';
  }
}
