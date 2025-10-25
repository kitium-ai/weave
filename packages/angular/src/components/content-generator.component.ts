import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'weave-content-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weave-content-generator">
      <div class="weave-content-generator__controls">
        <button
          class="weave-content-generator__generate-button"
          (click)="handleGenerate()"
          [disabled]="isLoading"
        >
          <span *ngIf="!isLoading">Generate Content</span>
          <span *ngIf="isLoading">Generating...</span>
        </button>
        <select [(ngModel)]="selectedType" class="weave-content-generator__type-select" name="type">
          <option value="blog">Blog Post</option>
          <option value="social">Social Media</option>
          <option value="email">Email</option>
          <option value="product">Product Description</option>
          <option value="documentation">Documentation</option>
        </select>
      </div>
      <div *ngIf="showPreview && generatedContent" class="weave-content-generator__preview">
        <h3>Preview</h3>
        <div class="weave-content-generator__preview-content">{{ generatedContent }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .weave-content-generator {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #fff;
      }
      @media (prefers-color-scheme: dark) {
        .weave-content-generator {
          background-color: #1a1a1a;
          border-color: #333;
        }
      }
      .weave-content-generator__controls {
        display: flex;
        gap: 12px;
      }
      .weave-content-generator__generate-button {
        flex: 1;
        padding: 10px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      .weave-content-generator__generate-button:hover:not(:disabled) {
        background-color: #0056b3;
      }
      .weave-content-generator__generate-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .weave-content-generator__type-select {
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        cursor: pointer;
      }
      .weave-content-generator__preview {
        padding: 12px;
        background-color: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
      .weave-content-generator__preview h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #666;
      }
      .weave-content-generator__preview-content {
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #333;
      }
    `,
  ],
})
export class ContentGeneratorComponent {
  @Input() type: 'blog' | 'social' | 'email' | 'product' | 'documentation' = 'blog';
  @Input() onGenerate: (content: string) => Promise<void> = async () => {};
  @Input() showPreview: boolean = true;
  @Input() isLoading: boolean = false;
  @Output() generated = new EventEmitter<string>();
  @Output() isLoadingChange = new EventEmitter<boolean>();

  selectedType: 'blog' | 'social' | 'email' | 'product' | 'documentation' = this.type;
  generatedContent: string = '';

  async handleGenerate(): Promise<void> {
    this.isLoading = true;
    this.isLoadingChange.emit(true);
    try {
      const content = await this.generateContent(this.selectedType);
      this.generatedContent = content;
      this.generated.emit(content);
      await this.onGenerate(content);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      this.isLoading = false;
      this.isLoadingChange.emit(false);
    }
  }

  private async generateContent(type: string): Promise<string> {
    const templates: Record<string, string> = {
      blog: `# Blog Post\n\nThis is a blog post about [topic]...`,
      social: `Check this out! [content] #AI`,
      email: `Subject: [Subject]\n\nDear [Name],\n\n[Body]`,
      product: `[Product Name]\n\nFeatures:\n- Feature 1\n- Feature 2`,
      documentation: `# Documentation\n\n## Overview\n[Description]`,
    };
    return templates[type] || 'No template available';
  }
}
