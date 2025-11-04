# Weave AI Assistant for WebStorm - Quick Start

## 3-Minute Setup

### Step 1: Install Plugin
1. Open WebStorm
2. Settings → Plugins → Marketplace
3. Search "Weave AI Assistant"
4. Click Install
5. Restart WebStorm

### Step 2: Get API Key
1. Visit https://console.anthropic.com
2. Create account / Sign in
3. Go to API Keys
4. Create new key
5. Copy the key

### Step 3: Configure API Key
1. WebStorm Settings (Ctrl+Alt+S)
2. Tools → Weave AI Assistant
3. Paste API key
4. Click Apply & OK

### Step 4: Start Using!
```
Press Ctrl+Shift+/ to open chat
```

## ⚡ 5-Second Tasks

| Task | How To |
|------|--------|
| **Chat with AI** | `Ctrl+Shift+/` |
| **Edit code** | Select code → `Ctrl+K, Ctrl+I` → Enter instruction |
| **Analyze** | Select code → `Ctrl+Shift+W, A` |
| **Optimize** | Select code → `Ctrl+Shift+W, O` |
| **Generate Prompt** | Select code → `Ctrl+Shift+W, P` |

## 💡 Common Questions

**Q: Is my code private?**
A: Code goes to Anthropic. Check their privacy policy.

**Q: How much does it cost?**
A: Pay per token to Anthropic (~$0.003 per 1K tokens).

**Q: What's the API key?**
A: Get it from https://console.anthropic.com

**Q: Which languages work?**
A: JavaScript, TypeScript, Python, Java, Kotlin.

**Q: Can I use OpenAI?**
A: Yes, but Anthropic Claude is recommended.

## 🎯 Try These First

### 1. Chat
```
Ctrl+Shift+/ → Ask: "How do I optimize React components?"
```

### 2. Inline Edit
```
1. Write: function add(a, b) { return a + b; }
2. Select it
3. Ctrl+K, Ctrl+I
4. Type: "Add TypeScript types"
5. Code updates automatically!
```

### 3. Code Analysis
```
1. Select code
2. Ctrl+Shift+W, A
3. Read analysis in tool window
```

## 🔧 If Something's Wrong

**Chat won't open?**
- Check API key in Settings
- Restart WebStorm (File → Invalidate Caches)

**Commands not in menu?**
- File → Invalidate Caches → Restart
- Check Settings → Plugins (Weave should be enabled)

**Slow responses?**
- Settings → Reduce "Max Tokens" to 1000
- Check internet connection

**API errors?**
- Verify API key is correct
- Check Anthropic balance/quota
- Make sure billing is active

## 📚 Next Steps

1. **Read Full Guide**: See README.md
2. **Learn Shortcuts**: Memorize the 5 main shortcuts
3. **Customize Settings**: Adjust temperature/tokens to preference
4. **Explore Features**: Try each command
5. **Get Productive**: Use Weave daily!

## ✅ Checklist

- [ ] Plugin installed
- [ ] API key configured
- [ ] Chat opens (Ctrl+Shift+/)
- [ ] Tested inline edit
- [ ] Tested analyze code
- [ ] Ready to code! 🚀

---

**Pro Tip**: Use `Ctrl+Shift+W, A` to analyze code before optimizing it!

**Need Help?** Open an issue: https://github.com/kitium-ai/weave/issues
