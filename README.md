# AIReady plugins

[![Security scan](https://github.com/plastorium/aiready-plugins/actions/workflows/security.yml/badge.svg)](https://github.com/plastorium/aiready-plugins/actions/workflows/security.yml)
[![Validate plugin](https://github.com/plastorium/aiready-plugins/actions/workflows/validate.yml/badge.svg)](https://github.com/plastorium/aiready-plugins/actions/workflows/validate.yml)

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

**The easy way: ask your assistant.** Paste this into Claude or ChatGPT:

> Install or update the AIReady plugin for me. Follow
> https://github.com/plastorium/aiready-plugins/blob/main/docs/agent-install.md

It works out which assistant it is, whether AIReady is already installed, and
either installs it itself (Claude Code) or gives you the file and the two or
three clicks to do. The steps by hand are below.

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
| `security/`                       | accepted security-scan findings, each with its reason                                                              |
| `VERSION`                         | the released plugin version; each release is a `v<version>` tag and GitHub release with the ZIPs and their SHA-256 |

## Security

The skills are plain Markdown instructions and five small helper scripts; the
plugin runs no code on your computer beyond those scripts, which read their
input and print a result. Three public scanners check every change, every push
and every week ([Security scan](.github/workflows/security.yml)):

- [Cisco skill-scanner](https://github.com/cisco-ai-defense/skill-scanner):
  prompt injection, data exfiltration, malicious code.
- [NVIDIA SkillSpector](https://github.com/NVIDIA/SkillSpector), static mode:
  injection, exfiltration, privilege escalation, MCP tool poisoning, YARA and
  taint checks.
- `claude plugin validate --profile directory`: Anthropic's plugin directory
  rules.

The scanners run without an API key and call no model. SkillSpector reports a
few things by design, for example that a change the person asks for runs
without a second confirmation. Each accepted finding is listed, with its
reason, in [security/skillspector-baselines/](https://github.com/plastorium/aiready-plugins/tree/main/security/skillspector-baselines);
any other finding fails the scan. Spending a large share of your credits,
deleting, and sharing data outside AIReady always ask you first.

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
