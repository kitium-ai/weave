/**
 * React Native Generators Examples
 * Demonstrates how to use React Native screen and hook generators
 */

import { ReactNativeScreenBuilder } from './screen-generator.js';
import { ReactNativeHookBuilder } from './hook-generator.js';
import type { ReactNativeScreenSpec, ReactNativeHookSpec } from './types.js';

/**
 * Example 1: Generate a React Native screen
 */
export function exampleScreenGeneration(): void {
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
    language: 'typescript',
  };

  const builder = new ReactNativeScreenBuilder();
  const output = builder.build(
    screenSpec,
    'Product listing screen with search and filtering capabilities'
  );

  console.log('Generated Screen Code:');
  console.log(output.code);
  console.log('\nGenerated Tests:');
  console.log(output.tests);
  console.log('\nGenerated Examples:');
  console.log(output.examples);
}

/**
 * Example 2: Generate a data fetching hook
 */
export function exampleDataHookGeneration(): void {
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
    language: 'typescript',
  };

  const builder = new ReactNativeHookBuilder();
  const output = builder.build(
    hookSpec,
    'Custom hook for fetching products with refetch capability'
  );

  console.log('Generated Hook Code:');
  console.log(output.code);
  console.log('\nGenerated Tests:');
  console.log(output.tests);
}

/**
 * Example 3: Generate a navigation hook
 */
export function exampleNavigationHookGeneration(): void {
  const hookSpec: ReactNativeHookSpec = {
    name: 'useAppNavigation',
    description: 'Hook for managing app navigation',
    framework: 'react-native',
    hookType: 'navigation',
    returns: 'NavigationHelpers',
    params: [],
    features: ['deep linking', 'back handling', 'route reset'],
    language: 'typescript',
  };

  const builder = new ReactNativeHookBuilder();
  const output = builder.build(hookSpec, 'Custom hook providing navigation helpers');

  console.log('Generated Navigation Hook:');
  console.log(output.code);
}

/**
 * Example 4: Screen navigation setup
 */
export const navigationSetupExample = `
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProductsListScreen } from './screens/ProductsList';
import { ProductDetailsScreen } from './screens/ProductDetails';
import { CartScreen } from './screens/Cart';

export type RootStackParamList = {
  ProductsList: { categoryId?: string };
  ProductDetails: { productId: string };
  Cart: undefined;
};

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
          component={ProductsListScreen}
          options={{
            title: 'Products',
          }}
        />
        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
          options={({ route }) => ({
            title: \`Product \${route.params.productId}\`,
          })}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{
            title: 'Shopping Cart',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`;

/**
 * Example 5: Using hooks in screens
 */
export const hooksUsageExample = `
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useProducts } from '../hooks/useProducts';
import { useAppNavigation } from '../hooks/useAppNavigation';

interface ProductListScreenProps {
  route?: any;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({ route }) => {
  const categoryId = route?.params?.categoryId;
  const { data: products, loading, error, refetch } = useProducts(categoryId);
  const { navigate } = useAppNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !products.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => navigate('ProductDetails', { productId: item.id })}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ padding: 16 }}
    />
  );
};

interface ProductCardProps {
  product: any;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#f0f0f0',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{product.name}</Text>
      <Text style={{ fontSize: 14, color: '#666' }}>{{product.price}}</Text>
    </Pressable>
  );
};
`;

/**
 * Example 6: Complete app structure
 */
export const appStructureExample = `
// App.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
`;

/**
 * Example 7: Custom hook composition
 */
export const hookCompositionExample = `
import React from 'react';
import { useProducts } from './useProducts';
import { useAppNavigation } from './useAppNavigation';

/**
 * Combined hook for product management screen
 */
export const useProductManagement = (categoryId?: string) => {
  const products = useProducts(categoryId);
  const navigation = useAppNavigation();
  const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set());

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const navigateToProduct = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const addSelectedToCart = async () => {
    const itemsToAdd = products.data?.filter(p =>
      selectedProducts.has(p.id.toString())
    ) || [];

    // Add to cart logic
    console.log('Adding to cart:', itemsToAdd);
    navigation.navigate('Cart');
  };

  return {
    ...products,
    selectedProducts,
    toggleProductSelection,
    navigateToProduct,
    addSelectedToCart,
  };
};
`;

/**
 * Example 8: Integrated usage
 */
export async function runIntegratedExample(): Promise<void> {
  console.log('=== React Native Generators Examples ===\n');

  console.log('1. Generating Product List Screen...');
  exampleScreenGeneration();

  console.log('\n2. Generating Data Fetching Hook...');
  exampleDataHookGeneration();

  console.log('\n3. Generating Navigation Hook...');
  exampleNavigationHookGeneration();

  console.log('\n4. Navigation Setup:');
  console.log(navigationSetupExample);

  console.log('\n5. Using Hooks in Screens:');
  console.log(hooksUsageExample);

  console.log('\n6. Complete App Structure:');
  console.log(appStructureExample);

  console.log('\n7. Custom Hook Composition:');
  console.log(hookCompositionExample);
}

// Run examples if this file is executed directly
if (require.main === module) {
  runIntegratedExample().catch(console.error);
}
