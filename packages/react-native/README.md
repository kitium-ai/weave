# React Native Code Generators

Generate production-ready React Native screens and hooks from specifications using natural language processing and AI-powered code generation.

## Overview

The React Native Code Generators provide a powerful way to automatically generate:

- **Screens** - With navigation integration, loading states, and proper patterns
- **Custom Hooks** - For data fetching, navigation, animations, and state management
- **Components** - With proper React Native patterns and performance optimization
- **Type definitions** - Full TypeScript interfaces and types
- **Unit Tests** - Comprehensive test files using React Native Testing Library
- **Documentation** - Examples and usage patterns

## Features

- 🎯 **React Native Optimized** - Proper React Native patterns and best practices
- 📝 **NLP-Powered Parsing** - Extract features and structure from natural language descriptions
- 🧪 **Built-in Tests** - Auto-generated tests with React Native Testing Library
- 📚 **Complete Examples** - Learn by example with generated documentation
- ♻️ **Reusable Output** - Code ready for both iOS and Android
- ⚡ **Performance First** - Optimized rendering and memory usage

## Installation

```bash
npm install @weaveai/react-native
# or
yarn add @weaveai/react-native
```

## Usage

### Generate a Screen

```typescript
import { ReactNativeScreenBuilder } from '@weaveai/react-native';
import type { ReactNativeScreenSpec } from '@weaveai/react-native';

const screenSpec: ReactNativeScreenSpec = {
  name: 'products-list',
  description: 'Screen displaying a list of products with search functionality',
  framework: 'react-native',
  route: 'ProductsList',
  hasNavigation: true,
  inputs: [
    {
      name: 'categoryId',
      type: 'string',
      description: 'Filter products by category ID',
      optional: true,
    },
    {
      name: 'searchQuery',
      type: 'string',
      description: 'Search query for filtering products',
      optional: true,
    },
  ],
  features: ['flatlist', 'search', 'pagination', 'pull-to-refresh', 'navigation'],
};

const builder = new ReactNativeScreenBuilder();
const output = builder.build(screenSpec, 'Product listing screen with search');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
console.log('Generated Examples:', output.examples);
```

### Generate a Custom Hook

```typescript
import { ReactNativeHookBuilder } from '@weaveai/react-native';
import type { ReactNativeHookSpec } from '@weaveai/react-native';

const hookSpec: ReactNativeHookSpec = {
  name: 'useProducts',
  description: 'Hook for fetching and managing products data',
  framework: 'react-native',
  hookType: 'data',
  returns: 'Product[]',
  params: [
    {
      name: 'categoryId',
      type: 'string',
      description: 'Optional category filter',
    },
  ],
  features: ['error handling', 'refetch', 'loading states', 'caching'],
};

const builder = new ReactNativeHookBuilder();
const output = builder.build(hookSpec, 'Custom hook for fetching products');

console.log('Generated Code:', output.code);
console.log('Generated Tests:', output.tests);
```

## Screen Specification (ReactNativeScreenSpec)

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Screen name (e.g., 'products-list') |
| `description` | string | Screen description |
| `framework` | 'react-native' | Framework identifier |
| `route` | string | Navigation route name |
| `hasNavigation` | boolean | Whether screen uses navigation |
| `inputs` | Array | Screen parameters/props |
| `features` | string[] | Features like 'flatlist', 'search', etc. |

### Input Structure

```typescript
interface Input {
  name: string;           // Parameter name
  type: string;          // TypeScript type
  description: string;   // Parameter documentation
  optional: boolean;     // Whether parameter is optional
}
```

## Hook Specification (ReactNativeHookSpec)

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Hook name (e.g., 'useProducts') |
| `description` | string | Hook description |
| `framework` | 'react-native' | Framework identifier |
| `hookType` | string | Hook type: 'data', 'navigation', 'async', 'state', 'animation' |
| `returns` | string | Return type |
| `params` | Array | Hook parameters |
| `features` | string[] | Features like 'caching', 'error handling' |

## Hook Types

### Data Hook

For fetching and managing data:

```typescript
const { data, loading, error, refetch } = useProducts();
```

### Navigation Hook

For navigation utilities:

```typescript
const { navigate, goBack, reset, navigation } = useAppNavigation();
```

### Async Hook

For general async operations:

```typescript
const { result, loading, error, execute } = useAsync();
```

### State Hook

For state management:

```typescript
const { state, setState, update, reset } = useFormState();
```

### Animation Hook

For animations:

```typescript
const { animatedValue, isAnimating, start, reset } = useAnimation();
```

## Generated Output (GeneratorOutput)

```typescript
interface GeneratorOutput<T extends BaseSpec> {
  code: string;          // Generated screen/hook code
  tests: string;         // Generated unit tests
  examples: string;      // Usage examples and documentation
  metadata: CodeMetadata; // Generation metadata
  spec: T;              // Original specification
}
```

## Examples

