import { Component, inject, OnInit } from '@angular/core';
import { CacheService } from '@weaveai/angular';
import type { CacheConfig } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 600,
};

@Component({
  selector: 'app-cache-dashboard-example',
  template: `
    <section>
      <h2>Cache Overview</h2>

      <button (click)="refresh()">Refresh stats</button>
      <button (click)="clear()">Clear cache</button>

      <div *ngIf="state.lastFeedback">
        <strong>{{ state.lastFeedback.type.toUpperCase() }}</strong
        >:
        {{ state.lastFeedback.message }}
      </div>

      <pre *ngIf="state.stats as stats">{{ stats | json }}</pre>
    </section>
  `,
})
export class CacheDashboardComponent implements OnInit {
  private readonly cache = inject(CacheService);
  state = this.cache.getState();

  ngOnInit(): void {
    this.cache.configure({ cacheConfig, showNotification: true });
  }

  async refresh(): Promise<void> {
    await this.cache.refreshStats();
    this.state = this.cache.getState();
  }

  async clear(): Promise<void> {
    await this.cache.clearCache();
    this.state = this.cache.getState();
  }
}
