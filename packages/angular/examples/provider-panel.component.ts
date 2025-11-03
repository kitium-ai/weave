import { Component, Input, OnDestroy, inject } from '@angular/core';
import { ProviderRoutingService } from '@weaveai/angular';
import type { UIAwareProviderRouter } from '@weaveai/core';

@Component({
  selector: 'app-provider-panel-example',
  template: `
    <section>
      <h2>Routing Status</h2>
      <article *ngFor="let provider of routingState.providers">
        <h3>{{ provider.name }}</h3>
        <p>Status: {{ provider.healthy ? 'Healthy' : 'Offline' }}</p>
        <p>Latency: {{ provider.latency | number: '1.0-0' }} ms</p>
        <p>Success: {{ provider.successRate | number: '1.1-1' }}%</p>
        <button (click)="selectProvider(provider.name)" [disabled]="!provider.healthy">
          Route here
        </button>
      </article>

      <h3>Recent events</h3>
      <ul>
        <li *ngFor="let event of routingState.events">
          <strong>{{ event.type }}</strong
          >:
          <span *ngIf="event.from"> {{ event.from }} → {{ event.to }} </span>
          <span *ngIf="!event.from">{{ event.to }}</span>
          <small>{{ event.timestamp.toLocaleTimeString() }}</small>
        </li>
      </ul>
    </section>
  `,
})
export class ProviderPanelComponent implements OnDestroy {
  private readonly routing = inject(ProviderRoutingService);
  routingState = this.routing.getState();

  @Input()
  set router(router: UIAwareProviderRouter | null) {
    if (router) {
      this.routing.initialise(router, { autoRefresh: true, refreshInterval: 5000 });
      this.routingState = this.routing.getState();
    }
  }

  selectProvider(provider: string): void {
    this.routing.selectProvider(provider);
    this.routingState = this.routing.getState();
  }

  ngOnDestroy(): void {
    this.routing.dispose();
  }
}
