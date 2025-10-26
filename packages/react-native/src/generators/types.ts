/**
 * React Native generator types
 */

import type { BaseSpec } from '@weaveai/shared';

/**
 * React Native screen specification
 */
export interface ReactNativeScreenSpec extends BaseSpec {
  framework: 'react-native';
  route: string;
  hasNavigation: boolean;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
    optional: boolean;
  }>;
  features: string[];
}

/**
 * React Native hook specification
 */
export interface ReactNativeHookSpec extends BaseSpec {
  framework: 'react-native';
  hookType: 'data' | 'navigation' | 'async' | 'state' | 'animation';
  returns: string;
  params: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  features: string[];
}

/**
 * React Native component specification
 */
export interface ReactNativeComponentSpec extends BaseSpec {
  framework: 'react-native';
  componentType: 'functional' | 'class';
  props: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: string;
  }>;
  usesFlatList: boolean;
  usesScrollView: boolean;
  features: string[];
}
