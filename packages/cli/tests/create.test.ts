/**
 * Tests for create command
 */

import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validateApiKey,
  validateFramework,
  validateProvider,
  validateModel,
} from '../src/utils/validation.js';
import {
  generateEnvFile,
  generateEnvExampleFile,
  generateReadme,
  getFrameworkInfo,
  getProviderInfo,
  getModelsByProvider,
} from '../src/utils/config.js';

describe('Validation Utils', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(validateProjectName('my-app').valid).toBe(true);
      expect(validateProjectName('MyApp').valid).toBe(true);
      expect(validateProjectName('my_app').valid).toBe(true);
      expect(validateProjectName('app123').valid).toBe(true);
    });

    it('should reject empty names', () => {
      expect(validateProjectName('').valid).toBe(false);
      expect(validateProjectName('   ').valid).toBe(false);
    });

    it('should reject names with invalid characters', () => {
      expect(validateProjectName('my@app').valid).toBe(false);
      expect(validateProjectName('my app').valid).toBe(false);
    });

    it('should reject names starting with numbers', () => {
      expect(validateProjectName('1app').valid).toBe(false);
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(validateProjectName(longName).valid).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    it('should validate OpenAI keys', () => {
      const validKey = 'sk-' + 'a'.repeat(48);
      expect(validateApiKey('openai', validKey).valid).toBe(true);
    });

    it('should reject OpenAI keys with wrong prefix', () => {
      expect(validateApiKey('openai', 'invalid-key').valid).toBe(false);
    });

    it('should validate Anthropic keys', () => {
      const validKey = 'sk-ant-' + 'a'.repeat(48);
      expect(validateApiKey('anthropic', validKey).valid).toBe(true);
    });

    it('should reject Anthropic keys with wrong prefix', () => {
      expect(validateApiKey('anthropic', 'sk-invalid').valid).toBe(false);
    });

    it('should reject empty keys', () => {
      expect(validateApiKey('openai', '').valid).toBe(false);
      expect(validateApiKey('openai', '   ').valid).toBe(false);
    });
  });

  describe('validateFramework', () => {
    it('should accept valid frameworks', () => {
      expect(validateFramework('react-vite')).toBe(true);
      expect(validateFramework('react-nextjs')).toBe(true);
      expect(validateFramework('vue')).toBe(true);
      expect(validateFramework('svelte')).toBe(true);
      expect(validateFramework('angular')).toBe(true);
    });

    it('should reject invalid frameworks', () => {
      expect(validateFramework('django')).toBe(false);
      expect(validateFramework('flask')).toBe(false);
      expect(validateFramework('invalid')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(validateFramework('REACT-VITE')).toBe(true);
      expect(validateFramework('VUE')).toBe(true);
    });
  });

  describe('validateProvider', () => {
    it('should accept valid providers', () => {
      expect(validateProvider('openai')).toBe(true);
      expect(validateProvider('anthropic')).toBe(true);
      expect(validateProvider('google')).toBe(true);
    });

    it('should reject invalid providers', () => {
      expect(validateProvider('groq')).toBe(false);
      expect(validateProvider('mistral')).toBe(false);
      expect(validateProvider('invalid')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(validateProvider('OPENAI')).toBe(true);
      expect(validateProvider('Anthropic')).toBe(true);
    });
  });

  describe('validateModel', () => {
    it('should validate OpenAI models', () => {
      expect(validateModel('openai', 'gpt-4')).toBe(true);
      expect(validateModel('openai', 'gpt-3.5-turbo')).toBe(true);
    });

    it('should reject invalid OpenAI models', () => {
      expect(validateModel('openai', 'gpt-5')).toBe(false);
      expect(validateModel('openai', 'invalid')).toBe(false);
    });

    it('should validate Anthropic models', () => {
      expect(validateModel('anthropic', 'claude-3-opus')).toBe(true);
      expect(validateModel('anthropic', 'claude-3-haiku')).toBe(true);
    });

    it('should reject invalid Anthropic models', () => {
      expect(validateModel('anthropic', 'claude-2')).toBe(false);
    });
  });
});

