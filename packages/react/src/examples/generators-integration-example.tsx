/**
 * Weave Code Generators - Integration Example
 * Demonstrates all 5 code generators with real-world use cases
 *
 * ✨ Features:
 * - Component Generator: React components with tests
 * - Hook Generator: Custom React hooks
 * - Type Generator: TypeScript types + validators
 * - Utility Generator: Pure functions with tests
 * - Query Generator: React Query hooks + API clients
 *
 * 📝 Try the examples to see how natural language descriptions
 * are converted into production-ready code!
 */

import React, { useState } from 'react';
import { useComponentGenerator } from '../hooks/useComponentGenerator';
import { useHookGenerator } from '../hooks/useHookGenerator';
import { useTypeGenerator } from '../hooks/useTypeGenerator';
import { useUtilGenerator } from '../hooks/useUtilGenerator';
import { useQueryGenerator } from '../hooks/useQueryGenerator';

/**
 * Main integration example app
 */
export function GeneratorsIntegration() {
  const [activeTab, setActiveTab] = useState<'component' | 'hook' | 'type' | 'util' | 'query'>(
    'component'
  );

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
    { id: 'component', label: 'Components', icon: '🎨' },
    { id: 'hook', label: 'Hooks', icon: '🪝' },
    { id: 'type', label: 'Types', icon: '📝' },
    { id: 'util', label: 'Utilities', icon: '⚙️' },
    { id: 'query', label: 'Queries', icon: '📡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2">⚡ Weave Code Generators</h1>
          <p className="text-blue-100 text-lg">
            Generate production-ready code from natural language descriptions
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto">
          <div className="flex gap-2 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-8">
        {activeTab === 'component' && <ComponentGeneratorExample />}
        {activeTab === 'hook' && <HookGeneratorExample />}
        {activeTab === 'type' && <TypeGeneratorExample />}
        {activeTab === 'util' && <UtilGeneratorExample />}
        {activeTab === 'query' && <QueryGeneratorExample />}
      </div>
    </div>
  );
}

/**
 * Component Generator Example
 */
function ComponentGeneratorExample() {
  const { component, loading, error, generate } = useComponentGenerator();
  const [input, setInput] = useState('');

  const examples = [
    {
      name: 'User Card',
      desc: 'A card displaying user information with avatar, name, email, and action buttons',
    },
    {
      name: 'Product Card',
      desc: 'A product card with image, title, price, rating, and add to cart button',
    },
    {
      name: 'Form Input',
      desc: 'A form input with validation, error messages, and helper text',
    },
  ];

  return (
    <GeneratorTemplate
      title="Component Generator"
      description="Create React components with TypeScript, tests, and examples"
      icon="🎨"
      input={input}
      setInput={setInput}
      loading={loading}
      error={error}
      output={component}
      onGenerate={() => generate('Component', input || examples[0].desc)}
      examples={examples}
      onExampleClick={(example) => {
        setInput(example.desc);
        generate('Example', example.desc);
      }}
      outputSections={[
        { label: 'Component Code', content: component?.componentCode },
        { label: 'Props Interface', content: component?.propsInterface },
        { label: 'Example Usage', content: component?.exampleUsage },
        { label: 'Test File', content: component?.testFile },
      ]}
    />
  );
}

/**
 * Hook Generator Example
 */
function HookGeneratorExample() {
  const { hook, loading, error, generate } = useHookGenerator();
  const [input, setInput] = useState('');

  const examples = [
    {
      name: 'useAuth',
      desc: 'A hook managing user authentication with login, logout, and token refresh',
    },
    {
      name: 'useForm',
      desc: 'A hook for managing form state with validation and error handling',
    },
    {
      name: 'useLocalStorage',
      desc: 'A hook for managing local storage with type safety',
    },
  ];

  return (
    <GeneratorTemplate
      title="Hook Generator"
      description="Create custom React hooks with types and state management"
      icon="🪝"
      input={input}
      setInput={setInput}
      loading={loading}
      error={error}
      output={hook}
      onGenerate={() => generate('Hook', input || examples[0].desc)}
      examples={examples}
      onExampleClick={(example) => {
        setInput(example.desc);
        generate(example.name, example.desc);
      }}
      outputSections={[
        { label: 'Hook Code', content: hook?.hookCode },
        { label: 'Types', content: hook?.typesFile },
        { label: 'Example Usage', content: hook?.exampleUsage },
        { label: 'Tests', content: hook?.testFile },
      ]}
    />
  );
}

/**
 * Type Generator Example
 */
function TypeGeneratorExample() {
  const { types, loading, error, generate, generateMultiple } = useTypeGenerator();
  const [input, setInput] = useState('');
  const [useMultiple, setUseMultiple] = useState(false);

  const examples = [
    {
      name: 'User',
      desc: 'User interface with id, email, name, role, avatar, and timestamps',
      multiple: false,
    },
    {
      name: 'User Domain',
      desc: 'User domain types including User, Role, and Permission',
      multiple: true,
    },
    {
      name: 'Product',
      desc: 'Product type with id, name, price, inventory, and description',
      multiple: false,
    },
  ];

  return (
    <GeneratorTemplate
      title="Type Generator"
      description="Create TypeScript types, interfaces, enums, and validators"
      icon="📝"
      input={input}
      setInput={setInput}
      loading={loading}
      error={error}
      output={types}
      onGenerate={() => {
        if (useMultiple) {
          generateMultiple(['Type1', 'Type2'], input || examples[1].desc);
        } else {
          generate('Type', input || examples[0].desc);
        }
      }}
      examples={examples}
      onExampleClick={(example) => {
        setInput(example.desc);
        const multiple = Boolean(example.multiple);
        setUseMultiple(multiple);
        if (multiple) {
          generateMultiple(['Type1', 'Type2'], example.desc);
        } else {
          generate(example.name, example.desc);
        }
      }}
      outputSections={[
        { label: 'Type Definitions', content: types?.typesCode },
        { label: 'Validators (Zod)', content: types?.validatorCode },
        { label: 'Examples', content: types?.exampleUsage },
      ]}
    />
  );
}

