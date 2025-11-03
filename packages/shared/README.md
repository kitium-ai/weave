# Weave Shared

Framework-agnostic controllers, utilities, and generators that the Weave
ecosystem builds upon. Import these modules when you need access to the raw
execution logic independent of a specific UI binding.

## Key Modules

- **AI controllers** – `AIExecutionController`, `ChatController`,
  `CacheController`, and `ProviderRoutingController` provide consistent logic
  for budgeting, cost tracking, streaming, caching, and routing events across
  all frameworks.
- **Code generators** – Re-exported builder utilities that power the component,
  hook, and service generators inside the framework packages.
- **Error helpers & validation** – Consistent error hierarchies, schema
  validation helpers, and logging utilities.

## Installation

```bash
npm install @weaveai/shared
# or
yarn add @weaveai/shared
```

Most projects depend on `@weaveai/shared` indirectly through framework
bindings (`@weaveai/react`, `@weaveai/vue`, etc.), but you can import the
controllers directly for headless or custom integrations.

## Example Usage

```ts
import { AIExecutionController } from '@weaveai/shared';
import type { GenerateResult } from '@weaveai/core';
import { weave } from './client';

const controller = new AIExecutionController<GenerateResult>({
  trackCosts: true,
  budget: { perSession: 0.25, onBudgetExceeded: 'warn' },
});

controller.subscribe((state) => {
  console.log('status', state.status, 'cost', state.cost?.totalCost);
});

const result = await controller.execute(() =>
  weave.generate('Write a team update summarising today’s wins.')
);
```

```ts
import { ChatController } from '@weaveai/shared';
import type { Weave } from '@weaveai/core';

export function createChat(weave: Weave) {
  return new ChatController((prompt, options) => weave.generate(prompt, options), {
    systemPrompt: 'You are a concise assistant.',
    streaming: { enabled: true, framework: 'generic' },
    persistence: { key: 'chat-history', autoSave: true },
    maxMessages: 50,
    onOverflow: 'summarize',
  });
}
```

## Tests & Examples

- The [`tests/ui`](./tests/ui) directory contains Vitest suites for the shared
  controllers (see `ai-controller.test.ts` for sample assertions).
- Framework packages ship additional examples that build on these controllers.

## Contributing

1. Run `yarn test shared` before submitting changes.
2. Add or update unit tests when modifying controller behaviour.
3. Keep documentation in sync with the framework bindings.

The shared layer is the contract that keeps Weave behaviour consistent across
React, Vue, Angular, Svelte, React Native, and beyond.\*\*\* End Patch
