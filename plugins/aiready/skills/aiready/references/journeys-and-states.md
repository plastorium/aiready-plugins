# Journeys, entries and business state in chat

AIReady works as three linked processes: **understand the business and market**, **measure position** against chosen competitors, and **improve and check**. Chat helps with all three, on the same backend objects as the web app. Nothing about the journey lives only in this conversation.

## 1. Work out where the business is

Once a business the person can read is resolved (`businesses`, needs `projects.read`), call `businesses` with it: it returns the same state and one primary action the web home shows (new, researching, early results, failed, baseline ready, actions chosen, awaiting check), its link, and the scope sentence of the latest check. Say the state in one sentence, quote the scope, and offer **one** next step — the result's `next` hints name it. With no business yet, or a report-only grant, use the rows below instead. The rows also cover states the web home has no equivalent for (No business, Needs input, Cycle ready, Limited).

| State                 | How to recognise it from tools                                                              | Primary next step in chat                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **No business**       | no matching business in `businesses`                                                        | add it (`business_add`), then offer the first analysis                           |
| **New**               | state `new`: the business exists but has never been checked                                 | follow its primary action (finish setup); never add a second one                 |
| **Researching**       | `measure_status` not finished                                                               | show the stage and what is already available; do not start another measurement   |
| **Needs input**       | a running analysis is blocked on a consequential question (identity, location, competitors) | ask at most three compact questions                                              |
| **Early results**     | first observations exist but no completed comparative scan                                  | share them labelled early and provisional; no comparative advice yet             |
| **Failed**            | state `failed`: the latest check ended with no result (failed or cancelled)                 | say it did not run and why; earlier results stay valid; offer its primary action |
| **Baseline**          | a completed scan, no open plan tasks                                                        | answer the question; point to the top opportunities                              |
| **Actions chosen**    | `next_steps` has open tasks                                                                 | show progress and the next task                                                  |
| **Awaiting check**    | tasks are done but not verified                                                             | explain what is waiting for AIReady's re-check; do not claim improvement         |
| **Cycle ready**       | a newer completed scan exists since the last one the person reviewed                        | what changed on the comparable subset, then the next task                        |
| **Limited** (overlay) | quota exhausted, spend freeze, blocker in `measure_plan`, provider unavailable              | keep showing previous results; state the reason and what still works             |

Limited never hides earlier results. A failed refresh is reported with its reason; previous results stay valid for their own date.

## 2. Recognise the entry

| Entry                                    | What the person has                                           | What chat does                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. New self-service**                  | a URL or business name                                        | find or add the business; the URL is enough to start; ask only questions that change identity, relevance or cost; offer the first analysis with its scope and cost                                                                    |
| **B. Prepared analysis / shared report** | a `reports.read` grant or a report link                       | open the report immediately with its date and scope (`reports` with the report, which returns its evidence); opening never starts research; reading a report is not project access, and the reader is not assumed to own the business |
| **C. Returning user**                    | businesses with history                                       | open on what changed, what needs attention, what is in progress, what is confirmed, what to do next; never restart onboarding                                                                                                         |
| **D. From chat itself**                  | an existing web project                                       | continue at the same business, scan or task the person refers to; give web links to the same objects                                                                                                                                  |
| **E. Invited participant**               | report recipient, project collaborator or organisation member | keep these roles apart; an invitation never triggers research. Projects shared only through a web access grant may not be reachable from chat yet: say so and give the web link instead of guessing                                   |

## 3. Journeys (IDs match the product's journey catalogue)

**J1 First analysis** (understand-my-business, then run-a-scan). `business_add` adds the business; it starts no research and spends nothing. Then `measure` on the person's request (it starts at once and its `effect` carries what ran and the cost; `measure_plan` only for a cost or blocker question): the server stages the first analysis (the parts that need no questions first; when generated questions are ready, the `measure` result lists the ones it approved together with the AI-visibility part and its cost). Follow `measure_status` and its `next` hints, then `competitors` → `competitors_track` / `competitors_decline` → `visibility` → `next_steps`. The stopping rules and the budget are the product's, not chat's: never chain extra paid measurements to "go deeper" on your own; directions that did not fit the authorized budget become "directions not yet explored" for the next cycle. Early observations may support non-comparative advice (broken identity, site accuracy, missing basics); comparative advice waits for the competitor set. The baseline is frozen when the first analysis stops; later exploration never rewrites it.

