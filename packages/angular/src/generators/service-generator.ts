/**
 * Angular Service Generator
 * Generates Angular services with RxJS integration
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { AngularServiceSpec } from './types.js';

/**
 * Angular service builder
 */
export class AngularServiceBuilder extends BaseCodeBuilder<AngularServiceSpec> {
  constructor() {
    super();
  }

  build(spec: AngularServiceSpec, description: string): GeneratorOutput<AngularServiceSpec> {
    const serviceCode = this.generateServiceCode(spec);
    const testFile = this.generateTestFile(spec);
    const exampleUsage = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-angular-service-generator');

    return {
      code: serviceCode,
      tests: testFile,
      examples: exampleUsage,
      metadata,
      spec,
    };
  }

  /**
   * Generate Angular service code
   */
  private generateServiceCode(spec: AngularServiceSpec): string {
    const serviceName = this.toPascalCase(spec.name);
    const methods = this.generateMethods(spec);

    return `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ${serviceName}Service {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

${methods}
}`;
  }

  /**
   * Generate service methods
   */
  private generateMethods(spec: AngularServiceSpec): string {
    const methods: string[] = [];

    for (const method of spec.methods) {
      const params = method.params.map((p) => `${p.name}: ${p.type}`).join(', ');
      const returnType = method.returnType;

      methods.push(`  /**
   * ${method.description}
   */
  ${method.name}(${params}): ${returnType} {
    return this.http.${method.httpMethod.toLowerCase()}(
      \`\${this.apiUrl}${method.endpoint}\`
    ).pipe(
      tap(response => console.log('Response:', response)),
      catchError(error => {
        console.error('Error:', error);
        return of(null);
      })
    );
  }`);
    }

    return methods.join('\n\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: AngularServiceSpec): string {
    const serviceName = this.toPascalCase(spec.name);

    return `import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ${serviceName}Service } from './${this.toKebabCase(spec.name)}.service';

describe('${serviceName}Service', () => {
  let service: ${serviceName}Service;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [${serviceName}Service],
    });

    service = TestBed.inject(${serviceName}Service);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: AngularServiceSpec): string {
    const serviceName = this.toPascalCase(spec.name);
    const firstMethod = spec.methods[0];

    return `import { Component, OnInit, OnDestroy } from '@angular/core';
import { ${serviceName}Service } from './services/${this.toKebabCase(spec.name)}.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-example',
  template: \`<div>Example Component</div>\`,
})
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private service: ${serviceName}Service) {}

  ngOnInit(): void {
    this.service
      .${firstMethod.name}()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => console.log(data),
        (error) => console.error(error)
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`;
  }
}
