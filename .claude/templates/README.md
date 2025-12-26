# Claude Code Templates

This directory contains templates for git commits and pull requests used by Claude Code.

## Setup

1. Copy the example files to create your templates:
   ```bash
   cp commit-message.example commit-message.txt
   cp pr-title.example pr-title.txt
   cp pr-body.example.md pr-body.md
   ```

2. Customize the templates for your project's needs

3. The `.txt` and `.md` files are gitignored so each developer can have their own templates

## Template Files

- **commit-message.txt** - Used with `git commit -F .claude/templates/commit-message.txt`
- **pr-title.txt** - Used with `gh pr create --title-file .claude/templates/pr-title.txt`
- **pr-body.md** - Used with `gh pr create --body-file .claude/templates/pr-body.md`

## Security Note

⚠️ **Never include API keys, secrets, or sensitive data in these templates!**

Templates should use placeholders like:
- `<your-api-key-here>`
- `ENV_VAR_NAME=<value>`
- References to environment variables or secrets managers

## Permissions

The `.claude/settings.local.json` file restricts which git/gh commands Claude Code can run:
- Only specific branch patterns (`feature/*`, `fix/*`)
- Only commits using these template files
- No arbitrary command execution
- No force pushes or destructive operations
