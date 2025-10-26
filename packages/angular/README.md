# Angular Code Generators

Generate production-ready Angular components and services from specifications using natural language processing and AI-powered code generation.

## Overview

The Angular Code Generators provide a powerful way to automatically generate:

- **Angular Components** - With `@Component` decorators, `@Input`/`@Output` bindings, and proper change detection
- **Angular Services** - With `@Injectable` decorators, HttpClient integration, and RxJS observables
- **Type definitions** - Full TypeScript interfaces and types
- **Unit Tests** - Comprehensive test files using `TestBed` and `TestBedModule`
- **Documentation** - Examples and usage patterns

## Features

- 🎯 **Framework-Specific Code** - Proper Angular patterns and best practices
- 📝 **NLP-Powered Parsing** - Extract features and structure from natural language descriptions
- 🧪 **Built-in Tests** - Auto-generated unit tests with TestBed
- 📚 **Complete Examples** - Learn by example with generated documentation
- ♻️ **Reusable Output** - Production-ready code with minimal modifications

## Installation

```bash
npm install @weaveai/angular
# or
yarn add @weaveai/angular
```

## Usage

### Generate a Component

```typescript
import { AngularComponentBuilder } from '@weaveai/angular';
import type { AngularComponentSpec } from '@weaveai/angular';

const componentSpec: AngularComponentSpec = {
  name: 'product-card',
  description: 'Displays a product card with title, price, and add to cart button',
  framework: 'angular',
  inputs: [
    {
      name: 'productId',
      type: 'number',
      description: 'Unique product identifier',
      optional: false,
    },
    {
      name: 'productName',
      type: 'string',
      description: 'Name of the product',
      optional: false,
    },
    {
      name: 'price',
      type: 'number',
      description: 'Product price',
      optional: false,
    },
  ],
  outputs: [
    {
      name: 'addToCart',
      type: 'EventEmitter<number>',
      description: 'Emitted when add to cart button is clicked',
    },
  ],
  features: ['responsive design', 'pricing display', 'event handling'],
};

const builder = new AngularComponentBuilder();
const output = builder.build(componentSpec, 'A reusable product card component');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
console.log('Generated Examples:', output.examples);
```

### Generate a Service

```typescript
import { AngularServiceBuilder } from '@weaveai/angular';
import type { AngularServiceSpec } from '@weaveai/angular';

const serviceSpec: AngularServiceSpec = {
  name: 'user-service',
  description: 'Service for managing user data',
  framework: 'angular',
  methods: [
    {
      name: 'getUsers',
      description: 'Fetch all users',
      httpMethod: 'GET',
      endpoint: '/api/users',
      params: [
        { name: 'page', type: 'number' },
        { name: 'limit', type: 'number' },
      ],
      returnType: 'Observable<User[]>',
    },
    {
      name: 'createUser',
      description: 'Create a new user',
      httpMethod: 'POST',
      endpoint: '/api/users',
      params: [{ name: 'user', type: 'User' }],
      returnType: 'Observable<User>',
    },
  ],
  features: ['error handling', 'caching', 'request logging'],
};

const builder = new AngularServiceBuilder();
const output = builder.build(serviceSpec, 'Service for user management');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
```

## Component Specification (AngularComponentSpec)

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Component name (e.g., 'product-card') |
| `description` | string | Component description |
| `framework` | 'angular' | Framework identifier |
| `inputs` | Array | Input properties with types and descriptions |
| `outputs` | Array | Output EventEmitters |
| `features` | string[] | Features like 'responsive design', 'animations', etc. |

### Input/Output Structure

```typescript
interface Input {
  name: string;           // Property name
  type: string;          // TypeScript type (e.g., 'string', 'number', 'User[]')
  description: string;   // Property documentation
  optional: boolean;     // Whether property is optional
}

interface Output {
  name: string;           // EventEmitter name
  type: string;          // Event type (e.g., 'EventEmitter<number>')
  description: string;   // Event documentation
}
```

