import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * StreamingText Component
 * Real-time text streaming with typewriter animation
 */
@Component({
  selector: 'weave-streaming-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weave-streaming-text" [class]="'weave-streaming-text--' + speed">
      <span>{{ displayedText }}</span>
      <span *ngIf="!isComplete" class="weave-streaming-text__cursor"></span>
    </div>
  `,
  styles: [
    `
      .weave-streaming-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        line-height: 1.6;
        color: #000;
      }

      @media (prefers-color-scheme: dark) {
        .weave-streaming-text {
          color: #fff;
        }
      }

      .weave-streaming-text__cursor {
        display: inline-block;
        width: 2px;
        height: 1em;
        background-color: currentColor;
        margin-left: 2px;
        animation: cursor-blink 1s infinite;
      }

      @keyframes cursor-blink {
        0%,
        49% {
          opacity: 1;
        }
        50%,
        100% {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .weave-streaming-text__cursor {
          animation: none;
          opacity: 1;
        }
      }

      .weave-streaming-text--slow {
        word-spacing: 0.1em;
      }

      .weave-streaming-text--fast {
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class StreamingTextComponent implements OnInit, OnDestroy {
  @Input() text: string = '';
  @Input() speed: 'slow' | 'normal' | 'fast' = 'normal';
  @Input() typewriter: boolean = true;
  @Input() charsPerSecond: number = 20;
  @Output() complete = new EventEmitter<void>();

  displayedText: string = '';
  isComplete: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startStreaming();
  }

  ngOnDestroy(): void {
    const interval = this.intervalId;
    if (interval !== null) {
      clearInterval(interval);
    }
  }

  private startStreaming(): void {
    this.displayedText = '';
    this.isComplete = false;

    if (!this.typewriter) {
      this.displayedText = this.text;
      this.isComplete = true;
      this.complete.emit();
      return;
    }

    const speedMultiplier = this.speed === 'slow' ? 0.5 : this.speed === 'fast' ? 2 : 1;
    const charDelayMs = 1000 / this.charsPerSecond / speedMultiplier;
    let charIndex = 0;

    this.intervalId = setInterval(() => {
      if (charIndex < this.text.length) {
        this.displayedText += this.text[charIndex];
        charIndex++;
      } else {
        const interval = this.intervalId;
        if (interval !== null) {
          clearInterval(interval);
        }
        this.isComplete = true;
        this.complete.emit();
      }
    }, charDelayMs);
  }
}
