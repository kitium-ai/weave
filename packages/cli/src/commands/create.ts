/**
 * Create command
 * Interactive scaffolding for new Weave projects
 */

import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { validateProjectName, validateApiKey, checkDirectoryEmpty } from '../utils/validation.js';
import {
  generateEnvFile,
  generateEnvExampleFile,
  generateReadme,
  generateTsConfig,
  generateGitignore,
  getFrameworkInfo,
  getProviderInfo,
  getModelsByProvider,
  type WeaveConfig,
} from '../utils/config.js';

export async function createCommand() {
  console.log(chalk.cyan('? Select your preferences:\n'));

  // Step 1: Project Name
  const nameResult = await prompts({
    type: 'text',
    name: 'projectName',
    message: 'Project name',
    initial: 'my-weave-app',
    validate: (value: string) => {
      const validation = validateProjectName(value);
      return validation.valid || validation.message || 'Invalid project name';
    },
  });

  if (!nameResult.projectName) {
    throw new Error('Project name is required');
  }

  const projectPath = join(cwd(), nameResult.projectName);

  // Check if directory exists and is empty
  const dirCheck = await checkDirectoryEmpty(projectPath);
  if (dirCheck.exists && !dirCheck.isEmpty) {
    throw new Error(`Directory "${nameResult.projectName}" already exists and is not empty`);
  }

  // Step 2: Framework Selection
  const frameworkResult = await prompts({
    type: 'select',
    name: 'framework',
    message: 'Choose a framework',
    choices: [
      { title: 'React + Vite (recommended)', value: 'react-vite' },
      { title: 'React + Next.js', value: 'react-nextjs' },
      { title: 'Vue 3', value: 'vue' },
      { title: 'Svelte', value: 'svelte' },
      { title: 'Angular', value: 'angular' },
    ],
  });

  if (!frameworkResult.framework) {
    throw new Error('Framework selection is required');
  }

  // Step 3: Provider Selection
  const providerResult = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Choose an AI provider',
    choices: [
      {
        title: 'OpenAI (GPT-4, GPT-3.5)',
        value: 'openai',
        description: 'Most popular LLM provider',
      },
      {
        title: 'Anthropic (Claude 3)',
        value: 'anthropic',
        description: 'Advanced reasoning models',
      },
      {
        title: 'Google (Gemini)',
        value: 'google',
        description: 'Multimodal capabilities',
      },
    ],
  });

  if (!providerResult.provider) {
    throw new Error('Provider selection is required');
  }

  // Step 4: Model Selection
  const availableModels = getModelsByProvider(providerResult.provider);
  const modelResult = await prompts({
    type: 'select',
    name: 'model',
    message: `Choose a model (${providerResult.provider})`,
    choices: availableModels.map((model) => ({
      title: model,
      value: model,
    })),
  });

  if (!modelResult.model) {
    throw new Error('Model selection is required');
  }

  // Step 5: API Key (with option to skip)
  let apiKey = '';
  const apiKeyResult = await prompts({
    type: 'confirm',
    name: 'hasApiKey',
    message: 'Do you have an API key ready?',
    initial: false,
  });

  if (apiKeyResult.hasApiKey) {
    const keyInput = await prompts({
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${providerResult.provider} API key`,
      validate: (value) => {
        const validation = validateApiKey(providerResult.provider, value);
        return validation.valid || validation.message || 'Invalid API key format';
      },
    });

    if (!keyInput.apiKey) {
      console.log(chalk.yellow('⚠ Skipping API key setup (you can add it later in .env.local)'));
    } else {
      apiKey = keyInput.apiKey;
    }
  } else {
    console.log(chalk.yellow('ℹ You can add your API key later in .env.local'));
  }

  // Step 6: Confirmation
  const config: WeaveConfig = {
    projectName: nameResult.projectName,
    framework: frameworkResult.framework,
    provider: providerResult.provider,
    model: modelResult.model,
    apiKey: apiKey || 'PLACEHOLDER_API_KEY',
  };

  console.log('\n' + chalk.cyan('Summary of your choices:'));
  console.log(chalk.gray(`  Project: ${config.projectName}`));
  console.log(chalk.gray(`  Framework: ${getFrameworkInfo(config.framework).name}`));
  console.log(chalk.gray(`  Provider: ${getProviderInfo(config.provider).name}`));
  console.log(chalk.gray(`  Model: ${config.model}`));
  console.log(chalk.gray(`  API Key: ${apiKey ? '✓ Provided' : '⚠ Will add later'}`));

  const confirmResult = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: 'Create project with these settings?',
    initial: true,
  });

  if (!confirmResult.confirmed) {
    console.log(chalk.yellow('\nProject creation cancelled'));
    process.exit(0);
  }

  // Create project
  await scaffoldProject(config, projectPath);
}

/**
 * Scaffold the project with all necessary files
 */
async function scaffoldProject(config: WeaveConfig, projectPath: string) {
  const spinner = ora('Creating project structure...').start();

  try {
    // Create project directory
    await mkdir(projectPath, { recursive: true });

    // Create src directory
    const srcDir = join(projectPath, 'src');
    await mkdir(srcDir, { recursive: true });

    // Create pages/components directory based on framework
    if (config.framework === 'react-nextjs') {
      await mkdir(join(projectPath, 'src', 'pages'), { recursive: true });
      await mkdir(join(projectPath, 'src', 'pages', 'api'), { recursive: true });
    } else {
      await mkdir(join(srcDir, 'components'), { recursive: true });
    }

    // Create public directory
    await mkdir(join(projectPath, 'public'), { recursive: true });

    spinner.text = 'Generating configuration files...';

    // Generate .env files
    const envContent = generateEnvFile(config);
    const envPath = join(projectPath, '.env.local');
    await writeFile(envPath, envContent);

    const envExampleContent = generateEnvExampleFile();
    await writeFile(join(projectPath, '.env.example'), envExampleContent);

    spinner.text = 'Generating source files...';

    // Generate other config files
    await writeFile(join(projectPath, 'tsconfig.json'), generateTsConfig());
    await writeFile(join(projectPath, '.gitignore'), generateGitignore());
    await writeFile(join(projectPath, 'README.md'), generateReadme(config));

    // Create framework-specific files
    await createFrameworkFiles(config, projectPath, srcDir);

    spinner.succeed('Project created successfully!');

    // Display next steps
    console.log('\n' + chalk.cyan('Next steps:'));
    console.log(chalk.gray(`\n1. Navigate to project:`));
    console.log(chalk.white(`   cd ${config.projectName}`));

    console.log(chalk.gray(`\n2. If you didn't provide an API key, configure it now:`));
    console.log(chalk.white(`   Edit .env.local and add your API key`));

    console.log(chalk.gray(`\n3. Install dependencies:`));
    console.log(chalk.white(`   npm install`));

    console.log(chalk.gray(`\n4. Start development server:`));
    console.log(chalk.white(`   npm run dev`));

    console.log(chalk.cyan(`\nFor more information, visit: https://weave.ai/docs\n`));
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

/**
 * Create framework-specific boilerplate files
 */
async function createFrameworkFiles(config: WeaveConfig, projectPath: string, srcDir: string) {
  const frameworkContent = getFrameworkBoilerplate(config);

  // Write main app/index file based on framework
  if (config.framework === 'react-nextjs') {
    // Create pages/index.tsx for Next.js
    await writeFile(join(projectPath, 'src', 'pages', 'index.tsx'), frameworkContent.mainFile);

    // Create API route example
    await writeFile(
      join(projectPath, 'src', 'pages', 'api', 'chat.ts'),
      frameworkContent.apiFile || ''
    );
  } else if (config.framework === 'vue') {
    await writeFile(join(srcDir, 'App.vue'), frameworkContent.mainFile);
  } else if (config.framework === 'svelte') {
    await writeFile(join(srcDir, 'App.svelte'), frameworkContent.mainFile);
  } else if (config.framework === 'angular') {
    await writeFile(join(srcDir, 'app.component.ts'), frameworkContent.mainFile);
    await writeFile(join(srcDir, 'app.component.html'), frameworkContent.template || '');
  } else {
    // React Vite
    await writeFile(join(srcDir, 'App.tsx'), frameworkContent.mainFile);
  }

  // Write index/main file
  if (config.framework !== 'react-nextjs' && config.framework !== 'angular') {
    await writeFile(
      join(srcDir, config.framework === 'vue' ? 'main.ts' : 'main.tsx'),
      frameworkContent.indexFile
    );
  }

  // Write package.json for framework
  const packageJson = getFrameworkPackageJson(config);
  await writeFile(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
}

/**
 * Get framework-specific boilerplate
 */
function getFrameworkBoilerplate(config: WeaveConfig): Record<string, string> {
  const baseContent = {
    'react-vite': {
      mainFile: `import { useState } from 'react';
import { useWeave } from '@weaveai/react';
import './App.css';

function App() {
  const { generate, loading, error } = useWeave();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    const response = await generate(prompt);
    setResult(response.text);
  };

  return (
    <div className="App">
      <h1>🧵 Weave AI App</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {error && <p className="error">{error.message}</p>}
      {result && <p className="result">{result}</p>}
    </div>
  );
}

export default App;`,
      indexFile: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { WeaveProvider } from '@weaveai/react';
import App from './App.tsx';

const weaveConfig = {
  provider: {
    type: '${config.provider}',
    apiKey: import.meta.env.VITE_WEAVE_API_KEY,
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WeaveProvider config={weaveConfig}>
      <App />
    </WeaveProvider>
  </React.StrictMode>,
);`,
    },
    'react-nextjs': {
      mainFile: `'use client';

import { useState } from 'react';
import { useWeave } from '@weaveai/react';

export default function Home() {
  const { generate, loading, error } = useWeave();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    const response = await generate(prompt);
    setResult(response.text);
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🧵 Weave AI App</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {error && <p className="text-red-500 mt-4">{error.message}</p>}
      {result && <p className="mt-4 p-4 bg-gray-100 rounded">{result}</p>}
    </main>
  );
}`,
      apiFile: `import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeWeave } from '@weaveai/nextjs';

const weave = initializeWeave({
  provider: {
    type: '${config.provider}',
    apiKey: process.env.VITE_WEAVE_API_KEY,
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    const result = await weave.generate(prompt);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Generation failed' });
  }
}`,
    },
    vue: {
      mainFile: `<template>
  <div class="container">
    <h1>🧵 Weave AI App</h1>
    <textarea
      v-model="prompt"
      placeholder="Enter your prompt..."
    />
    <button
      @click="handleGenerate"
      :disabled="loading"
    >
      {{ loading ? 'Generating...' : 'Generate' }}
    </button>
    <p v-if="error" class="error">{{ error.message }}</p>
    <p v-if="result" class="result">{{ result }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWeave } from '@weaveai/vue';

const prompt = ref('');
const result = ref('');
const { generate, loading, error } = useWeave();

async function handleGenerate() {
  const response = await generate(prompt.value);
  result.value = response.text;
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

textarea {
  width: 100%;
  min-height: 150px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 1rem 0;
}

button {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
}

.error {
  color: red;
  margin-top: 1rem;
}

.result {
  background-color: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}
</style>`,
      indexFile: `import { createApp } from 'vue';
import { createWeavePlugin } from '@weaveai/vue';
import App from './App.vue';

const app = createApp(App);

const weaveConfig = {
  provider: {
    type: '${config.provider}',
    apiKey: import.meta.env.VITE_WEAVE_API_KEY,
  }
};

app.use(createWeavePlugin(weaveConfig));
app.mount('#app');`,
    },
    svelte: {
      mainFile: `<script lang="ts">
  import { useWeave } from '@weaveai/svelte';

  const { generate, loading, error, data } = useWeave();

  let prompt = '';
  let result = '';

  async function handleGenerate() {
    const response = await generate(prompt);
    result = response.text;
  }
</script>

<main>
  <h1>🧵 Weave AI App</h1>
  <textarea
    bind:value={prompt}
    placeholder="Enter your prompt..."
  />
  <button on:click={handleGenerate} disabled={$loading}>
    {$loading ? 'Generating...' : 'Generate'}
  </button>
  {#if $error}
    <p class="error">{$error.message}</p>
  {/if}
  {#if result}
    <p class="result">{result}</p>
  {/if}
</main>

<style>
  :global(body) {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 2rem;
  }

  main {
    max-width: 600px;
    margin: 0 auto;
  }

  textarea {
    width: 100%;
    min-height: 150px;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 1rem 0;
  }

  button {
    background-color: #007bff;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #ccc;
  }

  .error {
    color: red;
    margin-top: 1rem;
  }

  .result {
    background-color: #f0f0f0;
    padding: 1rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
</style>`,
      indexFile: `import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;`,
    },
    angular: {
      mainFile: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeaveService } from '@weaveai/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  prompt = '';
  result = '';
  loading = false;
  error: string | null = null;

  constructor(private weave: WeaveService) {}

  async handleGenerate() {
    this.loading = true;
    this.error = null;
    try {
      const response = await this.weave.generate(this.prompt);
      this.result = response.text;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Generation failed';
    } finally {
      this.loading = false;
    }
  }
}`,
      template: `<main>
  <h1>🧵 Weave AI App</h1>
  <textarea
    [(ngModel)]="prompt"
    placeholder="Enter your prompt..."
  ></textarea>
  <button
    (click)="handleGenerate()"
    [disabled]="loading"
  >
    {{ loading ? 'Generating...' : 'Generate' }}
  </button>
  <p *ngIf="error" class="error">{{ error }}</p>
  <p *ngIf="result" class="result">{{ result }}</p>
</main>`,
    },
  };

  return baseContent[config.framework as keyof typeof baseContent] || baseContent['react-vite'];
}

/**
 * Get framework-specific package.json
 */
function getFrameworkPackageJson(config: WeaveConfig): Record<string, unknown> {
  const basePackage = {
    name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: '',
      build: '',
      preview: '',
    },
    dependencies: {
      '@weaveai/core': '^1.0.0',
    },
    devDependencies: {
      typescript: '^5.3.0',
      '@types/node': '^20.0.0',
    },
  };

  // Add framework-specific configuration
  switch (config.framework) {
    case 'react-vite':
      basePackage.scripts = {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      };
      basePackage.dependencies = {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@weaveai/react': '^1.0.0',
        ...basePackage.dependencies,
      };
      basePackage.devDependencies = {
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        ...basePackage.devDependencies,
      };
      break;

    case 'react-nextjs':
      basePackage.scripts = {
        dev: 'next dev',
        build: 'next build',
        preview: 'next start',
      };
      basePackage.dependencies = {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@weaveai/react': '^1.0.0',
        '@weaveai/nextjs': '^1.0.0',
        ...basePackage.dependencies,
      };
      break;

    case 'vue':
      basePackage.scripts = {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      };
      basePackage.dependencies = {
        vue: '^3.3.0',
        '@weaveai/vue': '^1.0.0',
        ...basePackage.dependencies,
      };
      basePackage.devDependencies = {
        vite: '^5.0.0',
        '@vitejs/plugin-vue': '^4.0.0',
        ...basePackage.devDependencies,
      };
      break;

    case 'svelte':
      basePackage.scripts = {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      };
      basePackage.dependencies = {
        svelte: '^4.0.0',
        '@weaveai/svelte': '^1.0.0',
        ...basePackage.dependencies,
      };
      basePackage.devDependencies = {
        vite: '^5.0.0',
        '@sveltejs/vite-plugin-svelte': '^2.0.0',
        'svelte-check': '^3.0.0',
        ...basePackage.devDependencies,
      };
      break;

    case 'angular':
      basePackage.scripts = {
        dev: 'ng serve',
        build: 'ng build',
        preview: 'ng serve',
      };
      basePackage.dependencies = {
        '@angular/animations': '^17.0.0',
        '@angular/common': '^17.0.0',
        '@angular/compiler': '^17.0.0',
        '@angular/core': '^17.0.0',
        '@angular/forms': '^17.0.0',
        '@angular/platform-browser': '^17.0.0',
        '@angular/platform-browser-dynamic': '^17.0.0',
        '@weaveai/angular': '^1.0.0',
        rxjs: '^7.8.0',
        tslib: '^2.6.0',
        'zone.js': '^0.14.0',
        ...basePackage.dependencies,
      };
      basePackage.devDependencies = {
        '@angular-devkit/build-angular': '^17.0.0',
        '@angular/cli': '^17.0.0',
        '@angular/compiler-cli': '^17.0.0',
        ...basePackage.devDependencies,
      };
      break;
  }

  return basePackage;
}
