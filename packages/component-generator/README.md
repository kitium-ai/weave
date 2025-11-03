# @weaveai/component-generator

AI-assisted component scaffolding powered by Weave providers.

```ts
import { ComponentGenerator } from '@weaveai/component-generator';

const generator = new ComponentGenerator({
  provider: weave.getModel(),
  framework: 'react',
  styledWith: 'tailwind',
});

const result = await generator.createComponent({
  description: 'A dashboard card showing metrics with sparkline',
  props: {
    title: 'string',
    value: 'number',
    change: 'number',
    trend: "'up' | 'down'",
  },
  requirements: ['accessible', 'responsive', 'dark-mode-aware'],
});

console.log(result.code);
```

## Features

- Framework-aware prompts (React, Vue, Angular, React Native, Svelte, Vanilla)
- Styling preferences with Tailwind or CSS-in-JS hints
- Structured JSON responses with code, types, styles, example usage, and dependency imports
- Defensive parsing with helpful error metadata

## API

### `new ComponentGenerator(options)`

| Option       | Type                                                                           | Description                                        |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `provider`   | `ILanguageModel`                                                               | Weave language model provider used for generation. |
| `framework`  | `'react' \| 'vue' \| 'angular' \| 'react-native' \| 'svelte' \| 'vanilla'`     | Target UI framework.                               |
| `styledWith` | `'tailwind' \| 'css-modules' \| 'styled-components' \| 'emotion' \| 'vanilla'` | Styling guidance for the model (optional).         |
| `language`   | `'typescript' \| 'javascript'`                                                 | Output language preference (default `typescript`). |

### `createComponent(spec, options?)`

Generates a component based on the specification.

`spec` fields:

- `description` _(string, required)_ – Plain-language component description.
- `props` _(Record<string, string \| ComponentPropSpec>)_ – Prop names and type annotations.
- `requirements` _(string[])_ – Additional requirements or constraints.
- `events` _(string[])_ – Event handlers that should be exposed (optional).
- `dataSources` _(string[])_ – External data dependencies to note (optional).

Returns a structured result with `code`, `types`, `styles`, `example`, `imports`, and optional `metadata`.
