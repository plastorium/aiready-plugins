# AIReady plugins

[AIReady](https://aiready.plastorium.com/) shows whether AI assistants
(ChatGPT, Perplexity, Gemini and others) mention your business when people ask
about what it offers, how it compares with competitors, and what to improve
next. This repository holds the AIReady plugin for AI assistants: seven skills
that teach the assistant how to use AIReady well, and the connection to the
AIReady service.

You need an AIReady account. The plugin connects to it with OAuth; you choose
which businesses and abilities it gets on the AIReady consent screen. The
plugin does not guarantee that AI assistants will recommend your business.

## Install

### Claude Code

```bash
claude plugin marketplace add plastorium/aiready-plugins
```

```bash
claude plugin install aiready@plastorium
```

Claude Code also connects **AIReady Advanced**, a second server with
extra tools and its own consent; the Claude ZIP below does too. ChatGPT and
Codex connect the standard server only.

Inside a session the same works as `/plugin marketplace add plastorium/aiready-plugins`
and `/plugin install aiready@plastorium`. Update with
`/plugin marketplace update plastorium`, then `/reload-plugins`.

### Claude (claude.ai, Claude Desktop, Cowork)

Download `aiready-<version>-claude.zip` from the
[latest release](https://github.com/plastorium/aiready-plugins/releases/latest), then
**Customize → Plugins → Add → Upload** and choose the ZIP (do not unzip it).
Uploading a newer ZIP over the installed one is the update.
If your organization manages plugins, an admin installs it.

### ChatGPT and Codex

The `plugins/aiready/` folder is an [agent-plugins](https://agent-plugins.org/)
package with a Codex manifest (`.codex-plugin/plugin.json`). Download
`aiready-<version>-chatgpt.zip` from the [latest release](https://github.com/plastorium/aiready-plugins/releases/latest)
and upload it as a plugin (use `-chatgpt-update.zip` to update an existing
install), or point a host that installs plugins from a folder or Git
repository at `plugins/aiready/`.

### Any other MCP client

Cursor, VS Code, Windsurf, Gemini CLI and other clients that support remote MCP
servers with OAuth can connect without the plugin; see
[docs/other-clients.md](docs/other-clients.md). Clients that read Agent Skills
(`SKILL.md` folders) can also load `plugins/aiready/skills/`.

## What is here

| Path                              | What it is                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `plugins/aiready/skills/`         | the skills, one folder each (`SKILL.md` + references)                                                              |
| `plugins/aiready/.mcp.json`       | the AIReady MCP server (`mcp.json` holds the same for agent-plugins hosts)                                         |
| `plugins/aiready/.claude-plugin/` | Claude plugin manifest                                                                                             |
| `plugins/aiready/.codex-plugin/`  | Codex / ChatGPT plugin manifest                                                                                    |
| `plugins/aiready/plugin.json`     | agent-plugins manifest                                                                                             |
| `.claude-plugin/marketplace.json` | Claude Code marketplace catalog                                                                                    |
| `VERSION`                         | the released plugin version; each release is a `v<version>` tag and GitHub release with the ZIPs and their SHA-256 |

## Support

- Problems with the plugin: [open an issue](https://github.com/plastorium/aiready-plugins/issues/new/choose).
- Your account, data or billing: <https://aiready.plastorium.com/support>.
- Security: see [SECURITY.md](SECURITY.md).

This repository is published from AIReady's release process. Pull requests
are not merged here; report the problem in an issue and the fix ships in the
next release.

## License and trademarks

The plugin is released under the [MIT License](LICENSE). "AIReady" and the
AIReady logo are trademarks of Plastorium and are not covered by the license;
forks must not use them to suggest they are the official plugin.
Use of the AIReady service is governed by its
[terms](https://aiready.plastorium.com/terms) and
[privacy policy](https://aiready.plastorium.com/privacy).
