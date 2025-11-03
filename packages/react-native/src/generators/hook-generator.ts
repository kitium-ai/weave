/**
 * React Native Hook Generator
 * Generates custom React Native hooks for data fetching, navigation, and state management
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { ReactNativeHookSpec } from './types.js';

/**
 * React Native hook builder
 */
export class ReactNativeHookBuilder extends BaseCodeBuilder<ReactNativeHookSpec> {
  constructor() {
    super();
  }

  build(spec: ReactNativeHookSpec, description: string): GeneratorOutput<ReactNativeHookSpec> {
    const code = this.generateHook(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-react-native-hook-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate React Native hook
   */
  private generateHook(spec: ReactNativeHookSpec): string {
    const hookName = `use${this.toPascalCase(spec.name)}`;
    const imports = this.generateImports(spec);

    let hookCode = `${imports}

/**
 * ${hookName}
 * Custom hook for ${spec.hookType} operations
 * @returns {${spec.returns}} Hook result
 */
export const ${hookName} = (${this.generateParams(spec)}) => {`;

    switch (spec.hookType) {
      case 'data':
        hookCode += this.generateDataHook(spec);
        break;
      case 'navigation':
        hookCode += this.generateNavigationHook(spec);
        break;
      case 'async':
        hookCode += this.generateAsyncHook(spec);
        break;
      case 'state':
        hookCode += this.generateStateHook(spec);
        break;
      case 'animation':
        hookCode += this.generateAnimationHook(spec);
        break;
    }

    hookCode += `
};
`;

    return hookCode;
  }

  /**
   * Generate data fetching hook
   */
  private generateDataHook(spec: ReactNativeHookSpec): string {
    return `
  const [data, setData] = React.useState<${spec.returns} | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Implement your data fetching logic here
        // Example: const result = await fetchFromAPI();
        const result = await Promise.resolve({} as ${spec.returns});
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = async (): Promise<void> => {
    try {
      setLoading(true);
      // Re-execute the data fetching logic
      // Example: const result = await fetchFromAPI();
      const result = await Promise.resolve({} as ${spec.returns});
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };`;
  }

  /**
   * Generate navigation hook
   */
  private generateNavigationHook(_spec: ReactNativeHookSpec): string {
    return `
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const navigate = (screen: string, params?: any): void => {
    navigation.navigate(screen, params);
  };

  const goBack = (): void => {
    navigation.goBack();
  };

  const reset = (routes: any[]): void => {
    navigation.reset({
      index: 0,
      routes: routes,
    });
  };

  return { navigate, goBack, reset, navigation };`;
  }

  /**
   * Generate async hook
   */
  private generateAsyncHook(spec: ReactNativeHookSpec): string {
    return `
  const [result, setResult] = React.useState<${spec.returns} | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (...args: any[]): Promise<${spec.returns} | null> => {
    try {
      setLoading(true);
      setError(null);
      // Implement your async operation here
      // Example: const data = await performAsyncOperation(...args);
      const data = await Promise.resolve({} as ${spec.returns});
      setResult(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, execute };`;
  }

  /**
   * Generate state management hook
   */
  private generateStateHook(spec: ReactNativeHookSpec): string {
    return `
  const [state, setState] = React.useState<${spec.returns}>(null as any);

  const update = (newState: Partial<${spec.returns}>): void => {
    setState((prevState: ${spec.returns}) => ({
      ...prevState,
      ...newState,
    }));
  };

  const reset = (): void => {
    setState(null as any);
  };

  return { state, setState, update, reset };`;
  }

  /**
   * Generate animation hook
   */
  private generateAnimationHook(_spec: ReactNativeHookSpec): string {
    return `
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = React.useState(false);

  const start = (toValue: number = 1, duration: number = 300): void => {
    setIsAnimating(true);
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  const reset = (): void => {
    animatedValue.setValue(0);
  };

  return { animatedValue, isAnimating, start, reset };`;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: ReactNativeHookSpec): string {
    const imports = ["import React from 'react';"];

    if (spec.hookType === 'animation') {
      imports.push("import { Animated } from 'react-native';");
    }

    if (spec.hookType === 'navigation') {
      imports.push("import { useNavigation } from '@react-navigation/native';");
      imports.push(
        "import type { NativeStackNavigationProp } from '@react-navigation/native-stack';"
      );
    }

    if (spec.features.includes('async-storage')) {
      imports.push("import AsyncStorage from '@react-native-async-storage/async-storage';");
    }

    return imports.join('\n');
  }

  /**
   * Generate function parameters
   */
  private generateParams(spec: ReactNativeHookSpec): string {
    if (spec.params.length === 0) {
      return '';
    }

    return spec.params.map((param) => `${param.name}: ${param.type}`).join(', ');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: ReactNativeHookSpec): string {
    const hookName = `use${this.toPascalCase(spec.name)}`;

    return `import { renderHook, act } from '@testing-library/react-native';
import { ${hookName} } from './${spec.name}';

describe('${hookName}', () => {
  it('should be defined', () => {
    expect(${hookName}).toBeDefined();
  });

  it('should return the correct structure', () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current).toBeDefined();
  });

  it('should handle initial state', () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current).toMatchObject({});
  });

  ${
    spec.hookType === 'data'
      ? `it('should fetch data', async () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current.loading).toBe(true);

    await act(async () => {
      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
  });`
      : ''
  }

  ${
    spec.hookType === 'async'
      ? `it('should execute async operation', async () => {
    const { result } = renderHook(() => ${hookName}());

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
  });`
      : ''
  }
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: ReactNativeHookSpec): string {
    const hookName = `use${this.toPascalCase(spec.name)}`;

    return `// ${spec.name}.ts
// ${hookName} - Custom hook for ${spec.hookType} operations

// Usage in a component:
import { ${hookName} } from './hooks/${spec.name}';

function MyComponent() {
  const ${this.toCamelCase(spec.name)} = ${hookName}(${
    spec.params.length > 0 ? spec.params.map((p) => `${p.name}`).join(', ') : ''
  });

  // Use the hook:
  // ${Object.keys(this.getHookReturnExample(spec.hookType)).join(', ')}

  return (
    <View>
      {/* Component JSX */}
    </View>
  );
}

// Hook type: ${spec.hookType}
// Returns: ${spec.returns}

// Features:
${spec.features.map((f) => `// - ${f}`).join('\n')}

// Parameters:
${spec.params.map((p) => `// - ${p.name}: ${p.type} - ${p.description}`).join('\n')}
`;
  }

  /**
   * Get example return value for hook type
   */
  private getHookReturnExample(hookType: string): Record<string, string> {
    switch (hookType) {
      case 'data':
        return {
          data: 'data',
          loading: 'boolean',
          error: 'Error | null',
          refetch: 'function',
        };
      case 'navigation':
        return {
          navigate: 'function',
          goBack: 'function',
          reset: 'function',
          navigation: 'object',
        };
      case 'async':
        return {
          result: 'T | null',
          loading: 'boolean',
          error: 'Error | null',
          execute: 'function',
        };
      case 'state':
        return {
          state: 'T',
          setState: 'function',
          update: 'function',
          reset: 'function',
        };
      case 'animation':
        return {
          animatedValue: 'Animated.Value',
          isAnimating: 'boolean',
          start: 'function',
          reset: 'function',
        };
      default:
        return {};
    }
  }
}
