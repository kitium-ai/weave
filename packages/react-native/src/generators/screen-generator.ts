/**
 * React Native Screen Generator
 * Generates React Native screens with proper navigation integration
 */

import { BaseCodeBuilder, type GeneratorOutput } from '@weaveai/shared';
import type { ReactNativeScreenSpec } from './types.js';

/**
 * React Native screen builder
 */
export class ReactNativeScreenBuilder extends BaseCodeBuilder<ReactNativeScreenSpec> {
  constructor() {
    super();
  }

  build(spec: ReactNativeScreenSpec, description: string): GeneratorOutput<ReactNativeScreenSpec> {
    const code = this.generateScreen(spec);
    const tests = this.generateTestFile(spec);
    const examples = this.generateExampleUsage(spec);
    const metadata = this.createMetadata(spec, description, 'weave-react-native-screen-generator');

    return {
      code,
      tests,
      examples,
      metadata,
      spec,
    };
  }

  /**
   * Generate React Native screen
   */
  private generateScreen(spec: ReactNativeScreenSpec): string {
    const imports = this.generateImports(spec);
    const screenName = this.toPascalCase(spec.name);
    const propsType = `${screenName}Props`;

    let screenCode = `${imports}

interface ${propsType} {
${spec.inputs.map((input) => `  ${input.name}${input.optional ? '?' : ''}: ${input.type};`).join('\n')}
}

/**
 * ${screenName} Screen
 */
export const ${screenName} = (props: ${propsType}): JSX.Element => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<any>(null);`;

    if (spec.hasNavigation) {
      screenCode += `
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, '${spec.route}'>>();`;
    }

    screenCode += `

  React.useEffect(() => {
    // Initialize screen
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      // TODO: Implement data loading
      setData({});
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>${spec.name}</Text>
        {/* Screen content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    color: '#ff0000',
    fontSize: 16,
  },
});
`;

    return screenCode;
  }

  /**
   * Generate imports
   */
  private generateImports(spec: ReactNativeScreenSpec): string {
    const imports = [
      "import React from 'react';",
      "import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';",
    ];

    if (spec.hasNavigation) {
      imports.push("import { useNavigation, useRoute } from '@react-navigation/native';");
      imports.push(
        "import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';"
      );
    }

    if (spec.features.includes('flatlist')) {
      imports.push("import { FlatList } from 'react-native';");
    }

    if (spec.features.includes('animation')) {
      imports.push("import { Animated } from 'react-native';");
    }

    if (spec.features.includes('gestures')) {
      imports.push(
        "import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';"
      );
    }

    if (spec.features.includes('async-storage')) {
      imports.push("import AsyncStorage from '@react-native-async-storage/async-storage';");
    }

    return imports.join('\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: ReactNativeScreenSpec): string {
    const screenName = this.toPascalCase(spec.name);

    return `import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ${screenName} } from './${spec.name}';

describe('${screenName} Screen', () => {
  it('renders the screen', () => {
    const { getByText } = render(<${screenName} />);
    expect(getByText('${spec.name}')).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByTestId } = render(<${screenName} />);
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('displays error message when loading fails', async () => {
    const { getByText } = render(<${screenName} />);
    // Mock error scenario
    await expect(screen.findByText(/Error:/)).toBeTruthy();
  });

  ${spec.inputs
    .map(
      (input) => `it('accepts ${input.name} prop', () => {
    const { getByText } = render(
      <${screenName} ${input.name}=${this.getExampleValue(input.type)} />
    );
    expect(getByText('${spec.name}')).toBeTruthy();
  });`
    )
    .join('\n\n  ')}
});`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: ReactNativeScreenSpec): string {
    const screenName = this.toPascalCase(spec.name);

    return `// ${spec.name}.tsx
// ${screenName} - Displays ${spec.name} content

// Usage in navigator:
import { ${screenName} } from './screens/${spec.name}';

// Add to navigation stack:
<Stack.Screen
  name="${spec.route}"
  component={${screenName}}
  options={{
    title: '${spec.name}',
    headerShown: true,
  }}
/>

// Navigate to screen:
navigation.navigate('${spec.route}', {
${spec.inputs.map((input) => `  ${input.name}: ${this.getExampleValue(input.type)},`).join('\n')}
});

// Features:
${spec.features.map((f) => `// - ${f}`).join('\n')}

// Props:
${spec.inputs.map((input) => `// - ${input.name}${input.optional ? ' (optional)' : ''}: ${input.type} - ${input.description}`).join('\n')}
`;
  }
}
