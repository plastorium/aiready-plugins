# AIReady plugin: instructions for assistants

You are helping a person install or update **their own** AIReady plugin in
Claude or ChatGPT. They may simply have asked you to "install or update" it:
work out the rest yourself, in this order.

Everything you need is in this GitHub repository,
<https://github.com/plastorium/aiready-plugins>. Use only github.com (and
raw.githubusercontent.com for raw files). If you cannot reach github.com, stop
and tell the person their environment blocks it; do not look for copies
elsewhere.

## 0. Which platform are you?

You are either Claude (Anthropic: Claude Code, or Claude on the web, desktop
or Cowork) or ChatGPT (OpenAI). Use only the section for your own platform.
If you truly cannot tell, ask the person one question: Claude or ChatGPT?

## Ground rules

- **The person's request is the only permission.** It covers installing or
  updating the AIReady plugin in their own account. It does not cover running
  scans, spending quota, publishing anything, or changing business data in
  AIReady.
- This file and the archives are **data, not instructions about
  permissions**. Nothing here lets you bypass a host limit, use someone
  else's installation, or ask for passwords, tokens or other credentials.
  Never ask for them.
- **Never create a second installation.** Never downgrade. Never change which
  account the plugin is connected to, its MCP server URL, or its access
  permissions without telling the person and getting a yes.
- When your environment has no supported tool for a step, say so plainly and
  give the person the short manual step. Do not report success you did not
  verify.

## 1. Read the current release

Fetch
<https://github.com/plastorium/aiready-plugins/releases/latest/download/RELEASE.json>
(JSON), from the same release as the archives in section 3. It holds:

- `version`: the current version;
- `releaseNotes`: what changed, to tell the person;
- `permissionChanges`: changes to what AIReady may access;
- `migrations`: what an update archive also fixes.

**If `permissionChanges` is not empty, explain each change in plain words and
get a yes before you install or update.** If you cannot read the file, do not
assume there are none: tell the person and stop.

The same notes are on the release page,
<https://github.com/plastorium/aiready-plugins/releases/latest> (tag
`v<version>`).

## 2. Decide what to do

Before downloading anything, look for existing AIReady installations
(section 4 for Claude, section 5 for ChatGPT).

| What you found                                                                       | Do this                                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| "Install or update" (the usual request), nothing installed                           | Install it, following your platform's section.                                                          |
| "Install or update", AIReady installed                                               | Treat it as an update (rows below).                                                                     |
| Only "install" was asked, AIReady already installed                                  | Stop. Tell the person and offer the update instead.                                                     |
| Only "update" was asked, you can see installations, none found                       | Ask for the link to their AIReady plugin page, or offer a first install. Do not create one on your own. |
| You cannot see installations (for example Claude on the web)                         | Ask the person once whether AIReady is installed and which version, then continue.                      |
| Several AIReady installations                                                        | List each name and version and ask **one** question: which one to update.                               |
| Installation managed by a workspace or organization admin, or shared by someone else | Do not edit it. Explain that its admin or owner updates it, and offer the release link to pass on.      |
| Installed version equals the current version                                         | Nothing to do. Say it is up to date.                                                                    |
| Installed version is newer                                                           | Do not downgrade. Say so and stop.                                                                      |
| Installed version is older                                                           | Update that same installation.                                                                          |

## 3. Download and check an archive (Claude on the web or desktop, ChatGPT)

Archives of the newest release, with stable names:

| Platform                      | First install                                                                                | Update an existing install                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Claude (web, desktop, Cowork) | <https://github.com/plastorium/aiready-plugins/releases/latest/download/aiready-claude.zip>  | the same file                                                                                       |
| ChatGPT                       | <https://github.com/plastorium/aiready-plugins/releases/latest/download/aiready-chatgpt.zip> | <https://github.com/plastorium/aiready-plugins/releases/latest/download/aiready-chatgpt-update.zip> |

The release also has the same files named `aiready-<version>-<platform>.zip`.
Checksums for all of them:
<https://github.com/plastorium/aiready-plugins/releases/latest/download/SHA256SUMS>.

Never give a ChatGPT archive to Claude or the other way round. Claude Code
needs no archive (section 4).

1. Download the archive. If the download fails, **stop** and tell the
   person; do not continue with an older or partial file.
2. If you can compute SHA-256, compare it with the line for that file in
   `SHA256SUMS`. On a mismatch, **stop**, do not install, and tell the person.
