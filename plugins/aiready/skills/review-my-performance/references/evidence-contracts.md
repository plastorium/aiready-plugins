# Business questions and evidence contracts

Every answer states its scope in words (questions checked, engines with web/API source, locations, date, competitors). Unknown is never zero.

Choose the relevant section only. Tool names and availability are discovered at runtime.

## 1. Does AI mention my brand?

Examples: Do AI chats mention us? Which assistants name us? What do they say? Which competitors do they name instead?

Use stored answer observations with prompt, provider/model, measurement source (web interface or API), search mode, market/location, date and successful-response status. `web:*` and `api:*` observations of the same engine are different sources: never merge them, and never present API observations as the consumer app. Separate a brand mention, an actual recommendation, and a citation to a brand-controlled page. Separate branded prompts from unbranded category discovery. A mention in a negative answer is not a recommendation. An API model or search proxy is not automatically the consumer ChatGPT/Claude app.

Report a recommendation rate only when a tool returns recommendation labels and a valid denominator; chat tools currently return whether the brand was mentioned (`brandMentioned`) and where it was listed (`listPosition`), not whether it was recommended. So in chat report the mention rate with its denominator (`visibility` view engines: `brandMentions` / `visibilityConversations`), list positions and answer excerpts, and say that recommendation labelling is not available here. Report failed or unanalysed answers and missing providers separately. Do not derive any rate from a readiness score.

Answer with a scoped conclusion, provider/prompt breakdown, a few recorded answer excerpts or evidence links, competitors named instead, and one useful next step. If only score summaries are accessible, explain that answer-level evidence is needed.

## 2. Which sources and facts shape the answers?

Examples: Why does AI show the wrong hours? Why is my competitor cited? Which pages support recommendations? Is our brand confused with another business?

Use recorded citations, answer text and dated source facts. Separate sources actually cited from sources merely present in the knowledge base or inferred as possible influences. Find outdated or conflicting identity/location/offering facts and propose the specific correction. Do not claim to know a model's private reasoning or training sources.

## 3. Failed, partial and unmeasured

| Situation                                    | Say                                                                          | Never say                                |
| -------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| a check or engine failed or was skipped      | it did not run (reason if given); earlier results stay valid for their date  | "no visibility", "you failed this check" |
| a provider was unavailable                   | that engine was not checked in this scan                                     | a 0% rate for it                         |
| the crawl returned zero pages                | the site could not be read, so site-based findings are missing, not negative | "your site has no content / schema"      |
| scan still running or partial                | the stage, what is already available (labelled early), what is still missing | a final verdict                          |
| answers contradict each other or the profile | show both with engine, source and date; say which fact the profile holds     | pick one silently                        |

Comparisons with competitors: compare-competitors. What to do: plan-improvements. Change over time: report-changes.

## Tools for "does AI mention us?"

- **Does AI mention us? What does it say?** `visibility` with view summary (the latest completed result, or a named `scanId`), engines (engine × location with denominators) and answers (filtered by `engine`, `location` or `brandMentioned`; paged). Answer-level evidence: question, engine, `acquisitionChannel` (`api` = model API, `web_vendor` = the consumer web interface), location, iteration, date, successful-response denominator; a mention is not a recommendation — tools return `brandMentioned` and `listPosition`, not a recommendation label, so report a mention rate (`mentionRatePct` over `visibilityConversations`) and list positions, never a recommendation rate; never merge channels. Which sites answers cite: view citations (one `source` or `sourceType`; `limit` up to 25 top sites).
