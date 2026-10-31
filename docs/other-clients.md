# Using AIReady from other AI clients

Any client that supports **remote MCP servers over Streamable HTTP with
OAuth** can use AIReady. The plugin adds skills that make answers better; the
connection alone gives the client the tools.

| Server           | URL                                               | What it is                    |
| ---------------- | ------------------------------------------------- | ----------------------------- |
| AIReady          | `https://aiready.plastorium.com/api/mcp`          | the standard tools            |
| AIReady Advanced | `https://aiready.plastorium.com/api/mcp/advanced` | extra tools, separate consent |

Add the server, then sign in when the client opens the AIReady consent page.
Never paste an API key or client secret: sign-in is OAuth only. Configuration
formats change between client versions; if a snippet below does not work,
check your client's MCP documentation for "remote" or "HTTP" servers.

## Claude Code (without the plugin)

```bash
claude mcp add --transport http aiready https://aiready.plastorium.com/api/mcp
```

## Cursor, Windsurf and clients using `mcpServers`

```json
{
  "mcpServers": {
    "aiready": { "url": "https://aiready.plastorium.com/api/mcp" }
  }
}
```

## VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "aiready": {
      "type": "http",
      "url": "https://aiready.plastorium.com/api/mcp"
    }
  }
}
```

## Gemini CLI (`settings.json`)

```json
{
  "mcpServers": {
    "aiready": { "httpUrl": "https://aiready.plastorium.com/api/mcp" }
  }
}
```

## Skills

The skills in `plugins/aiready/skills/` are plain Agent Skills folders
(`SKILL.md` with a `name` and `description`, plus `references/`). A client that
loads skills from a folder can use them as they are. A client without skills
support still works with the tools alone; for best results, start with the
`aiready` skill's `SKILL.md` as instructions.

## Networks that restrict outbound access

The client must reach `aiready.plastorium.com` over HTTPS. In sandboxes and
company networks with an allowlist, add that domain; otherwise the connection
fails before sign-in.
