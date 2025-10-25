import { Component, Input, computed } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'weave-sentiment-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'weave-sentiment-badge weave-sentiment-badge--' + sentiment + ' weave-sentiment-badge--' + size">
      <span class="weave-sentiment-badge__emoji">{{ sentimentEmoji }}</span>
      <div *ngIf="showLabel || showPercentage" class="weave-sentiment-badge__text">
        <span *ngIf="showLabel" class="weave-sentiment-badge__label">{{ sentimentLabel }}</span>
        <span *ngIf="showPercentage && score !== undefined" class="weave-sentiment-badge__score">
          {{ (score * 100).toFixed(0) }}%
        </span>
      </div>
    </div>
  `,
  styles: [`
    .weave-sentiment-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 20px; font-weight: 500; font-size: 14px; }
    .weave-sentiment-badge--small { padding: 4px 8px; font-size: 12px; }
    .weave-sentiment-badge--large { padding: 12px 16px; font-size: 16px; }
    .weave-sentiment-badge--positive { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .weave-sentiment-badge--negative { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .weave-sentiment-badge--neutral { background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
    @media (prefers-color-scheme: dark) {
      .weave-sentiment-badge--positive { background-color: #1e4620; color: #6dd58a; border-color: #3a6d3f; }
      .weave-sentiment-badge--negative { background-color: #561d1d; color: #f8a5a5; border-color: #8b3a3a; }
      .weave-sentiment-badge--neutral { background-color: #3a3f44; color: #c5cdd1; border-color: #555a61; }
    }
    .weave-sentiment-badge__emoji { font-size: 1.2em; line-height: 1; }
    .weave-sentiment-badge__text { display: flex; flex-direction: column; gap: 2px; }
    .weave-sentiment-badge__label { font-weight: 600; }
    .weave-sentiment-badge__score { font-size: 0.85em; opacity: 0.8; }
  `]
})
export class SentimentBadgeComponent {
  @Input() sentiment: 'positive' | 'negative' | 'neutral' = 'positive'
  @Input() size: 'small' | 'medium' | 'large' = 'medium'
  @Input() showPercentage: boolean = false
  @Input() showLabel: boolean = true
  @Input() score: number = 1

  get sentimentEmoji(): string {
    switch (this.sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😞'
      case 'neutral':
        return '😐'
      default:
        return '😊'
    }
  }

  get sentimentLabel(): string {
    return this.sentiment.charAt(0).toUpperCase() + this.sentiment.slice(1)
  }
}
