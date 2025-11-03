import React, { useState } from 'react';
import { usePromptTemplate, PromptEditor } from '@weaveai/react';

export const BasicPromptTemplateExample = () => {
  const { currentTemplate, render, testRender, setTemplate, updateVariable, getVariables } =
    usePromptTemplate({
      name: 'article-writer',
      template: 'Write a {{wordCount}} word article about {{topic}} for {{audience}}.',
      variables: [
        {
          name: 'wordCount',
          type: 'string',
          required: true,
          placeholder: '500',
          description: 'Desired word count',
        },
        {
          name: 'topic',
          type: 'string',
          required: true,
          placeholder: 'Machine Learning',
          description: 'Article topic',
        },
        {
          name: 'audience',
          type: 'string',
          required: true,
          placeholder: 'Beginners',
          description: 'Target audience',
        },
      ],
      editable: true,
      trackMetrics: true,
    });

  const handleTest = async (variables: Record<string, any>) => {
    return testRender(variables);
  };

  return (
    <div>
      <PromptEditor
        template={currentTemplate}
        variables={currentTemplate.variables}
        onChange={(template) => setTemplate(template)}
        onTest={handleTest}
        testData={{
          wordCount: '500',
          topic: 'Machine Learning',
          audience: 'Beginners',
        }}
        editable={true}
        showVariables={true}
      />
    </div>
  );
};

export const PromptTemplateWithVariantsExample = () => {
  const { currentTemplate, currentVariant, variants, setVariant, testRender, compareVariants } =
    usePromptTemplate({
      name: 'email-generator',
      template: 'Draft a professional email to {{recipient}} about {{subject}}.',
      variants: [
        {
          id: 'formal',
          name: 'Formal',
          template:
            'Please prepare a formal email correspondence to {{recipient}} regarding {{subject}}.',
        },
        {
          id: 'casual',
          name: 'Casual',
          template: 'Write a friendly email to {{recipient}} about {{subject}}.',
        },
        {
          id: 'urgent',
          name: 'Urgent',
          template: 'Compose an urgent email to {{recipient}} concerning {{subject}}.',
        },
      ],
      trackMetrics: true,
    });

  const handleVariantTest = async (variantId: string) => {
    setVariant(variantId);
    const result = await testRender({
      recipient: 'John Doe',
      subject: 'Q4 Project Review',
    });
    return result;
  };

  const comparison = compareVariants(['formal', 'casual', 'urgent']);

  return (
    <div>
      <h3>Email Generator - A/B Testing</h3>
      <div style={{ marginBottom: '20px' }}>
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => handleVariantTest(variant.id)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              backgroundColor: currentVariant?.id === variant.id ? '#3b82f6' : '#e5e7eb',
              color: currentVariant?.id === variant.id ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {variant.name}
          </button>
        ))}
      </div>

      {currentVariant && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <p>
            <strong>Current Variant:</strong> {currentVariant.name}
          </p>
          <p>
            <strong>Template:</strong> {currentVariant.template}
          </p>
        </div>
      )}

      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <h4>Variant Comparison</h4>
        {comparison.variants.map((v) => (
          <div key={v.id} style={{ marginBottom: '12px' }}>
            <p>
              <strong>{v.name}</strong>
              {v.winner && ' ⭐ (Winner)'}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              Runs: {v.metrics.totalRuns} | Success Rate: {(v.metrics.successRate || 0).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PromptTemplatePersistenceExample = () => {
  const [savedId, setSavedId] = useState<string | null>(null);

  const {
    currentTemplate,
    setTemplate,
    testRender,
    save,
    load,
    export: exportTemplate,
    import: importTemplate,
  } = usePromptTemplate({
    name: 'blog-generator',
    template: 'Generate a blog post about {{topic}} in {{style}} style.',
    variables: [
      { name: 'topic', required: true, placeholder: 'Tech Innovation' },
      { name: 'style', required: true, placeholder: 'Informative' },
    ],
    persistToLocalStorage: true,
    storageKey: 'blog-generator-template',
  });

  const handleSave = async () => {
    await save();
    setSavedId(currentTemplate.id);
  };

  const handleExport = () => {
    const json = exportTemplate();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt-template.json';
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          importTemplate(json);
        } catch (error) {
          console.error('Import failed:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h3>Blog Generator - Persistence</h3>

      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={currentTemplate.template}
          onChange={(e) => setTemplate(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '8px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          💾 Save
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          📥 Export
        </button>
        <label
          style={{
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          📤 Import
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>

      {savedId && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#d1fae5',
            borderRadius: '4px',
            color: '#065f46',
          }}
        >
          ✅ Template saved locally (ID: {savedId})
        </div>
      )}
    </div>
  );
};

export const PromptTemplateValidationExample = () => {
  const { currentTemplate, testRender, validateTemplate, validateVariables } = usePromptTemplate({
    name: 'form-generator',
    template: 'Generate a {{type}} form with {{fieldCount}} fields.',
    variables: [
      {
        name: 'type',
        type: 'string',
        required: true,
        validation: (value) => {
          const valid = ['contact', 'registration', 'survey'].includes(value);
          return valid || 'Must be: contact, registration, or survey';
        },
      },
      {
        name: 'fieldCount',
        type: 'number',
        required: true,
        validation: (value) => {
          const num = Number(value);
          return (num > 0 && num <= 20) || 'Must be between 1 and 20';
        },
      },
    ],
  });

  const handleValidateAll = () => {
    const templateValid = validateTemplate();
    const variablesValid = validateVariables({
      type: 'contact',
      fieldCount: 5,
    });

    console.log('Template validation:', templateValid);
    console.log('Variables validation:', variablesValid);
  };

  return (
    <div>
      <h3>Form Generator - Validation</h3>

      <button
        onClick={handleValidateAll}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ✓ Validate
      </button>

      <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
        <p>
          <strong>Template:</strong> {currentTemplate.template}
        </p>
        <p>
          <strong>Variables:</strong> {currentTemplate.variables.map((v) => v.name).join(', ')}
        </p>
      </div>
    </div>
  );
};
