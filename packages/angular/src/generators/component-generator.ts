/**
 * Angular Component Generator
 * Generates Angular components with RxJS integration
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { AngularComponentSpec } from './types.js';

/**
 * Angular component builder
 */
export class AngularComponentBuilder extends BaseCodeBuilder<AngularComponentSpec> {
  constructor() {
    super();
  }

  build(spec: AngularComponentSpec, description: string): GeneratorOutput<AngularComponentSpec> {
    const componentCode = this.generateComponentCode(spec);
    const testFile = this.generateTestFile(spec);
    const exampleUsage = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-angular-component-generator');

    return {
      code: componentCode,
      tests: testFile,
      examples: exampleUsage,
      metadata,
      spec,
    };
  }

  /**
   * Generate Angular component code
   */
  private generateComponentCode(spec: AngularComponentSpec): string {
    const propsInterface = this.generatePropsInterface(spec);
    const imports = this.generateImports(spec);
    const selector = this.toKebabCase(spec.name);

    return `${imports}

${propsInterface}

@Component({
  selector: 'app-${selector}',
  templateUrl: './${selector}.component.html',
  styleUrls: ['./${selector}.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${this.toPascalCase(spec.name)}Component {
  @Input() props!: ${this.toPascalCase(spec.name)}Props;
  @Output() action = new EventEmitter<any>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize component
  }

  onAction(event: any): void {
    this.action.emit(event);
  }
}`;
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(spec: AngularComponentSpec): string {
    const componentName = this.toPascalCase(spec.name);
    const propsType = `${componentName}Props`;

    const props = spec.inputs
      .map((input) => `  /** ${input.description} */\n  ${input.name}${input.optional ? '?' : ''}: ${input.type};`)
      .join('\n');

    return `export interface ${propsType} {
${props}
}`;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: AngularComponentSpec): string {
    const imports = [
      "import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';",
    ];

    if (spec.features.includes('observable')) {
      imports.push("import { Observable, BehaviorSubject } from 'rxjs';");
    }

    if (spec.features.includes('form')) {
      imports.push("import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';");
    }

    if (spec.features.includes('http')) {
      imports.push("import { HttpClient } from '@angular/common/http';");
    }

    return imports.join('\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: AngularComponentSpec): string {
    const componentName = this.toPascalCase(spec.name);
    const selector = this.toKebabCase(spec.name);

    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${componentName}Component } from './${selector}.component';

describe('${componentName}Component', () => {
  let component: ${componentName}Component;
  let fixture: ComponentFixture<${componentName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [${componentName}Component],
    }).compileComponents();

    fixture = TestBed.createComponent(${componentName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit action on button click', () => {
    spyOn(component.action, 'emit');
    component.onAction({});
    expect(component.action.emit).toHaveBeenCalled();
  });
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: AngularComponentSpec): string {
    const componentName = this.toPascalCase(spec.name);
    const selector = this.toKebabCase(spec.name);
    const propsExamples = spec.inputs
      .slice(0, 2)
      .map((input) => `  [${input.name}]="${this.getExampleValue(input.type)}"`)
      .join('\n');

    return `<!-- Usage of ${componentName}Component -->

<app-${selector}
${propsExamples}
  (action)="onAction($event)"
></app-${selector}>`;
  }
}
