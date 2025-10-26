/**
 * Base specification parser with common logic
 */

/**
 * Abstract base class for all specification parsers
 * Provides common NLP-based pattern matching across frameworks
 */
export abstract class BaseSpecParser {
  /**
   * Feature keywords for UI components
   */
  protected static readonly UI_KEYWORDS = {
    modal: 'modal',
    dialog: 'dialog',
    dropdown: 'dropdown',
    menu: 'menu',
    tabs: 'tabs',
    accordion: 'accordion',
    carousel: 'carousel',
    pagination: 'pagination',
    table: 'table',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    checkbox: 'checkbox',
    radio: 'radio',
    toggle: 'toggle',
    button: 'button',
    badge: 'badge',
    chip: 'chip',
    tag: 'tag',
    breadcrumb: 'breadcrumb',
    stepper: 'stepper',
  };

  /**
   * Feature keywords for functionality
   */
  protected static readonly FUNCTIONALITY_KEYWORDS = {
    validation: 'validation',
    error: 'error handling',
    loading: 'loading states',
    cache: 'caching',
    persist: 'persistence',
    offline: 'offline support',
    streaming: 'streaming',
    'real-time': 'real-time updates',
    pagination: 'pagination',
    search: 'search',
    filter: 'filtering',
    sort: 'sorting',
  };

  /**
   * Feature keywords for styling/UX
   */
  protected static readonly UX_KEYWORDS = {
    responsive: 'responsive design',
    'dark mode': 'dark mode',
    animation: 'animations',
    transition: 'transitions',
    accessible: 'accessibility',
    a11y: 'accessibility',
    wcag: 'wcag compliance',
    interactive: 'interactive',
  };

  /**
   * Extract features from the description using keywords
   */
  protected extractFeatures(description: string): string[] {
    const lowerDesc = description.toLowerCase();
    const features = new Set<string>();

    // Check UI keywords
    for (const [keyword, feature] of Object.entries(BaseSpecParser.UI_KEYWORDS)) {
      if (lowerDesc.includes(keyword)) {
        features.add(feature);
      }
    }

    // Check functionality keywords
    for (const [keyword, feature] of Object.entries(BaseSpecParser.FUNCTIONALITY_KEYWORDS)) {
      if (lowerDesc.includes(keyword)) {
        features.add(feature);
      }
    }

    // Check UX keywords
    for (const [keyword, feature] of Object.entries(BaseSpecParser.UX_KEYWORDS)) {
      if (lowerDesc.includes(keyword)) {
        features.add(feature);
      }
    }

    return Array.from(features);
  }

  /**
   * Assess complexity level
   */
  protected assessComplexity(
    description: string,
    features: string[]
  ): 'simple' | 'medium' | 'complex' {
    let score = 0;

    // Feature count
    score += features.length * 2;

    // Complexity keywords
    const complexKeywords = [
      'advanced',
      'real-time',
      'streaming',
      'async',
      'batch',
      'pipeline',
      'distributed',
      'multi-step',
      'nested',
      'recursive',
    ];

    const lowerDesc = description.toLowerCase();
    for (const keyword of complexKeywords) {
      if (lowerDesc.includes(keyword)) {
        score += 3;
      }
    }

    // Description length
    score += Math.floor(description.length / 100);

    if (score >= 10) {
      return 'complex';
    }
    if (score >= 5) {
      return 'medium';
    }
    return 'simple';
  }

  /**
   * Detect HTTP method from description
   */
  protected detectHttpMethod(description: string): 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('delete') || lowerDesc.includes('remove')) {
      return 'DELETE';
    }
    if (lowerDesc.includes('update') || lowerDesc.includes('put')) {
      return 'PUT';
    }
    if (lowerDesc.includes('patch')) {
      return 'PATCH';
    }
    if (lowerDesc.includes('create') || lowerDesc.includes('post') || lowerDesc.includes('add')) {
      return 'POST';
    }
    return 'GET';
  }

  /**
   * Extract endpoint from description
   */
  protected extractEndpoint(description: string): string {
    const match = description.match(
      /(?:from|to|at)\s+(?:GET|POST|PUT|DELETE|PATCH)?\s*\/?([/\w\-:]+)/i
    );
    if (match) {
      return match[1] || '/api/resource';
    }

    // Try to find /api/... pattern
    const apiMatch = description.match(/(\/[\w/-:]+)/);
    return apiMatch ? apiMatch[1] : '/api/resource';
  }

  /**
   * Extract parameters from description
   */
  protected extractParameters(
    description: string
  ): Array<{ name: string; type: string; optional: boolean }> {
    const params: Array<{ name: string; type: string; optional: boolean }> = [];
    const lowerDesc = description.toLowerCase();

    // Common parameters
    const paramPatterns: Record<string, [string, string, boolean]> = {
      'id|identifier': ['id', 'string | number', false],
      'email|mail': ['email', 'string', false],
      'name|title': ['name', 'string', false],
      'password|pwd': ['password', 'string', false],
      'phone|mobile': ['phone', 'string', true],
      address: ['address', 'string', true],
      'date|created|updated': ['date', 'Date | string', true],
      'status|state': ['status', 'string', true],
      'active|enabled': ['active', 'boolean', true],
      'count|amount|total': ['count', 'number', true],
      'description|detail': ['description', 'string', true],
    };

    for (const [keyword, [name, type, optional]] of Object.entries(paramPatterns)) {
      if (new RegExp(keyword, 'i').test(lowerDesc)) {
        if (!params.some((p) => p.name === name)) {
          params.push({ name, type, optional });
        }
      }
    }

    return params;
  }

  /**
   * Normalize name to a specific case
   */
  protected normalizeName(
    name: string,
    caseType: 'pascal' | 'camel' | 'kebab' | 'snake' = 'pascal'
  ): string {
    const pascalCase = name
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    switch (caseType) {
      case 'camel':
        return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
      case 'kebab':
        return pascalCase.replace(/([A-Z])/g, '-$1').toLowerCase();
      case 'snake':
        return pascalCase.replace(/([A-Z])/g, '_$1').toUpperCase();
      default:
        return pascalCase;
    }
  }

  /**
   * Detect styling preference
   */
  protected detectStyling(
    description: string
  ): 'tailwind' | 'styled-components' | 'css-modules' | 'inline' | 'material' {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('tailwind')) {
      return 'tailwind';
    }
    if (lowerDesc.includes('styled')) {
      return 'styled-components';
    }
    if (lowerDesc.includes('css module')) {
      return 'css-modules';
    }
    if (lowerDesc.includes('inline')) {
      return 'inline';
    }
    if (lowerDesc.includes('material') || lowerDesc.includes('@material')) {
      return 'material';
    }

    return 'tailwind'; // default
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract parse(description: string, name: string): unknown;
}
