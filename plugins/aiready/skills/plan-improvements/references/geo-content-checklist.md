# GEO content checklist (hypotheses, not proven drivers)

Use this when a brief is handed off (briefs-and-publishing.md § Get or hand
off a brief), so the writer gets concrete page checks. It lists five content
and access traits that people in this field often recommend for pages that AI
answers quote. Every item is a **hypothesis**: none has been shown to cause
more AI mentions for any business, and AIReady has not validated any of them
against its own scan data yet.

Say so in the hand-off: "These are checks to test, not proven drivers." Never
write that a page with these traits will be recommended or cited.

## How to use the list

- Check the **page** the brief is for, or a draft of it, against each item.
  Report each as met, not met, or unknown (the page or its text was not
  available). Unknown is a verdict too: never mark an item met without seeing
  the text.
- Say what a scan measured only when a result returned it (see the "Scan
  today" column). Anything else is unmeasured, and is said so.
- A recommendation to change a page stays a hypothesis until a later scan
  shows a change, and even then the change is an association (report-changes).

## The five items

| #   | Item (hypothesis)                                                                                                                                                                                                         | What to check on the page                                                                                                         | Scan today                                                                                                                     | Not measured                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| H1  | **Direct answer in the first 150 words.** The page states its answer in its opening sentences, not after a long introduction.                                                                                             | The first 150 words: is there a plain answer to the page's question, not a question or a scene-setting opener?                    | The scan's own answer-first check reads only the first 50 words, so it does not test this 150-word rule.                       | Whether the 150-word window matters at all.                                                           |
| H2  | **Definition on first use.** A term the page relies on is defined where it first appears.                                                                                                                                 | Each specialised term, at its first appearance: is it followed by a plain definition?                                             | Whether a page has a definition pattern, as a share of pages.                                                                  | Whether a given term is one the audience needs defined.                                               |
| H3  | **Sourced statistics.** A number on the page names its source and date.                                                                                                                                                   | Each figure: does it carry a named source (publisher, study, dataset) and a date? An unsourced figure is not met.                 | Whether pages have figures, and whether they cite external sources.                                                            | Whether each figure is sourced correctly, or whether the source says what the page claims.            |
| H4  | **Dated freshness.** The page shows when it was last reviewed or updated, in a form a reader and a crawler can read.                                                                                                      | A visible "updated" or "reviewed" date, and a machine-readable modified date (or a sitemap last-modified date) that matches it.   | How old pages are by their modified date, whether the freshness signals are present, and whether the sitemap dates are recent. | Whether AI engines use these dates. The dates are measured; their effect is not.                      |
| H5  | **AI-bot access split by purpose.** The site decides per purpose: search indexing, user-triggered fetching, and training. Blocking a search or user-fetch agent is a different decision from blocking a training crawler. | robots.txt (and any firewall rule) for each named agent, grouped as in the table below. Blocking training is a legitimate choice. | Whether robots.txt allows or blocks search agents and user-fetch agents; training is reported but not scored.                  | Whether a user-fetch agent is blocked at the page itself, or what a blocked agent costs the business. |

### H5 agent groups (from the crawler registry)

| Purpose              | Agents (User-Agent tokens)                                       | Plain-language consequence of blocking (a description, not a measured effect) |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Search indexing      | OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot         | Can keep the site out of that engine's search results as a source.            |
| User-triggered fetch | ChatGPT-User, Claude-User, Perplexity-User, meta-externalfetcher | Can stop an assistant from opening the page when a user asks about it.        |
| Training             | GPTBot, ClaudeBot, CCBot, Bytespider, meta-externalagent         | Opt-out of training. Not scored as a penalty.                                 |

Agents marked unknown in the registry (for example anthropic-ai, Claude-Web,
cohere-ai) have no documented purpose. Say that; do not guess their purpose.

## What the checklist does not say

- It does not rank items, and it does not say which one matters most.
- It adds no new signals or scoring. Some of these traits already feed the
  readiness score through existing checks (for example definitions,
  statistics, citations and freshness in content quality, and search and
  user-fetch access in LLM discoverability). Explain a score with those
  checks, not with this list. AI visibility is measured from the answers.
- It does not promise a result for any single page or business.