**J2 Prepared result** (report-changes for a shared report, review-my-performance for a prepared business). Show the frozen report as it was published: date, scope, source (web or API), competitors. `reports` returns its evidence; check it before calling a finding supported. Offer project access only if the reader asks.

**J3 Correct the business or scope** (understand-my-business). `business_correct` for stated facts and profile fields (one list of changes, saved at once; report each change before and after); `competitors_track` / `competitors_decline` for competitors; `topics_tracking` for topics; `prompts_approve` / `prompts_reject` for generated questions and `prompts_add` for the person's own. Fact text is a fact-edit change in `business_correct`. The remaining `knowledge_*` and `listing_*` tools (locks, resolution, retirement, conflict analysis, document add, listings) are on the AIReady Advanced connector. Other deeper work: `locations_change` for locations and `measurement_settings_update` for engines, iterations and business type (both on the AIReady Advanced connector), the topic-map tools for suggestions, groups and placement, and `prompts_edit`, `prompts_retire`, `prompts_restore` and `prompts_delete` for editing questions (Standard intents, each running at once except `prompts_delete`, which proposes first; AIReady Advanced adds batch versions). Report cost and map-rebuilding effects after the change; deletes ask first (core rule 12). A declined topic or competitor stays declined until new evidence is shown.

**J4 Competitive gap** (compare-competitors). `visibility` (view topics) then `compare`. Competitors are always relative to a context (service, place, topic, channel). Directories, publishers and cited sources are not business competitors. Missing access to a competitor source is unknown, not zero activity.

**J5 Choose improvements** (plan-improvements). `next_steps` → `task_update` → `brief`. Reuse existing recommendations and priorities. Accepting creates plan work; it does not mean the work happened. "Not now" with a date comes back to the list at the next AIReady check after that day (not on the day itself, and not if no check runs) — that is not a reminder message, so do not promise one.

**J6 Publications** (plan-improvements). `brief` gets or creates a recommendation's brief (free); drafting, screening and recording a published page use the publication tools. Preparing, writing and publishing are separate steps. Never publish, contact third parties or place links on the person's behalf.

**J7 Did it work?** (plan-improvements; measured change in report-changes) `task_update` (done) → `did_it_work`. Answer five questions separately:

1. Was the task reported done? (status done, a claim by the person)
2. Does AIReady still flag it? (verified: a re-check after it was done no longer raises the issue. Today that re-check can re-analyse earlier data or run with a changed question set, competitor set or extraction, so say "AIReady no longer flags it", never "a new measurement confirmed the fix")
3. Did the measured metric change on the comparable subset?
4. Is there enough data to say? (`did_it_work` withholds a change without it, and says why)
5. Can a cause be claimed? — **No.** AIReady does not establish causation.

**J8 Recurring review** (report-changes; schedules in run-a-scan). `visibility` (view history) → `did_it_work` → `competitors`. A review compares the refreshed stable measurement set on the comparable subset, checks tasks done since last time, notes new competitors and topics, and updates the plan. Scope changes are shown as scope changes, not as changes in the business ("On the questions we checked last month you improved; the new topics have no history yet."). Scheduling tools today only set daily UTC scan slots; see report-changes.

**Scan recovery** (run-a-scan). `measure_status` → `measure` with scope failed_parts; `measure_cancel` only when the person asks to stop a running scan (it stops at once; say work already done stays charged) or a re-analysis.

**J9 Moving between web and chat** (every skill). The backend holds the state. Every change made in chat is visible on the web and vice versa. Re-read before acting on anything the person saw earlier: if it changed since, say what changed. Revoked access is refused with its reason and no data. Repeated requests reuse the `idempotencyKey` and return the existing operation.

## 4. What chat cannot do yet (give the web link instead)

- read model outputs, feature targets or roadmaps beyond what `visibility` (view drivers) returns (shared reports do not contain them either);
- edit per-engine web/API source or additional model channels (engines and iterations use `measurement_settings_update`, locations `locations_change`, both on AIReady Advanced; webhooks use `webhook_*` on the AIReady Advanced connector);
- create arbitrary tasks (an existing task's owner and due date can be set);
- weekly or monthly cadences, report delivery by email;
- payments, plan changes, subscriptions, credits or upgrades (core rule 13: explain the limit, never promote or link to a purchase).

When the person asks for one of these, say it is not available in chat, give the specific web link (for payments and plans: no link beyond general site information), and continue with what chat can do.
