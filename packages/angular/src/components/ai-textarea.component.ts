import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'weave-ai-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weave-textarea-wrapper">
      <textarea
        [(ngModel)]="value"
        (input)="handleInput($event)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        class="weave-textarea"
        [style.min-height.px]="minHeight"
        [style.max-height.px]="maxHeight"
        name="textarea"
      ></textarea>
      <button
        *ngIf="onAISuggest"
        class="weave-textarea__ai-button"
        [disabled]="!value || isLoading"
        (click)="handleAISuggest()"
        type="button"
      >
        <span *ngIf="!isLoading">✨ Suggest</span>
        <span *ngIf="isLoading">Loading...</span>
      </button>
    </div>
  `,
  styles: [
    `
      .weave-textarea-wrapper {
        position: relative;
        width: 100%;
      }
      .weave-textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        overflow-y: auto;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .weave-textarea:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      .weave-textarea:disabled,
      .weave-textarea[readonly] {
        background-color: #f5f5f5;
        color: #999;
        cursor: not-allowed;
      }
      @media (prefers-color-scheme: dark) {
        .weave-textarea {
          background-color: #333;
          border-color: #555;
          color: #fff;
        }
        .weave-textarea:focus {
          border-color: #0056b3;
        }
      }
      .weave-textarea__ai-button {
        position: absolute;
        bottom: 8px;
        right: 8px;
        padding: 6px 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .weave-textarea__ai-button:hover:not(:disabled) {
        background-color: #0056b3;
      }
      .weave-textarea__ai-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AITextareaComponent {
  @Input() value: string = '';
  @Input() onAISuggest?: (text: string) => Promise<string>;
  @Input() placeholder: string = 'Enter text here...';
  @Input() minRows: number = 3;
  @Input() maxRows: number = 8;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  isLoading: boolean = false;
  lineHeight = 24;

  get minHeight(): number {
    return this.minRows * this.lineHeight;
  }
  get maxHeight(): number {
    return this.maxRows * this.lineHeight;
  }

  handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }

  async handleAISuggest(): Promise<void> {
    if (!this.onAISuggest || this.isLoading || !this.value) {
      return;
    }
    this.isLoading = true;
    try {
      const suggestion = await this.onAISuggest(this.value);
      if (suggestion) {
        this.value = suggestion;
        this.valueChange.emit(this.value);
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
