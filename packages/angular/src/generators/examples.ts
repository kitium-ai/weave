/**
 * Angular Generators Examples
 * Demonstrates how to use Angular component and service generators
 */

import { logError, logInfo } from '@weaveai/shared';
import { AngularComponentBuilder } from './component-generator';
import { AngularServiceBuilder } from './service-generator';
import type { AngularComponentSpec, AngularServiceSpec } from './types';

/**
 * Example 1: Generate an Angular component with inputs and outputs
 */
export function exampleComponentGeneration(): void {
  const componentSpec: AngularComponentSpec = {
    name: 'product-card',
    description: 'Displays a product card with title, price, and add to cart button',
    framework: 'angular',
    language: 'typescript',
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
      {
        name: 'discount',
        type: 'number',
        description: 'Discount percentage',
        optional: true,
      },
    ],
    outputs: [
      {
        name: 'addToCart',
        type: 'EventEmitter<number>',
        description: 'Emitted when add to cart button is clicked',
      },
      {
        name: 'viewDetails',
        type: 'EventEmitter<number>',
        description: 'Emitted when product details should be viewed',
      },
    ],
    features: ['responsive design', 'pricing display', 'discount handling', 'event handling'],
  };

  const builder = new AngularComponentBuilder();
  const output = builder.build(
    componentSpec,
    'A reusable product card component for e-commerce applications'
  );

  logInfo('Generated Component Code:');
  logInfo(output.code);
  logInfo('\nGenerated Tests:');
  logInfo(output.tests || '');
  logInfo('\nGenerated Examples:');
  logInfo(output.examples || '');
}

/**
 * Example 2: Generate an Angular service with HTTP methods
 */
export function exampleServiceGeneration(): void {
  const serviceSpec: AngularServiceSpec = {
    name: 'user-service',
    description: 'Service for managing user data and authentication',
    framework: 'angular',
    language: 'typescript',
    methods: [
      {
        name: 'getUsers',
        description: 'Fetch all users from the server',
        httpMethod: 'GET',
        endpoint: '/api/users',
        params: [
          { name: 'page', type: 'number' },
          { name: 'limit', type: 'number' },
        ],
        returnType: 'Observable<User[]>',
      },
      {
        name: 'getUserById',
        description: 'Fetch a specific user by ID',
        httpMethod: 'GET',
        endpoint: '/api/users/:id',
        params: [{ name: 'id', type: 'number' }],
        returnType: 'Observable<User>',
      },
      {
        name: 'createUser',
        description: 'Create a new user',
        httpMethod: 'POST',
        endpoint: '/api/users',
        params: [{ name: 'user', type: 'User' }],
        returnType: 'Observable<User>',
      },
      {
        name: 'updateUser',
        description: 'Update an existing user',
        httpMethod: 'PUT',
        endpoint: '/api/users/:id',
        params: [
          { name: 'id', type: 'number' },
          { name: 'user', type: 'Partial<User>' },
        ],
        returnType: 'Observable<User>',
      },
      {
        name: 'deleteUser',
        description: 'Delete a user by ID',
        httpMethod: 'DELETE',
        endpoint: '/api/users/:id',
        params: [{ name: 'id', type: 'number' }],
        returnType: 'Observable<void>',
      },
    ],
    features: ['error handling', 'caching', 'request logging', 'response transformation'],
  };

  const builder = new AngularServiceBuilder();
  const output = builder.build(
    serviceSpec,
    'Service for handling user-related API calls with proper error handling'
  );

  logInfo('Generated Service Code:');
  logInfo(output.code);
  logInfo('\nGenerated Tests:');
  logInfo(output.tests || '');
  logInfo('\nGenerated Examples:');
  logInfo(output.examples || '');
}

/**
 * Example 3: Usage in a module
 */
export const usageInModule = `
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { UserService } from './services/user.service';

@NgModule({
  declarations: [ProductCardComponent],
  imports: [HttpClientModule],
  providers: [UserService],
  exports: [ProductCardComponent],
})
export class SharedModule {}
`;

/**
 * Example 4: Using the component
 */
export const componentUsage = `
import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import type { User } from './models/user.model';

@Component({
  selector: 'app-products',
  template: \`
    <div class="products-container">
      <app-product-card
        *ngFor="let product of products"
        [productId]="product.id"
        [productName]="product.name"
        [price]="product.price"
        [discount]="product.discount"
        (addToCart)="onAddToCart($event)"
        (viewDetails)="onViewDetails($event)"
      ></app-product-card>
    </div>
  \`,
})
export class ProductsComponent {
  products: any[] = [];

  constructor(private userService: UserService) {
    this.loadProducts();
  }

  loadProducts(): void {
    this.userService.getUsers(1, 10).subscribe({
      next: (users) => {
        logInfo('Loaded users:', users);
      },
      error: (error) => {
        logError('Error loading products:', error);
      },
    });
  }

  onAddToCart(productId: number): void {
    logInfo('Product added to cart:', productId);
  }

  onViewDetails(productId: number): void {
    logInfo('View details for product:', productId);
  }
}
`;

/**
 * Example 5: Integrated usage
 */
export async function runIntegratedExample(): Promise<void> {
  logInfo('=== Angular Generators Examples ===\n');

  logInfo('1. Generating Component...');
  exampleComponentGeneration();

  logInfo('\n2. Generating Service...');
  exampleServiceGeneration();

  logInfo('\n3. Module Usage:');
  logInfo(usageInModule);

  logInfo('\n4. Component Usage:');
  logInfo(componentUsage);
}

// Run examples if this file is executed directly
if (require.main === module) {
  runIntegratedExample().catch(logError);
}
