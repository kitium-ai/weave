/**
 * Component Generator Example
 * Demonstrates how to use the useComponentGenerator hook
 */

import React, { useState } from 'react';
import { useComponentGenerator } from '../hooks/useComponentGenerator';
import type { GeneratedComponent } from '../generators/types';

/**
 * Example component that generates React components with natural language
 */
export function ComponentGeneratorExample() {
  const [componentName, setComponentName] = useState('');
  const [description, setDescription] = useState('');
  const [generatedComponent, setGeneratedComponent] = useState<GeneratedComponent | null>(null);
  const { component, loading, error, generate } = useComponentGenerator({
    onSuccess: (comp) => {
      console.log('Component generated:', comp.componentName);
      setGeneratedComponent(comp);
    },
    onError: (err) => {
      console.error('Generation error:', err);
    },
  });

  const handleGenerate = async () => {
    if (componentName.trim() && description.trim()) {
      await generate(componentName, description, {
        includeTests: true,
        includeExamples: true,
        styling: 'tailwind',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">React Component Generator</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Component Details</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Component Name</label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              placeholder="e.g., UserCard, DataTable, SearchBar"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description (Natural Language)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your component in natural language. E.g., 'A card component that displays user information with avatar, name, email, and an edit button with tailwind styling and dark mode support'"
              rows={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !componentName.trim() || !description.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Component'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              Error: {error.message}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="border rounded-lg p-6 overflow-auto max-h-screen">
          <h2 className="text-xl font-semibold mb-4">Generated Component</h2>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Generating component...</p>
            </div>
          )}

          {generatedComponent && !loading && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Component Name</h3>
                <code className="bg-gray-100 p-2 rounded block text-sm">
                  {generatedComponent.componentName}
                </code>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Component Code</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48 text-xs">
                  {generatedComponent.componentCode}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Props Interface</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">
                  {generatedComponent.propsInterface}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Example Usage</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">
                  {generatedComponent.exampleUsage}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Test File</h3>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">
                  {generatedComponent.testFile.substring(0, 200)}...
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Metadata</h3>
                <div className="bg-gray-100 p-2 rounded text-sm">
                  <p>Generated: {generatedComponent.metadata.generatedAt.toLocaleString()}</p>
                  <p>Complexity: {generatedComponent.componentSpec.complexity}</p>
                  <p>Styling: {generatedComponent.componentSpec.styling}</p>
                  <p>Features: {generatedComponent.componentSpec.features.join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !generatedComponent && !error && (
            <p className="text-gray-500 text-center py-8">Generated component will appear here</p>
          )}
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-8 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Example Prompts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExamplePrompt
            name="UserCard"
            description="A card component that displays user information with avatar, name, email, and action buttons"
            onClick={() => {
              setComponentName('UserCard');
              setDescription(
                'A card component that displays user information with avatar, name, email, and action buttons'
              );
            }}
          />

          <ExamplePrompt
            name="DataTable"
            description="A responsive, searchable data table with pagination, sorting, and dark mode support"
            onClick={() => {
              setComponentName('DataTable');
              setDescription(
                'A responsive, searchable data table with pagination, sorting, and dark mode support'
              );
            }}
          />

          <ExamplePrompt
            name="FormInput"
            description="A form input component with validation, error messages, and helper text using inline styles"
            onClick={() => {
              setComponentName('FormInput');
              setDescription(
                'A form input component with validation, error messages, and helper text using inline styles'
              );
            }}
          />

          <ExamplePrompt
            name="Modal"
            description="A modal dialog component with animated backdrop, close button, and accessibility features"
            onClick={() => {
              setComponentName('Modal');
              setDescription(
                'A modal dialog component with animated backdrop, close button, and accessibility features'
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example prompt card
 */
function ExamplePrompt({
  name,
  description,
  onClick,
}: {
  name: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 border rounded-lg hover:bg-blue-50 text-left transition-colors"
    >
      <h3 className="font-semibold text-blue-600">{name}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </button>
  );
}
