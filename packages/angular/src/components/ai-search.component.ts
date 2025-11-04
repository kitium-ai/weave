import { logError } from '@weaveai/shared';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  score?: number;
  url?: string;
}

@Component({
  selector: 'weave-ai-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weave-search">
      <form class="weave-search__form" (ngSubmit)="handleSearch()">
        <input
          [(ngModel)]="searchQuery"
          [placeholder]="placeholder"
          class="weave-search__input"
          type="search"
          [disabled]="isLoading"
          name="query"
        />
        <button type="submit" class="weave-search__button" [disabled]="!searchQuery || isLoading">
          {{ isLoading ? 'Searching...' : 'Search' }}
        </button>
      </form>
      <div *ngIf="results && results.length" class="weave-search__results">
        <div
          *ngFor="let result of results"
          class="weave-search__result-item"
          (click)="emitSelectResult(result)"
        >
          <div class="weave-search__result-title">{{ result.title }}</div>
          <p class="weave-search__result-description">{{ result.description }}</p>
          <div *ngIf="showScore && result.score !== undefined" class="weave-search__result-score">
            Relevance: {{ (result.score * 100).toFixed(0) }}%
          </div>
        </div>
      </div>
      <div
        *ngIf="hasSearched && (!results || results.length === 0)"
        class="weave-search__no-results"
      >
        No results found for "{{ searchQuery }}"
      </div>
    </div>
  `,
  styles: [
    `
      .weave-search {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .weave-search__form {
        display: flex;
        gap: 8px;
      }
      .weave-search__input {
        flex: 1;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      .weave-search__input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      .weave-search__button {
        padding: 12px 24px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      .weave-search__button:hover:not(:disabled) {
        background-color: #0056b3;
      }
      .weave-search__button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .weave-search__results {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .weave-search__result-item {
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        transition:
          background-color 0.2s,
          border-color 0.2s;
      }
      .weave-search__result-item:hover {
        background-color: #f9f9f9;
        border-color: #007bff;
      }
      .weave-search__result-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      .weave-search__result-description {
        font-size: 13px;
        color: #666;
        margin: 0 0 8px 0;
        line-height: 1.5;
      }
      .weave-search__result-score {
        font-size: 12px;
        color: #999;
      }
      .weave-search__no-results {
        padding: 24px;
        text-align: center;
        color: #999;
      }
    `,
  ],
})
export class AISearchComponent {
  @Input() results: SearchResult[] = [];
  @Input() placeholder: string = 'Search...';
  @Input() onSearch?: (query: string) => Promise<void>;
  @Input() showScore: boolean = true;
  @Input() isLoading: boolean = false;
  @Output() search = new EventEmitter<string>();
  @Output() selectResult = new EventEmitter<SearchResult>();

  searchQuery: string = '';
  hasSearched: boolean = false;

  async handleSearch(): Promise<void> {
    if (!this.searchQuery.trim()) {
      return;
    }
    this.hasSearched = true;
    try {
      this.search.emit(this.searchQuery);
      if (this.onSearch) {
        await this.onSearch(this.searchQuery);
      }
    } catch (error) {
      logError('Search error:', error);
    }
  }

  emitSelectResult(result: SearchResult): void {
    this.selectResult.emit(result);
  }
}
