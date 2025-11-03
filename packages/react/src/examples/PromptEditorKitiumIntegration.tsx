/**
 * PromptEditor + Kitium-UI Integration Examples
 * Shows how to use PromptEditor with KtButton, KtInput, KtCard, and KtLayout
 */

import React, { useState } from 'react';
import { PromptEditor } from '../components/PromptEditor';
import { usePromptTemplate } from '../hooks/use-prompt-template';
import { KtButton, KtCard, KtInput, KtTabs, KtAlert, KtLayout, KtPanel } from '@kitium/ui';

/**
 * Example 1: Basic Integration with KtButton and KtCard
 * Shows PromptEditor wrapped in kitium-ui components
 */
export function PromptEditorBasicIntegration() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { templates, currentTemplate, render, setTemplate } = usePromptTemplate({
    name: 'article-writer',
    editable: true,
    variants: [
      { id: 'v1', template: 'Write an article about {{topic}}' },
      { id: 'v2', template: 'Create content for {{topic}}' },
    ],
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Template saved:', currentTemplate);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KtLayout direction="vertical" gap="lg">
      <KtCard header="Prompt Template Editor" variant="elevated">
        <KtLayout direction="vertical" gap="md">
          <PromptEditor
            template={currentTemplate}
            variables={[{ name: 'topic', required: true, description: 'Article topic' }]}
            onChange={setTemplate}
            onTest={(result) => console.log('Test result:', result)}
          />

          <KtLayout direction="horizontal" gap="sm">
            <KtButton variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Template'}
            </KtButton>
            <KtButton variant="secondary">Cancel</KtButton>
          </KtLayout>
        </KtLayout>
      </KtCard>
    </KtLayout>
  );
}

/**
 * Example 2: Advanced Layout with Multiple Templates
 * Shows tabbed interface with kitium-ui tabs
 */
export function PromptEditorAdvancedLayout() {
  const blogTemplate = usePromptTemplate({
    name: 'blog-post',
    editable: true,
    variants: [
      {
        id: 'blog-v1',
        template: `Write a blog post about {{topic}} with {{word_count}} words`,
      },
      {
        id: 'blog-v2',
        template: `Create an engaging blog post covering {{topic}} in {{style}} style`,
      },
    ],
  });

  const emailTemplate = usePromptTemplate({
    name: 'email-template',
    editable: true,
    variants: [
      { id: 'email-v1', template: 'Write an email to {{recipient}} about {{subject}}' },
      { id: 'email-v2', template: 'Create a professional email regarding {{subject}}' },
    ],
  });

  const socialTemplate = usePromptTemplate({
    name: 'social-post',
    editable: true,
    variants: [
      { id: 'social-v1', template: 'Write a {{platform}} post about {{topic}}' },
      { id: 'social-v2', template: 'Create viral {{platform}} content for {{topic}}' },
    ],
  });

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Prompt Template Manager</h1>

        <KtTabs
          tabs={[
            {
              id: 'blog',
              label: 'Blog Posts',
              content: (
                <KtCard>
                  <PromptEditor
                    template={blogTemplate.currentTemplate}
                    variables={[
                      { name: 'topic', required: true },
                      { name: 'word_count', type: 'number' },
                      { name: 'style', description: 'Writing style' },
                    ]}
                    onChange={blogTemplate.setTemplate}
                  />
                </KtCard>
              ),
            },
            {
              id: 'email',
              label: 'Email Templates',
              content: (
                <KtCard>
                  <PromptEditor
                    template={emailTemplate.currentTemplate}
                    variables={[
                      { name: 'recipient', required: true },
                      { name: 'subject', required: true },
                    ]}
                    onChange={emailTemplate.setTemplate}
                  />
                </KtCard>
              ),
            },
            {
              id: 'social',
              label: 'Social Posts',
              content: (
                <KtCard>
                  <PromptEditor
                    template={socialTemplate.currentTemplate}
                    variables={[
                      { name: 'platform', required: true },
                      { name: 'topic', required: true },
                    ]}
                    onChange={socialTemplate.setTemplate}
                  />
                </KtCard>
              ),
            },
          ]}
        />
      </KtLayout>
    </KtPanel>
  );
}