describe('Config Utils', () => {
  describe('generateEnvFile', () => {
    it('should generate valid .env content', () => {
      const content = generateEnvFile({
        projectName: 'test-app',
        framework: 'react-vite',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'sk-test',
      });

      expect(content).toContain('VITE_WEAVE_PROVIDER=OPENAI');
      expect(content).toContain('VITE_WEAVE_API_KEY=sk-test');
      expect(content).toContain('VITE_WEAVE_MODEL=gpt-3.5-turbo');
    });

    it('should handle missing API key', () => {
      const content = generateEnvFile({
        projectName: 'test-app',
        framework: 'react-vite',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        apiKey: 'PLACEHOLDER_API_KEY',
      });

      expect(content).toContain('PLACEHOLDER_API_KEY');
    });
  });

  describe('generateEnvExampleFile', () => {
    it('should generate valid .env.example content', () => {
      const content = generateEnvExampleFile();

      expect(content).toContain('VITE_WEAVE_PROVIDER');
      expect(content).toContain('VITE_WEAVE_API_KEY');
      expect(content).toContain('VITE_WEAVE_MODEL');
      expect(content).toContain('# Optional');
    });

    it('should include documentation links', () => {
      const content = generateEnvExampleFile();

      expect(content).toContain('https://platform.openai.com/api-keys');
      expect(content).toContain('https://console.anthropic.com');
    });
  });

  describe('generateReadme', () => {
    it('should include project name', () => {
      const content = generateReadme({
        projectName: 'MyApp',
        framework: 'react-vite',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test',
      });

      expect(content).toContain('MyApp');
    });

    it('should include framework information', () => {
      const content = generateReadme({
        projectName: 'test',
        framework: 'react-vite',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test',
      });

      expect(content).toContain('React');
    });

    it('should include provider information', () => {
      const content = generateReadme({
        projectName: 'test',
        framework: 'vue',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        apiKey: 'test',
      });

      expect(content).toContain('anthropic');
    });

    it('should include setup instructions', () => {
      const content = generateReadme({
        projectName: 'test',
        framework: 'svelte',
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test',
      });

      expect(content).toContain('npm install');
      expect(content).toContain('npm run dev');
      expect(content).toContain('.env.local');
    });
  });

  describe('getFrameworkInfo', () => {
    it('should return info for React Vite', () => {
      const info = getFrameworkInfo('react-vite');
      expect(info.name).toBe('React (Vite)');
      expect(info.buildTool).toBe('vite');
      expect(info.dependencies).toContain('react');
      expect(info.dependencies).toContain('@weaveai/react');
    });

    it('should return info for Next.js', () => {
      const info = getFrameworkInfo('react-nextjs');
      expect(info.name).toBe('React (Next.js)');
      expect(info.buildTool).toBe('next');
      expect(info.dependencies).toContain('next');
      expect(info.dependencies).toContain('@weaveai/nextjs');
    });

    it('should return info for Vue', () => {
      const info = getFrameworkInfo('vue');
      expect(info.name).toBe('Vue 3');
      expect(info.dependencies).toContain('vue');
      expect(info.dependencies).toContain('@weaveai/vue');
    });

    it('should return info for Svelte', () => {
      const info = getFrameworkInfo('svelte');
      expect(info.name).toBe('Svelte');
      expect(info.dependencies).toContain('svelte');
      expect(info.dependencies).toContain('@weaveai/svelte');
    });

    it('should return info for Angular', () => {
      const info = getFrameworkInfo('angular');
      expect(info.name).toBe('Angular');
      expect(info.buildTool).toBe('angular');
      expect(info.dependencies).toContain('@angular/core');
    });
  });

  describe('getProviderInfo', () => {
    it('should return info for OpenAI', () => {
      const info = getProviderInfo('openai');
      expect(info.name).toBe('OpenAI');
      expect(info.docsUrl).toContain('openai');
      expect(info.defaultModel).toBe('gpt-3.5-turbo');
    });

    it('should return info for Anthropic', () => {
      const info = getProviderInfo('anthropic');
      expect(info.name).toBe('Anthropic');
      expect(info.docsUrl).toContain('anthropic');
      expect(info.defaultModel).toBe('claude-3-sonnet');
    });

    it('should return info for Google', () => {
      const info = getProviderInfo('google');
      expect(info.name).toBe('Google');
      expect(info.docsUrl).toContain('google');
      expect(info.defaultModel).toBe('gemini-pro');
    });
  });

  describe('getModelsByProvider', () => {
    it('should return OpenAI models', () => {
      const models = getModelsByProvider('openai');
      expect(models).toContain('gpt-4-turbo');
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-3.5-turbo');
    });

    it('should return Anthropic models', () => {
      const models = getModelsByProvider('anthropic');
      expect(models).toContain('claude-3-opus');
      expect(models).toContain('claude-3-sonnet');
      expect(models).toContain('claude-3-haiku');
    });

    it('should return Google models', () => {
      const models = getModelsByProvider('google');
      expect(models).toContain('gemini-pro');
      expect(models).toContain('palm-2');
    });

    it('should return empty array for unknown provider', () => {
      const models = getModelsByProvider('unknown');
      expect(models).toEqual([]);
    });
  });
});
