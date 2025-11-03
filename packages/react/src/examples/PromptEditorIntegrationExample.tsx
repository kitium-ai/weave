import React, { useState } from 'react';
import { usePromptTemplate, PromptEditor } from '@weaveai/react';

export const PromptEditorBasicExample = () => {
  const {
    currentTemplate,
    setTemplate,
    testRender,
  } = usePromptTemplate({
    name: 'content-writer',
    template: 'Write about {{topic}} in {{tone}} style for {{audience}}.',
    variables: [
      {
        name: 'topic',
        type: 'string',
        required: true,
        placeholder: 'Artificial Intelligence',
        description: 'Main topic to write about',
      },
      {
        name: 'tone',
        type: 'string',
        required: true,
        placeholder: 'Professional',
        description: 'Writing tone/style',
      },
      {
        name: 'audience',
        type: 'string',
        required: true,
        placeholder: 'Tech professionals',
        description: 'Target audience',
      },
    ],
    editable: true,
  });

  return (
    <PromptEditor
      template={currentTemplate}
      variables={currentTemplate.variables}
      onChange={(template) => setTemplate(template)}
      onTest={testRender}
      testData={{
        topic: 'Artificial Intelligence',
        tone: 'Professional',
        audience: 'Tech professionals',
      }}
      editable={true}
      showVariables={true}
    />
  );
};

export const PromptEditorWithMetricsExample = () => {
  const {
    currentTemplate,
    metrics,
    setTemplate,
    testRender,
  } = usePromptTemplate({
    name: 'code-generator',
    template:
      'Generate {{language}} code to {{task}} with error handling and comments.',
    variables: [
      {
        name: 'language',
        type: 'string',
        required: true,
        placeholder: 'TypeScript',
      },
      {
        name: 'task',
        type: 'string',
        required: true,
        placeholder: 'fetch and parse JSON data',
      },
    ],
    trackMetrics: true,
  });

  return (
    <div>
      <PromptEditor
        template={currentTemplate}
        variables={currentTemplate.variables}
        onChange={(template) => setTemplate(template)}
        onTest={testRender}
        showVariables={true}
        showMetrics={true}
      />

      {metrics && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
          }}
        >
          <h4>Performance Metrics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                Total Runs
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {metrics.totalRuns}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                Success Rate
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {(metrics.successRate || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                Avg Response Time
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {(metrics.avgResponseTime || 0).toFixed(0)}ms
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                Errors
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {metrics.errors || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PromptEditorWithVariantsExample = () => {
  const {
    currentTemplate,
    variants,
    currentVariant,
    setTemplate,
    setVariant,
    testRender,
    compareVariants,
  } = usePromptTemplate({
    name: 'email-campaign',
    template:
      'Create an email subject line for {{product}} targeting {{segment}}.',
    variants: [
      {
        id: 'v1-urgent',
        name: '🔔 Urgent',
        template:
          'Create an URGENT email subject for {{product}} targeting {{segment}} - emphasize limited time.',
      },
      {
        id: 'v2-benefit',
        name: '⭐ Benefit-focused',
        template:
          'Create an email subject highlighting benefits of {{product}} for {{segment}}.',
      },
      {
        id: 'v3-curiosity',
        name: '❓ Curiosity',
        template:
          'Create a curious/intriguing email subject about {{product}} for {{segment}}.',
      },
    ],
    trackMetrics: true,
  });

  const comparison = compareVariants(variants.map((v) => v.id));

  const handleSelectVariant = (variantId: string) => {
    setVariant(variantId);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h4>Variant Selection</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => handleSelectVariant(variant.id)}
              style={{
                padding: '10px 16px',
                backgroundColor:
                  currentVariant?.id === variant.id ? '#3b82f6' : '#e5e7eb',
                color: currentVariant?.id === variant.id ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {variant.name}
            </button>
          ))}
        </div>
      </div>

      <PromptEditor
        template={currentVariant ? currentVariant.template : currentTemplate}
        variables={currentTemplate.variables}
        onChange={(template) => setTemplate(template)}
        onTest={testRender}
        testData={{
          product: 'Premium Analytics',
          segment: 'E-commerce businesses',
        }}
        showVariables={true}
      />

      {comparison.bestVariant && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            ⭐ Best Performer: {comparison.variants.find((v) => v.winner)?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export const PromptEditorWithSaveExample = () => {
  const [saveStatus, setSaveStatus] = useState<string>('');

  const {
    currentTemplate,
    setTemplate,
    testRender,
    save,
  } = usePromptTemplate({
    name: 'documentation-generator',
    template:
      'Generate documentation for {{component}} component with {{detailLevel}} detail.',
    variables: [
      {
        name: 'component',
        type: 'string',
        required: true,
        placeholder: 'Button',
      },
      {
        name: 'detailLevel',
        type: 'string',
        required: true,
        placeholder: 'Comprehensive',
      },
    ],
    persistToLocalStorage: true,
  });

  const handleSave = async () => {
    try {
      setSaveStatus('Saving...');
      await save();
      setSaveStatus('✅ Saved successfully');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('❌ Save failed');
    }
  };

  return (
    <div>
      <PromptEditor
        template={currentTemplate}
        variables={currentTemplate.variables}
        onChange={(template) => setTemplate(template)}
        onTest={testRender}
        onSave={handleSave}
        showVariables={true}
      />

      {saveStatus && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor:
              saveStatus.includes('✅') ? '#d1fae5' : '#fee2e2',
            color: saveStatus.includes('✅') ? '#065f46' : '#991b1b',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {saveStatus}
        </div>
      )}
    </div>
  );
};

export const PromptEditorComplexFlowExample = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'test' | 'results'>(
    'edit'
  );

  const {
    currentTemplate,
    variants,
    metrics,
    setTemplate,
    setVariant,
    testRender,
  } = usePromptTemplate({
    name: 'social-media-post',
    template:
      'Create a {{platform}} post about {{topic}} that emphasizes {{angle}}.',
    variables: [
      {
        name: 'platform',
        type: 'string',
        required: true,
        placeholder: 'LinkedIn',
      },
      {
        name: 'topic',
        type: 'string',
        required: true,
        placeholder: 'Web Development',
      },
      {
        name: 'angle',
        type: 'string',
        required: true,
        placeholder: 'Best Practices',
      },
    ],
    variants: [
      {
        id: 'engaging',
        name: 'Engaging',
        template:
          'Create an ENGAGING {{platform}} post about {{topic}} with {{angle}} - make it viral.',
      },
      {
        id: 'professional',
        name: 'Professional',
        template:
          'Create a professional {{platform}} post about {{topic}} highlighting {{angle}}.',
      },
    ],
    trackMetrics: true,
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        {(['edit', 'test', 'results'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'edit' && (
        <PromptEditor
          template={currentTemplate}
          variables={currentTemplate.variables}
          onChange={(template) => setTemplate(template)}
          variants={variants}
          onVariantChange={setVariant}
          showVariables={true}
        />
      )}

      {activeTab === 'test' && (
        <PromptEditor
          template={currentTemplate}
          variables={currentTemplate.variables}
          onTest={testRender}
          testData={{
            platform: 'LinkedIn',
            topic: 'Web Development',
            angle: 'Performance Optimization',
          }}
          showVariables={true}
        />
      )}

      {activeTab === 'results' && metrics && (
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <h3>Performance Results</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                Total Runs
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {metrics.totalRuns}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                Success Rate
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {(metrics.successRate || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                Avg Time
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {(metrics.avgResponseTime || 0).toFixed(0)}ms
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                Errors
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {metrics.errors || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
