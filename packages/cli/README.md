# create-weave-app CLI

Interactive scaffolding tool for creating new Weave AI applications in seconds.

## Features

✨ **Zero Configuration Setup**
- Interactive prompts guide you through framework and provider selection
- Automatic environment variable configuration
- Pre-configured project structure

🎯 **Framework Support**
- React (Vite)
- React (Next.js)
- Vue 3
- Svelte
- Angular

🔌 **Provider Integration**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Google (Gemini)

🚀 **Production Ready**
- TypeScript strict mode enabled
- Pre-configured best practices
- Example application included
- Environment validation

## Quick Start

```bash
npx create-weave-app
```

The CLI will guide you through:

1. **Project Name** - Give your project a name
2. **Framework** - Choose your preferred framework
3. **Provider** - Select your AI provider
4. **Model** - Pick your preferred model
5. **API Key** - Optionally provide your API key (can be added later)

Once complete, follow the on-screen instructions to start developing.

## Usage Examples

### Create React Vite App
```bash
npx create-weave-app
# Select: React + Vite
# Select: OpenAI
# Select: gpt-3.5-turbo
```

### Create Next.js App
```bash
npx create-weave-app
# Select: React + Next.js
# Select: Anthropic
# Select: claude-3-sonnet
```

### Create Vue App
```bash
npx create-weave-app
# Select: Vue 3
# Select: Google
# Select: gemini-pro
```

## Configuration

### Environment Variables

The CLI generates a `.env.local` file with the following variables:

```env
# Provider configuration
VITE_WEAVE_PROVIDER=openai
VITE_WEAVE_API_KEY=your-api-key-here
VITE_WEAVE_MODEL=gpt-3.5-turbo

# Optional settings
VITE_WEAVE_DEBUG=true
VITE_WEAVE_TIMEOUT=30000
VITE_WEAVE_CACHE=true
```

### Project Structure

```
my-weave-app/
├── src/
│   ├── App.tsx          # Main component
│   ├── main.tsx         # Entry point
│   └── components/      # Your components
├── public/              # Static assets
├── .env.local          # Environment variables (generated)
├── .env.example        # Template for .env variables
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
├── README.md           # Project documentation
└── .gitignore          # Git ignore rules
```

## What Gets Generated

### Files Created

- ✅ **Framework-specific boilerplate**
  - React: App.tsx with hooks setup
  - Vue: App.vue with Composition API
  - Svelte: App.svelte with stores
  - Angular: Service-based architecture
  - Next.js: Pages and API routes

- ✅ **Configuration files**
  - `.env.local` - Environment variables
  - `.env.example` - Template for team sharing
  - `tsconfig.json` - TypeScript configuration
  - `package.json` - Dependencies for your framework
  - `.gitignore` - Version control setup
  - `README.md` - Project documentation

- ✅ **Dependencies**
  - Framework packages
  - Weave integration packages (@weave/react, @weave/vue, etc.)
  - Build tools (Vite, Next.js, etc.)
  - Development dependencies

## Next Steps

After running `create-weave-app`, follow these steps:

```bash
# Navigate to your project
cd my-weave-app

# Install dependencies
npm install

# If you skipped API key setup, add it now
# Edit .env.local and set VITE_WEAVE_API_KEY

# Start development server
npm run dev

# Open http://localhost:5173 (or 3000 for Next.js)
```

## Validation

The CLI performs pre-flight checks to ensure your environment is ready:

✅ **Checks Performed**
- Node.js version (18+)
- npm or yarn availability
- Git installation (optional)
- Project name validity
- API key format (if provided)
- Directory doesn't already exist

## Troubleshooting

### "Node.js 18+ required"
Update Node.js to version 18 or newer:
```bash
node --version  # Check current version
# Visit https://nodejs.org for updates
```

### "Project directory already exists"
Either choose a different project name or remove the existing directory:
```bash
rm -rf my-weave-app
npx create-weave-app  # Try again
```

### "npm/yarn not found"
Install Node.js from https://nodejs.org (includes npm)
Or install yarn: `npm install -g yarn`

### "Invalid API key format"
Check your API key:
- **OpenAI**: Should start with `sk-`
- **Anthropic**: Should start with `sk-ant-`
- **Google**: Should be at least 20 characters

You can add or update your key later in `.env.local`

## Advanced Options

### Environment Variables for CI/CD

Set options via environment variables instead of interactive prompts:

```bash
WEAVE_PROJECT_NAME=my-app \
WEAVE_FRAMEWORK=react-vite \
WEAVE_PROVIDER=openai \
WEAVE_MODEL=gpt-3.5-turbo \
WEAVE_API_KEY=sk-... \
npx create-weave-app
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=weave:* npx create-weave-app
```

## API Key Management

### Securing Your API Key

Never commit your `.env.local` file to version control:

```bash
# .gitignore (already included)
.env.local
.env.*.local
```

### Getting Your API Key

1. **OpenAI**: https://platform.openai.com/api-keys
2. **Anthropic**: https://console.anthropic.com
3. **Google**: https://cloud.google.com/docs/authentication/api-keys

### Updating Your Key Later

Edit `.env.local` at any time:
```env
VITE_WEAVE_API_KEY=new-key-here
```

Restart your development server for changes to take effect.

## Contributing

To contribute to create-weave-app:

1. Clone the Weave repository
2. Navigate to `packages/cli`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support

- **Documentation**: https://weave.ai/docs
- **Discord Community**: https://discord.gg/weave
- **GitHub Issues**: https://github.com/kitium-ai/weave/issues
- **Email Support**: support@weave.ai

## License

Apache-2.0