For more complete examples, see [examples.ts](src/generators/examples.ts)

### Simple Data Fetching Hook

```typescript
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
  id: number;
  name: string;
  price: number;
}

export const useProducts = (categoryId?: string) => {
  const [data, setData] = React.useState<Product[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Implement data fetching logic
        const result = await Promise.resolve([]);
        setData(result as Product[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const refetch = async (): Promise<void> => {
    try {
      setLoading(true);
      // TODO: Implement refetch logic
      const result = await Promise.resolve([]);
      setData(result as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};
```

### Simple Screen with Navigation

```typescript
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export const ProductListScreen: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<any>(null);
  const navigation = useNavigation();
  const route = useRoute();

  React.useEffect(() => {
    // Initialize screen
  }, []);

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
        <Text style={styles.title}>ProductList</Text>
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
```

### Navigation Hook

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  ProductsList: { categoryId?: string };
  ProductDetails: { productId: string };
  Cart: undefined;
};

export const useAppNavigation = () => {
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

  return { navigate, goBack, reset, navigation };
};
```

## Supported Features

Screens can include:

- **FlatList** - Optimized list rendering
- **ScrollView** - Scrollable content
- **Navigation** - React Navigation integration
- **Search** - Filter and search functionality
- **Pagination** - Paginated lists
- **Pull-to-Refresh** - Refresh data capability
- **Loading States** - Proper loading UI

Hooks can include:

- **Data Fetching** - API calls with refetch
- **Navigation** - Screen navigation helpers
- **Animations** - Animated value management
- **State Management** - Complex state handling
- **Async Operations** - Promise-based operations
- **Caching** - Local caching with AsyncStorage
- **Error Handling** - Error states and recovery

## Best Practices

1. **Use Safe Area** - Always wrap screens with SafeAreaView
2. **Optimize Lists** - Use FlatList for large lists, not ScrollView
3. **Handle Errors** - Always show error states
4. **Loading States** - Display loading indicators
5. **Type Safety** - Use TypeScript for all components
6. **Performance** - Use React.memo and useCallback
7. **Navigation** - Properly type navigation parameters

## Advanced Usage

### Custom Hook Composition

```typescript
export const useProductManagement = (categoryId?: string) => {
  const products = useProducts(categoryId);
  const navigation = useAppNavigation();
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const addSelectedToCart = async () => {
    const items = products.data?.filter(p => selectedIds.has(p.id));
    // Add logic
    navigation.navigate('Cart');
  };

  return {
    ...products,
    selectedIds,
    toggleSelection,
    addSelectedToCart,
  };
};
```

### Navigation Stack Setup

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductListScreen } from './screens/ProductList';
import { ProductDetailsScreen } from './screens/ProductDetails';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          animationEnabled: true,
        }}
      >
        <Stack.Screen
          name="ProductsList"
          component={ProductListScreen}
          options={{ title: 'Products' }}
        />
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={({ route }) => ({
            title: `Product ${route.params.productId}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Architecture

- **BaseCodeBuilder** - Abstract base class with shared utilities (from `@weaveai/shared`)
- **BaseSpecParser** - NLP parsing for feature extraction (from `@weaveai/shared`)
- **ReactNativeScreenBuilder** - Screen-specific code generation
- **ReactNativeHookBuilder** - Hook-specific code generation
- **CodeFormatter** - Consistent code formatting (from `@weaveai/shared`)

## Directory Structure

```
src/
├── screens/
│   ├── ProductList.tsx        # Generated screens
│   └── ProductDetails.tsx
├── hooks/
│   ├── useProducts.ts         # Generated hooks
│   ├── useAppNavigation.ts
│   └── useAnimation.ts
├── navigation/
│   └── AppNavigator.tsx       # Navigation setup
└── types/
    └── navigation.ts          # Type definitions
```

## Testing

Generated tests use React Native Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useProducts } from './useProducts';

describe('useProducts', () => {
  it('should be defined', () => {
    expect(useProducts).toBeDefined();
  });

  it('should return the correct structure', () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current).toBeDefined();
  });

  it('should handle initial state', () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current.loading).toBe(true);
  });

  it('should fetch data', async () => {
    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
  });
});
```

## Platform Considerations

- **iOS** - Proper SafeAreaView usage
- **Android** - Back button handling
- **Both** - Consistent navigation patterns
- **Performance** - Memory management for large lists

## Contributing

Contributions are welcome! Please ensure:

1. Code follows React Native best practices
2. Tests pass and coverage remains high
3. Documentation is updated
4. TypeScript strict mode compliance
5. Cross-platform compatibility

## Related Packages

- [@weaveai/shared](../../shared) - Shared utilities and base classes
- [@weaveai/react](../../react) - React generators
- [@weaveai/angular](../../angular) - Angular generators
- [@weaveai/nextjs](../../nextjs) - Next.js generators
- [@weaveai/nodejs](../../nodejs) - Node.js generators

## License

MIT
