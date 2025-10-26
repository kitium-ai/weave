/**
 * Angular generator types
 */

import type { BaseSpec } from '@weaveai/shared';

/**
 * Angular component specification
 */
export interface AngularComponentSpec extends BaseSpec {
  framework: 'angular';
  inputs: Array<{
    name: string;
    type: string;
    description: string;
    optional: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  features: string[];
}

/**
 * Angular service specification
 */
export interface AngularServiceSpec extends BaseSpec {
  framework: 'angular';
  methods: Array<{
    name: string;
    description: string;
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpoint: string;
    params: Array<{ name: string; type: string }>;
    returnType: string;
  }>;
  features: string[];
}

/**
 * Angular module specification
 */
export interface AngularModuleSpec extends BaseSpec {
  framework: 'angular';
  components: string[];
  services: string[];
  imports: string[];
  exports: string[];
}
