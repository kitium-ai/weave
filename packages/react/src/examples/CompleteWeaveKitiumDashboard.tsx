/**
 * Complete Weave + Kitium-UI Integration Dashboard
 * Full-featured example combining PromptEditor, ProviderSwitch, and CacheFeedback
 * with comprehensive kitium-ui components
 */

import React, { useState } from 'react';
import { PromptEditor } from '../components/PromptEditor';
import { ProviderSwitch, ProviderStatusIndicator } from '../components/ProviderSwitch';
import { CacheFeedback, CacheBadge } from '../components/CacheFeedback';
import { usePromptTemplate } from '../hooks/use-prompt-template';
import { useProviderRouting } from '../hooks/useProviderRouting';
import { useCache } from '../hooks/useCache';
import {
  KtButton,
  KtCard,
  KtLayout,
  KtPanel,
  KtTabs,
  KtBadge,
  KtAlert,
  KtInput,
} from '@kitium/ui';

/**
 * Main Application Dashboard
 * Integrates prompt management, provider selection, and caching
 */
export function WeaveKitiumDashboard() {
  // Hooks
  const promptTemplate = usePromptTemplate({
    name: 'main-template',
    editable: true,
    variants: [
      { id: 'v1', template: 'Write about {{topic}} in {{style}} style' },
      { id: 'v2', template: 'Create content for {{audience}} about {{topic}}' },
    ],
  });

  const { providers, currentProvider, selectProvider } = useProviderRouting();
  const { queryCache, storeInCache, statistics } = useCache();

  // Local state
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'settings'>('compose');
  const [topicInput, setTopicInput] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      prompt: string;
      provider: string;
      cached: boolean;
      content: string;
      timestamp: Date;
    }>
  >([]);

  // Handle content generation
  const handleGenerate = async () => {
    if (!topicInput.trim()) {
      alert('Please enter a topic');
      return;
    }

    const cacheKey = `${topicInput}:${styleInput}:${currentProvider?.id}`;
    const cached = queryCache(cacheKey);

    setIsGenerating(true);
    try {
      let content: string;
      let wasCached = false;

      if (cached) {
        content = cached.result;
        wasCached = true;
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        content = `# ${topicInput.toUpperCase()}\n\nGenerated content in ${styleInput || 'default'} style using ${currentProvider?.name || 'selected'} provider.`;
        storeInCache(cacheKey, content);
      }

      setGeneratedContent(content);

      // Add to history
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          prompt: `Topic: ${topicInput}, Style: ${styleInput}`,
          provider: currentProvider?.name || 'Unknown',
          cached: wasCached,
          content,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        {/* Header */}
        <KtLayout direction="horizontal" gap="md" justifyContent="space-between" alignItems="center">
          <h1>Weave AI Dashboard</h1>
          <KtLayout direction="horizontal" gap="sm">
            <KtBadge variant="info">Provider: {currentProvider?.name || 'None'}</KtBadge>
            <KtBadge variant="success">
              Cache Hit Rate: {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
            </KtBadge>
          </KtLayout>
        </KtLayout>

        {/* Main Content Tabs */}
        <KtTabs
          tabs={[
            {
              id: 'compose',
              label: '✍️ Compose',
              content: <ComposeTab {...{ topicInput, styleInput, setTopicInput, setStyleInput, handleGenerate, isGenerating, generatedContent, promptTemplate, currentProvider, selectProvider, providers }} />,
            },
            {
              id: 'history',
              label: '📜 History',
              content: <HistoryTab {...{ history }} />,
            },
            {
              id: 'settings',
              label: '⚙️ Settings',
              content: <SettingsTab {...{ providers, currentProvider, selectProvider, statistics }} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Footer Stats */}
        <KtCard header="Dashboard Statistics" variant="outlined">
          <KtLayout direction="horizontal" gap="lg" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="stat-label">Total Requests</div>
              <div className="stat-value">{history.length}</div>
            </div>
            <div>
              <div className="stat-label">Cached Requests</div>
              <div className="stat-value">
                {history.filter((h) => h.cached).length}
              </div>
            </div>
            <div>
              <div className="stat-label">Avg Generation Time</div>
              <div className="stat-value">~1.2s</div>
            </div>
            <div>
              <div className="stat-label">Cost Savings</div>
              <div className="stat-value">
                ${statistics.totalSavings?.toFixed(2) ?? '0.00'}
              </div>
            </div>
          </KtLayout>
        </KtCard>
      </KtLayout>

      <style>{`
        .stat-label {
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
        }
      `}</style>
    </KtPanel>
  );
}

/**
 * Compose Tab
 * Main content generation interface
 */
function ComposeTab({
  topicInput,
  styleInput,
  setTopicInput,
  setStyleInput,
  handleGenerate,
  isGenerating,
  generatedContent,
  promptTemplate,
  currentProvider,
  selectProvider,
  providers,
}: any) {
  return (
    <KtLayout direction="vertical" gap="lg">
      {/* Provider Selection */}
      <KtCard header="Select AI Provider" variant="outlined">
        <KtLayout direction="horizontal" gap="sm" style={{ flexWrap: 'wrap' }}>
          {providers.map((provider) => (
            <KtCard
              key={provider.id}
              variant={currentProvider?.id === provider.id ? 'elevated' : 'outlined'}
              onClick={() => selectProvider(provider.id)}
              style={{
                cursor: 'pointer',
                flex: '1 1 calc(33.333% - 8px)',
                minWidth: '150px',
              }}
            >
              <KtLayout direction="vertical" gap="sm">
                <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
                  <strong>{provider.name}</strong>
                  {currentProvider?.id === provider.id && (
                    <KtBadge variant="success">✓</KtBadge>
                  )}
                </KtLayout>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {provider.status === 'healthy' ? '🟢 Healthy' : '🔴 Offline'}
                </div>
                <KtButton
                  size="sm"
                  variant={currentProvider?.id === provider.id ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => selectProvider(provider.id)}
                >
                  {currentProvider?.id === provider.id ? 'Active' : 'Select'}
                </KtButton>
              </KtLayout>
            </KtCard>
          ))}
        </KtLayout>
      </KtCard>

      {/* Prompt Template Editor */}
      <KtCard header="Prompt Template" variant="elevated">
        <KtLayout direction="vertical" gap="md">
          <PromptEditor
            template={promptTemplate.currentTemplate}
            variables={[
              { name: 'topic', required: true, description: 'Main topic for content' },
              { name: 'style', description: 'Writing style (e.g., professional, casual)' },
            ]}
            onChange={promptTemplate.setTemplate}
          />
        </KtLayout>
      </KtCard>

      {/* Input Form */}
      <KtCard header="Content Parameters" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          <KtInput
            label="Topic"
            placeholder="What should the content be about?"
            value={topicInput}
            onChangeText={setTopicInput}
            type="text"
          />

          <KtInput
            label="Style (optional)"
            placeholder="e.g., professional, casual, academic"
            value={styleInput}
            onChangeText={setStyleInput}
            type="text"
          />

          <KtButton
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !topicInput.trim()}
            fullWidth
          >
            {isGenerating ? '⏳ Generating...' : '🚀 Generate Content'}
          </KtButton>
        </KtLayout>
      </KtCard>

      {/* Generated Content */}
      {generatedContent && (
        <KtCard
          header={
            <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
              <span>Generated Content</span>
              <CacheBadge cached={false} size="small" />
            </KtLayout>
          }
          variant="elevated"
        >
          <div
            style={{
              backgroundColor: 'var(--kt-surface-secondary)',
              padding: '1rem',
              borderRadius: '0.375rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {generatedContent}
          </div>

          <KtLayout direction="horizontal" gap="sm" style={{ marginTop: '1rem' }}>
            <KtButton
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(generatedContent)}
            >
              📋 Copy
            </KtButton>
            <KtButton variant="secondary">
              ↓ Download
            </KtButton>
            <KtButton variant="secondary">
              🔄 Regenerate
            </KtButton>
          </KtLayout>
        </KtCard>
      )}
    </KtLayout>
  );
}

/**
 * History Tab
 * Shows previous generations
 */
function HistoryTab({ history }: any) {
  return (
    <KtLayout direction="vertical" gap="md">
      {history.length > 0 ? (
        history.map((item) => (
          <KtCard
            key={item.id}
            header={
              <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
                <div>
                  <strong>{item.prompt.substring(0, 50)}...</strong>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {item.timestamp.toLocaleString()}
                  </div>
                </div>
                <KtLayout direction="horizontal" gap="sm">
                  <KtBadge variant="info">{item.provider}</KtBadge>
                  <CacheBadge cached={item.cached} size="small" />
                </KtLayout>
              </KtLayout>
            }
            variant="outlined"
          >
            <div
              style={{
                backgroundColor: 'var(--kt-surface-secondary)',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                maxHeight: '150px',
                overflowY: 'auto',
              }}
            >
              {item.content.substring(0, 200)}...
            </div>
            <KtLayout direction="horizontal" gap="sm" style={{ marginTop: '0.75rem' }}>
              <KtButton variant="secondary" size="sm">
                View
              </KtButton>
              <KtButton variant="secondary" size="sm">
                Edit
              </KtButton>
              <KtButton variant="secondary" size="sm">
                Delete
              </KtButton>
            </KtLayout>
          </KtCard>
        ))
      ) : (
        <KtAlert variant="info">
          No history yet. Generate some content to see it appear here.
        </KtAlert>
      )}
    </KtLayout>
  );
}

/**
 * Settings Tab
 * Configuration and statistics
 */
function SettingsTab({ providers, currentProvider, selectProvider, statistics }: any) {
  return (
    <KtLayout direction="vertical" gap="lg">
      {/* Provider Settings */}
      <KtCard header="Provider Configuration" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          {providers.map((provider) => (
            <KtLayout
              key={provider.id}
              direction="horizontal"
              gap="md"
              justifyContent="space-between"
              alignItems="center"
            >
              <div>
                <strong>{provider.name}</strong>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                  Status: {provider.status === 'healthy' ? '🟢 Healthy' : '🔴 Offline'}
                </div>
              </div>
              <KtButton
                variant={currentProvider?.id === provider.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => selectProvider(provider.id)}
              >
                {currentProvider?.id === provider.id ? 'Selected' : 'Select'}
              </KtButton>
            </KtLayout>
          ))}
        </KtLayout>
      </KtCard>

      {/* Cache Settings */}
      <KtCard header="Cache Performance" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          <div className="setting-group">
            <div className="setting-label">Cache Hit Rate</div>
            <div className="setting-value">
              {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">Total Requests</div>
            <div className="setting-value">
              {statistics.hits + statistics.misses}
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">Cost Savings</div>
            <div className="setting-value">
              ${statistics.totalSavings?.toFixed(2) ?? '0.00'}
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">Time Saved</div>
            <div className="setting-value">
              {statistics.timeSaved?.toFixed(1) ?? 0}s
            </div>
          </div>
        </KtLayout>
      </KtCard>

      {/* Preferences */}
      <KtCard header="Preferences" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" defaultChecked />
            <span>Enable cache</span>
          </label>

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" defaultChecked />
            <span>Show notifications</span>
          </label>

          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" />
            <span>Auto-refresh provider status</span>
          </label>
        </KtLayout>
      </KtCard>

      <style>{`
        .setting-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--kt-border-light);
        }
        .setting-group:last-child {
          border-bottom: none;
        }
        .setting-label {
          font-size: 0.875rem;
          opacity: 0.7;
        }
        .setting-value {
          font-weight: 600;
          font-size: 1.125rem;
        }
      `}</style>
    </KtLayout>
  );
}

export default {
  WeaveKitiumDashboard,
  ComposeTab,
  HistoryTab,
  SettingsTab,
};