## Service Specification (AngularServiceSpec)

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Service name (e.g., 'user-service') |
| `description` | string | Service description |
| `framework` | 'angular' | Framework identifier |
| `methods` | Array | HTTP methods with endpoints and types |
| `features` | string[] | Features like 'caching', 'error handling', etc. |

### Method Structure

```typescript
interface Method {
  name: string;                    // Method name
  description: string;             // Method documentation
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;               // API endpoint (e.g., '/api/users/:id')
  params: Array<{
    name: string;                 // Parameter name
    type: string;                 // TypeScript type
  }>;
  returnType: string;             // Return type (e.g., 'Observable<User>')
}
```

## Generated Output (GeneratorOutput)

```typescript
interface GeneratorOutput<T extends BaseSpec> {
  code: string;          // Generated component/service code
  tests: string;         // Generated unit tests
  examples: string;      // Usage examples and documentation
  metadata: CodeMetadata; // Generation metadata
  spec: T;              // Original specification
}
```

## Examples

For more complete examples, see [examples.ts](src/generators/examples.ts)

### Simple Component

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  @Input() productId!: number;
  @Input() productName!: string;
  @Input() price!: number;

  @Output() addToCart = new EventEmitter<number>();

  onAddToCart(): void {
    this.addToCart.emit(this.productId);
  }
}
```

### Simple Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(page: number, limit: number): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}?page=${page}&limit=${limit}`)
      .pipe(
        tap((data) => console.log('Users loaded:', data)),
        catchError((error) => {
          console.error('Error loading users:', error);
          throw error;
        })
      );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
}
```

## Supported Features

Components and services can include these features:

- **UI/UX**: responsive design, dark mode, animations, accessibility, tooltips
- **Functionality**: forms, validation, filtering, sorting, pagination
- **Data**: caching, error handling, loading states, request logging
- **Integration**: event handling, dependency injection, observable streams

## Best Practices

1. **Descriptive Names** - Use clear, self-documenting names for components and services
2. **Type Safety** - Always specify types for inputs, outputs, and method parameters
3. **Feature Keywords** - Include relevant feature keywords in descriptions for better code generation
4. **Documentation** - Add meaningful descriptions for all properties and methods
5. **Testing** - Use generated tests as a base and add custom test cases

## Advanced Usage

### Custom Builders

Extend `BaseCodeBuilder` to create custom generators:

```typescript
import { BaseCodeBuilder } from '@weaveai/shared';

class CustomBuilder extends BaseCodeBuilder<CustomSpec> {
  build(spec: CustomSpec, description: string): GeneratorOutput<CustomSpec> {
    // Custom implementation
    return {
      code: '',
      tests: '',
      examples: '',
      metadata: this.createMetadata(spec, description, 'custom-generator'),
      spec,
    };
  }
}
```

### Integration with Module

```typescript
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ProductCardComponent } from './product-card/product-card.component';
import { UserService } from './user.service';

@NgModule({
  declarations: [ProductCardComponent],
  imports: [HttpClientModule],
  providers: [UserService],
  exports: [ProductCardComponent],
})
export class SharedModule {}
```

## Architecture

- **BaseCodeBuilder** - Abstract base class with shared utilities (from `@weaveai/shared`)
- **BaseSpecParser** - NLP parsing for feature extraction (from `@weaveai/shared`)
- **AngularComponentBuilder** - Component-specific code generation
- **AngularServiceBuilder** - Service-specific code generation
- **CodeFormatter** - Consistent code formatting (from `@weaveai/shared`)

## Contributing

Contributions are welcome! Please ensure:

1. Code follows Angular style guide
2. Tests pass and coverage remains high
3. Documentation is updated
4. TypeScript strict mode compliance

## Related Packages

- [@weaveai/shared](../../shared) - Shared utilities and base classes
- [@weaveai/react](../../react) - React generators
- [@weaveai/nextjs](../../nextjs) - Next.js generators
- [@weaveai/nodejs](../../nodejs) - Node.js generators
- [@weaveai/react-native](../../react-native) - React Native generators

## License

MIT