/**
 * Example 3: Form-based Template Editor
 * Uses KtInput and KtButton for better form integration
 */
export function PromptEditorFormIntegration() {
  const [templateName, setTemplateName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templateText, setTemplateText] = useState('');
  const [variables, setVariables] = useState<Array<{ name: string; required: boolean }>>([]);

  const { currentTemplate, setTemplate } = usePromptTemplate({
    name: templateName || 'untitled',
    editable: true,
  });

  const handleAddVariable = (varName: string) => {
    if (!varName.trim()) {
      return;
    }
    setVariables([...variables, { name: varName, required: false }]);
  };

  return (
    <KtLayout direction="vertical" gap="lg">
      <KtCard header="Create New Template" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          {/* Template Name Input */}
          <KtInput
            label="Template Name"
            placeholder="e.g., Article Writer"
            value={templateName}
            onChangeText={setTemplateName}
            type="text"
          />

          {/* Template Text Textarea (using PromptEditor) */}
          <div>
            <label className="form-label">Template Text</label>
            <PromptEditor template={currentTemplate} variables={variables} onChange={setTemplate} />
          </div>

          {/* Variables Section */}
          <KtCard header="Variables" variant="outlined">
            <KtLayout direction="vertical" gap="sm">
              <KtLayout direction="horizontal" gap="sm">
                <KtInput
                  label="Variable Name"
                  placeholder="e.g., topic"
                  type="text"
                  id="var-input"
                />
                <KtButton
                  variant="secondary"
                  onClick={() => {
                    const input = document.getElementById('var-input') as HTMLInputElement;
                    if (input) {
                      handleAddVariable(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Add Variable
                </KtButton>
              </KtLayout>

              {variables.length > 0 && (
                <div className="variables-list">
                  {variables.map((v) => (
                    <KtAlert key={v.name} variant="info">
                      {v.name}
                    </KtAlert>
                  ))}
                </div>
              )}
            </KtLayout>
          </KtCard>

          {/* Action Buttons */}
          <KtLayout direction="horizontal" gap="sm" justifyContent="flex-end">
            <KtButton variant="secondary">Cancel</KtButton>
            <KtButton variant="primary">Save Template</KtButton>
          </KtLayout>
        </KtLayout>
      </KtCard>
    </KtLayout>
  );
}

/**
 * Example 4: Template Library with Kitium-UI
 * Shows multiple templates in a card grid
 */
export function PromptEditorTemplateLibrary() {
  const templates = [
    {
      id: 'article',
      name: 'Article Writer',
      description: 'Write articles on any topic',
      template: 'Write an article about {{topic}} in {{style}} style',
      variables: ['topic', 'style'],
    },
    {
      id: 'email',
      name: 'Email Generator',
      description: 'Professional email templates',
      template: 'Write an email to {{recipient}} about {{subject}}',
      variables: ['recipient', 'subject'],
    },
    {
      id: 'social',
      name: 'Social Media Posts',
      description: 'Create viral social media content',
      template: 'Write a {{platform}} post about {{topic}} for {{audience}}',
      variables: ['platform', 'topic', 'audience'],
    },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentTemplate, setTemplate } = usePromptTemplate({
    name: selectedTemplate.name,
    editable: true,
  });

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Template Library</h1>

        <KtLayout direction="horizontal" gap="md">
          {/* Template List */}
          <KtLayout direction="vertical" gap="sm" style={{ flex: '0 0 300px' }}>
            {templates.map((template) => (
              <KtCard
                key={template.id}
                variant={selectedTemplate.id === template.id ? 'elevated' : 'outlined'}
                onClick={() => setSelectedTemplate(template)}
                style={{ cursor: 'pointer' }}
              >
                <KtLayout direction="vertical" gap="xs">
                  <h3>{template.name}</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{template.description}</p>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    {template.variables.join(', ')}
                  </div>
                </KtLayout>
              </KtCard>
            ))}
          </KtLayout>

          {/* Template Editor */}
          <div style={{ flex: 1 }}>
            <KtCard header={selectedTemplate.name}>
              <PromptEditor
                template={selectedTemplate.template}
                variables={selectedTemplate.variables.map((v) => ({
                  name: v,
                  required: true,
                }))}
                onChange={(newTemplate) => {
                  console.log('Template updated:', newTemplate);
                  setTemplate(newTemplate);
                }}
              />
            </KtCard>
          </div>
        </KtLayout>
      </KtLayout>
    </KtPanel>
  );
}

/**
 * Example 5: Complete Management Dashboard
 * Full-featured template management with kitium-ui components
 */
export function PromptEditorDashboard() {
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'create'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = [
    {
      id: 'article',
      name: 'Article Writer',
      template: 'Write an article about {{topic}}',
      created: '2025-11-01',
    },
    {
      id: 'email',
      name: 'Email Template',
      template: 'Write an email to {{recipient}}',
      created: '2025-10-28',
    },
  ];

  const selected = templates.find((t) => t.id === selectedId);
  const { currentTemplate, setTemplate, exportTemplate } = usePromptTemplate({
    name: selected?.name || 'new-template',
  });

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
          <h1>Prompt Templates</h1>
          <KtButton variant="primary" onClick={() => setActiveTab('create')}>
            + New Template
          </KtButton>
        </KtLayout>

        {activeTab === 'list' && (
          <KtLayout direction="vertical" gap="md">
            {templates.map((template) => (
              <KtCard
                key={template.id}
                variant="outlined"
                header={template.name}
                onClick={() => {
                  setSelectedId(template.id);
                  setActiveTab('edit');
                }}
              >
                <KtLayout direction="vertical" gap="sm">
                  <p>{template.template}</p>
                  <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                    Created: {template.created}
                  </div>
                  <KtButton
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(template.id);
                      setActiveTab('edit');
                    }}
                  >
                    Edit
                  </KtButton>
                </KtLayout>
              </KtCard>
            ))}
          </KtLayout>
        )}

        {activeTab === 'edit' && selected && (
          <KtCard header={`Edit: ${selected.name}`}>
            <KtLayout direction="vertical" gap="md">
              <PromptEditor
                template={currentTemplate}
                variables={[
                  { name: 'topic', required: true },
                  { name: 'style', description: 'Writing style' },
                ]}
                onChange={setTemplate}
              />

              <KtLayout direction="horizontal" gap="sm">
                <KtButton
                  variant="secondary"
                  onClick={() => {
                    setActiveTab('list');
                    setSelectedId(null);
                  }}
                >
                  Back
                </KtButton>
                <KtButton
                  variant="primary"
                  onClick={() => {
                    console.log('Template exported:', exportTemplate());
                  }}
                >
                  Save & Export
                </KtButton>
              </KtLayout>
            </KtLayout>
          </KtCard>
        )}

        {activeTab === 'create' && (
          <KtCard header="Create New Template">
            <KtLayout direction="vertical" gap="md">
              <KtInput label="Template Name" placeholder="e.g., My New Template" type="text" />

              <PromptEditor
                template=""
                variables={[]}
                onChange={(t) => console.log('New template:', t)}
              />

              <KtLayout direction="horizontal" gap="sm">
                <KtButton variant="secondary" onClick={() => setActiveTab('list')}>
                  Cancel
                </KtButton>
                <KtButton variant="primary">Create Template</KtButton>
              </KtLayout>
            </KtLayout>
          </KtCard>
        )}
      </KtLayout>
    </KtPanel>
  );
}

export default {
  PromptEditorBasicIntegration,
  PromptEditorAdvancedLayout,
  PromptEditorFormIntegration,
  PromptEditorTemplateLibrary,
  PromptEditorDashboard,
};