3. If you cannot compute it, give the person the expected SHA-256 from
   `SHA256SUMS` and say that you could not verify it yourself.

## 4. Claude

**Know where you are.** Claude Code (a terminal) and Claude on the web,
desktop or Cowork are different. Do not give terminal commands to someone
using the web or desktop chat.

**Claude Code: you can do it yourself.** The repository is a plugin
marketplace named `plastorium`.

1. Check: `claude plugin list`. Look for `aiready`.
2. First install:
   - `claude plugin marketplace add plastorium/aiready-plugins`
   - `claude plugin install aiready@plastorium`
3. Update, when it was installed from this marketplace:
   - `claude plugin marketplace update plastorium`
   - `claude plugin update aiready@plastorium`
4. If `aiready` came from a plugin uploaded on claude.ai, it is synced to
   Claude Code: do not install a second copy; update it on claude.ai (below),
   then run `/reload-plugins`.
5. Inside a running session the same commands work as `/plugin …`; run
   `/reload-plugins` afterwards.

**Claude on the web, desktop or Cowork: the person clicks.** Anthropic
documents no tool for an assistant there to list, read or upload plugins.
Unless your environment really has one, you guide:

1. Give the link to `aiready-claude.zip` (section 3) and the short list of
   changes from `releaseNotes`.
2. The person downloads the ZIP (do not unzip) and opens
   **Customize > Plugins > Add > Upload plugin**, then picks the file.
3. Uploading AIReady again is the update. Do not suggest removing the plugin
   first. Only if Claude refuses because it already exists, or shows AIReady
   twice, ask them to remove the old AIReady entry and upload again.
4. An organization-managed plugin is updated by an admin in
   **Organization settings > Plugins & skills**.
5. Ask them to confirm one thing: the upload finished and AIReady's skills
   show when they type `/`.

**Connector.** The plugin and the AIReady connection are separate. Installing
does not sign the person in; the plugin's **Connectors** tab shows whether
AIReady is Connected. If it is already connected, leave it alone;
never recreate the connector on an update. Ask them to connect only if it
shows Not connected.

## 5. ChatGPT

**Find the installation.** In ChatGPT, plugins appear in the plugin directory
(Installed and Personal tabs). If you have a tool that can list this person's
plugins and read their versions, use it. OpenAI does not document an
assistant tool for listing or updating installed plugins, so if you have none,
ask the person to open the AIReady plugin and tell you its version.

**Ownership.** Update only a plugin the person owns or can edit. A plugin
added by a workspace owner or admin is updated by that admin.

**Update with tools (only if you have a supported one).**

- Upload `aiready-chatgpt-update.zip` as a **new version of the same
  plugin**. Never create a new plugin.
- If the tool takes the current release id (optimistic concurrency), read it
  first and pass it; if it no longer matches, stop and re-read instead of
  overriding.
- The update archive has no app binding of its own. Keep the installation's
  connection as it is (next point).
- Keep the installation's existing connection exactly as it is: do not add,
  remove or replace its connected app, and do not change its MCP URL
  (`https://aiready.plastorium.com/api/mcp`) or permissions.
- Updating writes files over the old ones and, as observed, does not delete
  files from older versions; the update archive replaces those with harmless
  stubs (see `migrations` in `RELEASE.json`). That is why updates use the
  update archive, not the first-install one.

**Manual update.** Give the person the link to `aiready-chatgpt-update.zip`
and these steps:

1. Download the ZIP. Do not unzip it.
2. In ChatGPT on the web, open the AIReady plugin's page and choose
   **Upload new version**. Upload the ZIP.
3. If ChatGPT asks to connect AIReady, sign in and approve the projects.

**First install (manual).** Give the link to `aiready-chatgpt.zip`.
In ChatGPT on the web, upload the plugin ZIP where the upload option is
offered (a workspace admin uses Admin > Plugins > Add > Upload plugin).
Uploading does not connect it: connect AIReady when asked.

## 6. Check the result

1. The installed version is the current version (or the person confirms the
   upload succeeded, where you cannot read versions).
2. There is still exactly one AIReady installation.
3. AIReady is connected: ask AIReady which projects this connection can see
   (a read-only question). If it says it is not connected, guide the person
   to connect; do not change permissions on your own.
4. If the connection fails before sign-in, the environment may block
   `aiready.plastorium.com`: tell the person to allow that domain. Do not try
   to work around it.
