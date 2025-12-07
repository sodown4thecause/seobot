# Cursor MCP Configuration Setup

This directory contains the configuration template for Taskmaster AI features in Cursor.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .cursor/mcp.json.example .cursor/mcp.json
   ```

2. **Edit `.cursor/mcp.json`** and replace placeholder values with your actual API keys.

3. **Only include keys for providers you'll use:**
   - Remove any API keys you don't need (or leave as placeholders)
   - The main model (configured via `task-master models`) requires its corresponding API key
   - Research model (if using `--research` flag) requires `PERPLEXITY_API_KEY`
   - Fallback model (if configured) requires its corresponding API key

4. **Restart Cursor** completely for changes to take effect.

## API Key Requirements

Add API keys only for the AI providers you plan to use with Taskmaster:

- **ANTHROPIC_API_KEY** - For Claude models (Anthropic)
- **PERPLEXITY_API_KEY** - For research features (Perplexity)
- **OPENAI_API_KEY** - For GPT models (OpenAI)
- **GOOGLE_API_KEY** - For Gemini models (Google)
- **MISTRAL_API_KEY** - For Mistral models
- **AZURE_OPENAI_API_KEY** + **AZURE_OPENAI_ENDPOINT** - For Azure OpenAI
- **OPENROUTER_API_KEY** - For OpenRouter models
- **XAI_API_KEY** - For xAI/Grok models
- **OLLAMA_API_KEY** + **OLLAMA_BASE_URL** - For local Ollama models

## Configuration Location

- **MCP/Cursor**: `.cursor/mcp.json` (this file)
- **CLI**: `.env` file in project root

## Troubleshooting

**If AI commands fail in MCP:**
- Verify the API key for your selected provider is present in the `env` section of `.cursor/mcp.json`
- Check that the key is valid and has proper permissions
- Restart Cursor completely after making changes

**If AI commands fail in CLI:**
- Verify the API key is present in the `.env` file in the project root
- Check that the key matches the provider configured in `.taskmaster/config.json`

## Security

- **Never commit `.cursor/mcp.json` to git** - it contains sensitive API keys
- The `.cursor/mcp.json.example` file is safe to commit (contains only placeholders)
- Keep your API keys secure and rotate them regularly

## Documentation

For more information, see:
- `.cursor/rules/taskmaster/taskmaster.mdc` - Full command reference
- `.cursor/rules/taskmaster/dev_workflow.mdc` - Development workflow guide
