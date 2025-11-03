import { Component, inject } from '@angular/core';
import { GenerateService } from '@weaveai/angular';

@Component({
  selector: 'app-cta-generator-example',
  template: `
    <section>
      <h2>CTA Generator</h2>
      <button (click)="generate()" [disabled]="state.loading">
        {{ state.loading ? 'Generating…' : 'Generate CTA' }}
      </button>

      <pre *ngIf="state.data">{{ state.data.data.text }}</pre>
      <small *ngIf="state.cost"> Cost so far: {{ state.cost.totalCost | number: '1.4-4' }} </small>
    </section>
  `,
})
export class CtaGeneratorComponent {
  private readonly service = inject(GenerateService);
  state = this.service.getState();

  async generate(): Promise<void> {
    await this.service.generate('Draft a CTA for collaborating on a shared canvas.');
    this.state = this.service.getState();
  }
}
