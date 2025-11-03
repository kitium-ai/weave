/**
 * Next.js Page Generator
 * Generates Next.js pages with proper structure
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { NextJSPageSpec } from './types.js';

/**
 * Next.js page builder
 */
export class NextJSPageBuilder extends BaseCodeBuilder<NextJSPageSpec> {
  constructor() {
    super();
  }

  build(spec: NextJSPageSpec, description: string): GeneratorOutput<NextJSPageSpec> {
    const code = this.generatePage(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-nextjs-page-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate Next.js page
   */
  private generatePage(spec: NextJSPageSpec): string {
    const imports = this.generateImports(spec);
    const pageName = this.toPascalCase(spec.name);

    return `${imports}

export const metadata: Metadata = {
  title: '${spec.title}',
  description: '${spec.description}',
};

export default function ${pageName}() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize page
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main className="container mx-auto p-8">
      <h1>{spec.title}</h1>
      {/* Page content */}
    </main>
  );
}`;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: NextJSPageSpec): string {
    const imports = [
      "'use client';",
      '',
      "import { Metadata } from 'next';",
      "import { useState, useEffect } from 'react';",
    ];

    if (spec.features.includes('form')) {
      imports.push("import { useForm } from 'react-hook-form';");
    }

    if (spec.features.includes('query')) {
      imports.push("import { useQuery } from '@tanstack/react-query';");
    }

    if (spec.features.includes('routing')) {
      imports.push("import { useRouter } from 'next/navigation';");
    }

    return imports.join('\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: NextJSPageSpec): string {
    const pageName = this.toPascalCase(spec.name);

    return `import { render, screen } from '@testing-library/react';
import ${pageName} from './${spec.name}';

describe('${pageName} Page', () => {
  it('renders the page', () => {
    render(<${pageName} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});`;
  }

  /**
   * Generate example
   */
  private generateExampleUsage(spec: NextJSPageSpec): string {
    return `// pages/${spec.name}.tsx
// This page will be automatically available at /${this.toKebabCase(spec.name)}

// Features:
${spec.features.map((f) => `// - ${f}`).join('\n')}`;
  }
}
