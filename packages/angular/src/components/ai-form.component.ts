import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

export interface FormFieldSchema {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: unknown }[]
  minLength?: number
  maxLength?: number
  pattern?: string
}

@Component({
  selector: 'weave-ai-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="weave-form" (ngSubmit)="handleSubmit()">
      <div *ngFor="let field of schema" class="weave-form__field-group">
        <label [for]="field.name" class="weave-form__label">
          {{ field.label }}
          <span *ngIf="field.required" class="weave-form__required">*</span>
        </label>

        <input
          *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'number'"
          [id]="field.name"
          [(ngModel)]="formData[field.name]"
          [type]="field.type"
          [placeholder]="field.placeholder"
          [required]="field.required"
          [minlength]="field.minLength"
          [maxlength]="field.maxLength"
          [pattern]="field.pattern"
          class="weave-form__input"
          [name]="field.name"
        />

        <textarea
          *ngIf="field.type === 'textarea'"
          [id]="field.name"
          [(ngModel)]="formData[field.name]"
          [placeholder]="field.placeholder"
          [required]="field.required"
          class="weave-form__textarea"
          [name]="field.name"
        ></textarea>

        <select
          *ngIf="field.type === 'select'"
          [id]="field.name"
          [(ngModel)]="formData[field.name]"
          [required]="field.required"
          class="weave-form__select"
          [name]="field.name"
        >
          <option value="">Select an option...</option>
          <option *ngFor="let option of field.options" [value]="option.value">
            {{ option.label }}
          </option>
        </select>

        <label *ngIf="field.type === 'checkbox'" class="weave-form__checkbox">
          <input
            [id]="field.name"
            [(ngModel)]="formData[field.name]"
            type="checkbox"
            [required]="field.required"
            [name]="field.name"
          />
          <span>{{ field.placeholder }}</span>
        </label>

        <div *ngIf="errors && errors[field.name]" class="weave-form__error">
          {{ errors[field.name] }}
        </div>
      </div>

      <button
        *ngIf="showAIFill && onAIFill"
        type="button"
        class="weave-form__ai-button"
        (click)="handleAIFill()"
        [disabled]="isSubmitting"
      >
        ✨ Fill with AI
      </button>

      <button type="submit" class="weave-form__submit-button" [disabled]="isSubmitting">
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `,
  styles: [`
    .weave-form { display: flex; flex-direction: column; gap: 16px; max-width: 600px; }
    .weave-form__field-group { display: flex; flex-direction: column; gap: 6px; }
    .weave-form__label { font-weight: 500; color: #333; font-size: 14px; }
    @media (prefers-color-scheme: dark) { .weave-form__label { color: #e0e0e0; } }
    .weave-form__required { color: #d32f2f; }
    .weave-form__input, .weave-form__textarea, .weave-form__select { padding: 10px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit; transition: border-color 0.2s; }
    .weave-form__input:focus, .weave-form__textarea:focus, .weave-form__select:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
    .weave-form__textarea { resize: vertical; min-height: 100px; }
    .weave-form__checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
    .weave-form__checkbox input { cursor: pointer; width: 18px; height: 18px; }
    .weave-form__error { color: #d32f2f; font-size: 12px; margin-top: 4px; }
    .weave-form__ai-button { padding: 10px 16px; background-color: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background-color 0.2s; }
    .weave-form__ai-button:hover:not(:disabled) { background-color: #7b1fa2; }
    .weave-form__ai-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .weave-form__submit-button { padding: 12px 24px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 16px; transition: background-color 0.2s; }
    .weave-form__submit-button:hover:not(:disabled) { background-color: #0056b3; }
    .weave-form__submit-button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AIFormComponent implements OnInit {
  @Input() schema: FormFieldSchema[] = []
  @Input() onSubmit: (values: Record<string, unknown>) => Promise<void> = async () => {}
  @Input() onAIFill?: (field: string, value: unknown) => Promise<unknown>
  @Input() showAIFill: boolean = true
  @Input() isSubmitting: boolean = false
  @Input() errors?: Record<string, string>
  @Output() submit = new EventEmitter<Record<string, unknown>>()

  formData: Record<string, unknown> = {}

  ngOnInit(): void {
    this.schema.forEach(field => {
      this.formData[field.name] = field.type === 'checkbox' ? false : ''
    })
  }

  async handleSubmit(): Promise<void> {
    this.isSubmitting = true
    try {
      await this.onSubmit(this.formData)
      this.submit.emit(this.formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      this.isSubmitting = false
    }
  }

  async handleAIFill(): Promise<void> {
    if (!this.onAIFill) return
    this.isSubmitting = true
    try {
      for (const field of this.schema) {
        const aiValue = await this.onAIFill(field.name, this.formData[field.name])
        if (aiValue !== undefined) {
          this.formData[field.name] = aiValue
        }
      }
    } catch (error) {
      console.error('AI fill error:', error)
    } finally {
      this.isSubmitting = false
    }
  }
}
