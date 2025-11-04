# Weave AI Assistant for Cursor - Quick Start Guide

## 3-Minute Setup

### Step 1: Get Your API Key
1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys
4. Create a new API key
5. Copy the key

### Step 2: Configure Weave
1. Open Cursor IDE Settings: `Ctrl+,` (or `Cmd+,` on Mac)
2. Search for `weave.apiKey`
3. Paste your API key
4. Done! ✅

### Step 3: Start Using Weave

Open the chat panel:
```
Press Ctrl+Shift+/  (or Cmd+Shift+/ on Mac)
```

Ask a question:
```
"How can I optimize this React component?"
```

## 🎯 Common Tasks

### 1. Chat with AI
```
Ctrl+Shift+/ → Type your question → Press Enter
```

**Example questions:**
- "How do I fix this bug?"
- "Can you explain what this code does?"
- "What's the best way to handle this?"

### 2. Edit Code Inline
```
1. Select code → Ctrl+K Ctrl+I
2. Enter edit instruction → Press Enter
3. Code is automatically updated
```

**Example instructions:**
- "Add TypeScript types"
- "Convert to async/await"
- "Add error handling"

### 3. Analyze Code
```
1. Select code
2. Right-click → "Weave: Analyze Code"
   OR Ctrl+Shift+W A
3. Review analysis in panel
```

### 4. Get Optimization Tips
```
1. Select code → Ctrl+Shift+W O
2. Review suggestions
3. Apply recommended changes
```

### 5. Generate Documentation
```
1. Select function
2. Right-click → "Weave: Generate Prompt"
   OR Ctrl+Shift+W P
3. Use generated prompt for documentation
```

## ⌨️ Essential Keyboard Shortcuts

| Task | Shortcut |
|------|----------|
| **Open Chat** | `Ctrl+Shift+/` |
| **Inline Edit** | `Ctrl+K Ctrl+I` |
| **Generate Prompt** | `Ctrl+Shift+W P` |
| **Analyze Code** | `Ctrl+Shift+W A` |
| **Optimize** | `Ctrl+Shift+W O` |

## 💡 Tips

### Tip 1: Multi-turn Conversations
The chat remembers context across multiple messages:
```
You: "What are middleware in Express?"
Weave: [Explanation]
You: "How do I create one?"
Weave: [Detailed answer with examples]
```

### Tip 2: Inline Edits Work Best With Clear Instructions
```
✅ Good: "Convert to async/await pattern"
❌ Avoid: "Make it better"
```

### Tip 3: Copy Results Easily
All analysis results have a "Copy to Clipboard" button for quick sharing.

### Tip 4: Clear Chat History When Starting New Topic
```
Click "Clear" button in chat panel
OR Right-click chat panel → Clear History
```

### Tip 5: Check Status Bar
Look at the status bar (bottom right) for Weave status:
- ✓ Ready = Weave is working
- 💡 Active = Operation in progress
- ⭕ Inactive = Features disabled

## 🚀 Pro Workflows

### Workflow 1: Code Review Session
```
1. Select function
2. Analyze Code (Ctrl+Shift+W A)
3. Read issues
4. Ask in chat for solutions
5. Apply changes with inline edit
6. Repeat for next function
```

### Workflow 2: Performance Optimization
```
1. Select slow code
2. Optimize (Ctrl+Shift+W O)
3. Review suggestions in panel
4. Apply best suggestions with inline edit
5. Test changes
```

### Workflow 3: Learning Unfamiliar Code
```
1. Open chat (Ctrl+Shift+/)
2. "Explain what this code does:"
3. Paste code snippet
4. Ask follow-up questions
5. Chat maintains context
```

### Workflow 4: Rapid Prototyping
```
1. Write initial code
2. Chat with Weave for improvements
3. Use inline edit for quick changes
4. Generate documentation when done
```

## 🛠️ Configuration Tweaks

### Make Responses Faster
```
Settings → Search "weave.maxTokens" → Set to 500
```

### More Creative Responses
```
Settings → Search "weave.temperature" → Set to 1.5
```

### Switch to Faster Model
```
Settings → Search "weave.model" → Set to "claude-3-sonnet-20240229"
```

## ❓ FAQ

### Q: Is my code private?
**A:** Your code is sent to Anthropic. Check their [privacy policy](https://www.anthropic.com/privacy).

### Q: How much does this cost?
**A:** You pay per token to Anthropic. Use `maxTokens` setting to control costs.

### Q: Can I use a different AI model?
**A:** Currently Cursor is optimized for Claude. OpenAI coming soon!

### Q: What if I have rate limits?
**A:** Wait a moment, then try again. Check Anthropic's rate limit docs.

### Q: How do I report issues?
**A:** [GitHub Issues](https://github.com/kitium-ai/weave/issues)

### Q: Can I use this offline?
**A:** No, Weave requires internet connection to Anthropic API.

## 🎓 Learning Path

**Beginner (5 min):**
- [ ] Install extension
- [ ] Configure API key
- [ ] Open chat and say hello

**Intermediate (20 min):**
- [ ] Try inline editing
- [ ] Use code analysis
- [ ] Test optimization suggestions

**Advanced (1 hour):**
- [ ] Customize settings
- [ ] Create workflows
- [ ] Learn keyboard shortcuts
- [ ] Combine multiple features

## 📚 Next Steps

1. **Read Full Documentation**
   - See README.md for detailed features
   - Check DEVELOPMENT.md for technical info

2. **Explore All Commands**
   - Right-click in editor
   - Look for "Weave:" commands
   - Try each one

3. **Customize Settings**
   - Open Settings (Ctrl+,)
   - Search for "weave"
   - Adjust to your preferences

4. **Join Community**
   - GitHub Discussions
   - Report issues
   - Suggest features

## ✅ Quick Checklist

- [ ] API key configured
- [ ] Chat opens successfully
- [ ] Inline edit works
- [ ] Tested with sample code
- [ ] Bookmarked keyboard shortcuts
- [ ] Read full README
- [ ] Ready to be productive! 🚀

## 🆘 Troubleshooting

### Chat won't open
```
1. Settings → Search "weave.apiKey"
2. Verify API key is entered
3. Reload: Ctrl+Shift+P → "Reload Window"
```

### Commands not showing
```
1. Right-click in editor
2. Look for "Weave:" commands
3. If missing: check if extension is enabled
4. Reload window
```

### Slow responses
```
1. Settings → Reduce "weave.maxTokens"
2. Check internet connection
3. Check Anthropic API status
```

### API errors
```
1. Verify API key is correct
2. Check Anthropic console for quota
3. Ensure billing is active
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kitium-ai/weave/issues)
- **Questions**: [GitHub Discussions](https://github.com/kitium-ai/weave/discussions)
- **Docs**: [Weave Framework](https://github.com/kitium-ai/weave)

---

**Enjoying Weave?** Share your feedback! Your input helps us improve.

**Ready to code?** Press `Ctrl+Shift+/` and start chatting with Weave AI! 🚀
