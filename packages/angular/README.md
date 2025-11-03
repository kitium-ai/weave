# Weave Angular

Observable-friendly services and helper utilities that bring the Weave AI
framework to Angular. Build conversational UIs, trigger AI operations, monitor
provider routing, and surface cache insights without leaving RxJS territory.

## Highlights

- **Stateful AI services** – `AIService`, `GenerateService`, `ClassifyService`,
  and `ExtractService` wrap the shared `AIExecutionController` and expose an
  observable `state$` with cost tracking and budget controls.
- **Chat orchestration** – `ChatService` manages multi-turn conversations,
  streaming responses, and optional persistence.
- **Cache visibility** – `CacheService` emits cache feedback, savings metrics,
  and aggregate statistics.
- **Provider routing dashboards** – `ProviderRoutingService` mirrors
  `UIAwareProviderRouter` events and status to the Angular change detection
  cycle.

## Installation

```bash
npm install @weaveai/core @weaveai/angular
# or
yarn add @weaveai/core @weaveai/angular
```

Provide your `Weave` instance through Angular dependency injection:

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { Weave } from '@weaveai/core';
import { InjectionToken } from '@angular/core';

export const WEAVE = new InjectionToken<Weave>('WEAVE');

export function provideWeave() {
  return {
    provide: WEAVE,
    useFactory: async () =>
      Weave.createAsync({
        provider: { type: 'openai', apiKey: process.env['WEAVE_OPENAI_KEY']! },
      }),
  };
}

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent],
  providers: [provideWeave()],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## Triggering AI Operations

```ts
import { Component, inject } from '@angular/core';
import { GenerateService } from '@weaveai/angular';

@Component({
  selector: 'app-cta-generator',
  template: `
    <button (click)="generate()" [disabled]="state.loading">
      {{ state.loading ? 'Generating…' : 'Generate CTA' }}
    </button>

    <pre *ngIf="state.data">{{ state.data.data.text }}</pre>
    <small *ngIf="state.cost"> Cost: {{ state.cost.totalCost | number: '1.4-4' }} </small>
  `,
})
export class CallToActionComponent {
  private readonly generateService = inject(GenerateService);
  state = this.generateService.getState();

  async generate(): Promise<void> {
    await this.generateService.generate('Write a playful CTA for a collaborative whiteboard.');
    this.state = this.generateService.getState();
  }
}
```

## Chat Service

```ts
import { Component, inject } from '@angular/core';
import { ChatService } from '@weaveai/angular';

@Component({
  selector: 'app-support-chat',
  templateUrl: './support-chat.component.html',
  styleUrls: ['./support-chat.component.css'],
})
export class SupportChatComponent {
  private readonly chat = inject(ChatService);
  readonly state$ = this.chat.state$;

  constructor() {
    this.chat.configure({
      systemPrompt: 'You are a concise support assistant.',
      streaming: { enabled: true, renderer: 'markdown', framework: 'angular' },
      persistence: { key: 'support-chat', autoSave: true },
    });
  }

  send(message: string): void {
    void this.chat.sendMessage(message);
  }
}
```

## Cache & Provider Routing

```ts
import { Component, inject, OnInit } from '@angular/core';
import { CacheService, ProviderRoutingService } from '@weaveai/angular';
import type { CacheConfig, UIAwareProviderRouter } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 900,
};

@Component({
  selector: 'app-observability-panel',
  templateUrl: './observability-panel.component.html',
})
export class ObservabilityPanelComponent implements OnInit {
  private readonly cache = inject(CacheService);
  private readonly routing = inject(ProviderRoutingService);

  readonly cacheState$ = this.cache.state$;
  readonly routingState$ = this.routing.state$;

  ngOnInit(): void {
    this.cache.configure({ cacheConfig, showNotification: true });
  }

  initialiseRouter(router: UIAwareProviderRouter): void {
    this.routing.initialise(router, { autoRefresh: true, refreshInterval: 5000 });
  }
}
```

## Examples

The [`examples`](./examples) folder contains Angular-focused snippets:

- `cta-generator.component.ts` – trigger `GenerateService` and show the result.
- `support-chat.component.{ts,html}` – build a streaming chat interface backed by `ChatService`.
- `cache-dashboard.component.ts` – display cache feedback and stats.
- `provider-panel.component.ts` – monitor routing events and switch providers.

Embed the snippets inside any `@NgModule` that provides a `Weave` instance. The
shared controllers handle cost tracking, budget limits, and streaming behavior,
so the Angular code can stay lean and declarative.
