import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'weave-ai-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weave-ai-input">
      <input
        [(ngModel)]="value"
        (input)="handleInput($event)"
        (focus)="showSuggestions = true"
        (blur)="setTimeout(() => (showSuggestions = false), 200)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        class="weave-ai-input__field"
        type="text"
        name="input"
        role="combobox"
        aria-autocomplete="list"
        [attr.aria-expanded]="showSuggestions && filteredSuggestions.length > 0"
      />
      <ul
        *ngIf="showSuggestions && filteredSuggestions.length"
        class="weave-ai-input__suggestions"
        role="listbox"
      >
        <li
          *ngFor="let suggestion of filteredSuggestions; let i = index"
          (click)="emitSelectSuggestion(suggestion)"
          class="weave-ai-input__suggestion-item"
          role="option"
          [attr.aria-selected]="i === selectedIndex"
        >
          {{ suggestion }}
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .weave-ai-input {
        position: relative;
        width: 100%;
      }
      .weave-ai-input__field {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .weave-ai-input__field:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      @media (prefers-color-scheme: dark) {
        .weave-ai-input__field {
          background-color: #333;
          border-color: #555;
          color: #fff;
        }
      }
      .weave-ai-input__suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin: 4px 0 0 0;
        padding: 0;
        list-style: none;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10;
        max-height: 200px;
        overflow-y: auto;
      }
      .weave-ai-input__suggestion-item {
        padding: 10px 12px;
        cursor: pointer;
        transition: background-color 0.15s;
      }
      .weave-ai-input__suggestion-item:hover {
        background-color: #f0f0f0;
      }
      .weave-ai-input__suggestion-item[aria-selected='true'] {
        background-color: #e7f3ff;
        color: #0056b3;
      }
    `,
  ],
})
export class AIInputComponent {
  @Input() value: string = '';
  @Input() suggestions: string[] = [];
  @Input() onSelectSuggestion?: (suggestion: string) => void;
  @Input() placeholder: string = 'Enter text...';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() selectSuggestion = new EventEmitter<string>();

  showSuggestions: boolean = false;
  selectedIndex: number = -1;
  filteredSuggestions: string[] = [];
  setTimeout = setTimeout;

  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
    this.selectedIndex = -1;
    this.updateSuggestions();
  }

  private updateSuggestions(): void {
    if (!this.suggestions || !this.value) {
      this.filteredSuggestions = [];
      return;
    }
    const lowerValue = this.value.toLowerCase();
    this.filteredSuggestions = this.suggestions.filter((s) => s.toLowerCase().includes(lowerValue));
  }

  emitSelectSuggestion(suggestion: string): void {
    this.value = suggestion;
    this.valueChange.emit(this.value);
    this.onSelectSuggestion?.(suggestion);
    this.selectSuggestion.emit(suggestion);
    this.showSuggestions = false;
  }
}