/**
 * Utility Generator Example
 */
function UtilGeneratorExample() {
  const { utils, loading, error, generate, generateMultiple } = useUtilGenerator();
  const [input, setInput] = useState('');
  const [useMultiple, setUseMultiple] = useState(false);

  const examples = [
    {
      name: 'formatDate',
      desc: 'A function that formats dates to ISO string with timezone support',
      multiple: false,
    },
    {
      name: 'Date Utilities',
      desc: 'Utility functions for formatting, parsing, and comparing dates',
      multiple: true,
    },
    {
      name: 'validateEmail',
      desc: 'A function that validates email addresses and returns true/false',
      multiple: false,
    },
  ];

  return (
    <GeneratorTemplate
      title="Utility Generator"
      description="Create pure utility functions with tests and documentation"
      icon="⚙️"
      input={input}
      setInput={setInput}
      loading={loading}
      error={error}
      output={utils}
      onGenerate={() => {
        if (useMultiple) {
          generateMultiple(['util1', 'util2'], input || examples[1].desc);
        } else {
          generate('formatDate', input || examples[0].desc);
        }
      }}
      examples={examples}
      onExampleClick={(example) => {
        setInput(example.desc);
        const multiple = Boolean(example.multiple);
        setUseMultiple(multiple);
        if (multiple) {
          generateMultiple(['util1', 'util2'], example.desc);
        } else {
          generate(example.name, example.desc);
        }
      }}
      outputSections={[
        { label: 'Functions', content: utils?.utilCode },
        { label: 'Types', content: utils?.typesCode },
        { label: 'Examples', content: utils?.exampleUsage },
        { label: 'Tests', content: utils?.testFile },
      ]}
    />
  );
}

/**
 * Query Generator Example
 */
function QueryGeneratorExample() {
  const { query, loading, error, generate } = useQueryGenerator();
  const [input, setInput] = useState('');

  const examples = [
    {
      name: 'useGetUsers',
      desc: 'A React Query hook for fetching users from GET /api/users with pagination',
    },
    {
      name: 'useCreateUser',
      desc: 'A mutation hook for creating a user via POST /api/users',
    },
    {
      name: 'useUpdateUser',
      desc: 'A mutation hook for updating user via PUT /api/users/:id',
    },
  ];

  return (
    <GeneratorTemplate
      title="Query Generator"
      description="Create React Query hooks and API clients"
      icon="📡"
      input={input}
      setInput={setInput}
      loading={loading}
      error={error}
      output={query}
      onGenerate={() => generate('Query', input || examples[0].desc)}
      examples={examples}
      onExampleClick={(example) => {
        setInput(example.desc);
        generate(example.name, example.desc);
      }}
      outputSections={[
        { label: 'Query Hook', content: query?.queryCode },
        { label: 'API Client', content: query?.apiClientCode },
        { label: 'Types', content: query?.typesFile },
        { label: 'Example', content: query?.exampleUsage },
        { label: 'Tests', content: query?.testFile },
      ]}
    />
  );
}

/**
 * Reusable generator template component
 */
interface GeneratorTemplateProps {
  title: string;
  description: string;
  icon: string;
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: Error | null;
  output: any;
  onGenerate: () => void;
  examples: Array<{ name: string; desc: string; multiple?: boolean }>;
  onExampleClick: (example: { name: string; desc: string; multiple?: boolean }) => void;
  outputSections: Array<{ label: string; content?: string }>;
}

function GeneratorTemplate({
  title,
  description,
  icon,
  input,
  setInput,
  loading,
  error,
  output,
  onGenerate,
  examples,
  onExampleClick,
  outputSections,
}: GeneratorTemplateProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          {icon} {title}
        </h2>
        <p className="text-gray-600 mb-6">{description}</p>

        <label className="block text-sm font-semibold mb-2">Describe what you want:</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={examples[0].desc}
          className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none resize-none mb-4 font-mono text-sm"
        />

        <button
          onClick={onGenerate}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all mb-4 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? '🔄 Generating...' : '✨ Generate'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg mb-4">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        <div className="border-t-2 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">📚 Quick Examples:</p>
          <div className="space-y-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => onExampleClick(example)}
                className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
              >
                <p className="font-semibold text-blue-900">{example.name}</p>
                <p className="text-xs text-blue-700 line-clamp-2">{example.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {output ? (
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-600">✅ Generated Successfully!</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {outputSections
                .filter((s) => s.content)
                .map((section, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-semibold text-gray-800 mb-2">{section.label}</p>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto text-gray-800">
                      {section.content?.substring(0, 400)}...
                    </pre>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">👉</div>
            <p className="text-lg">Generate code to see output here</p>
          </div>
        )}
      </div>
    </div>
  );
}
