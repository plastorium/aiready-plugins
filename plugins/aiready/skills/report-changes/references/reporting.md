# Reporting and recurring work

## Interpret the request

"What changed last month?" requests a retrospective report, not a new recurring schedule.
"Send me a report every month" requests recurring execution and delivery. Chat today can only set daily UTC scan slots; it cannot schedule weekly or monthly reviews or deliver reports (see the last section). Say so, offer an on-demand review now, suggest a follow-up date, give the web settings link, and state that no recurring job was created.

## Historical comparison

Resolve the project, business timezone and concrete date range. If "last month" is ambiguous, state a reasonable calendar-month interpretation and let the user correct it; use a different period when established by context. Identify actual snapshot timestamps.

Compare the same prompt set/version, topic mapping, model/provider, measurement source (web/API) and search mode, location, language and competitor cohort. Expose changes in measurement configuration as scope changes, never as changes in the business. Report change on the comparable subset (the questions measured in both periods) and label it as such; newly explored topics, questions or competitors have no history until measured twice. Historical measurements are never rewritten from later knowledge; report sample sizes, provider outages and uncertainty. Describe an observed fluctuation rather than a trend when evidence is insufficient. Never backdate today's crawl.

A dated before/after source snapshot establishes a change observed within that interval. A publication timestamp can narrow it when trustworthy. A newly discovered page is not necessarily newly published. A review-count difference is a net change, not necessarily the number of newly acquired reviews. A snapshot gap is an evidence gap, not proof of inactivity.

Do not turn a competitor's improved score into "they optimized for AI." Report observed public changes (pages, listings, review counts, citations) separately from changes in measured AI answers, then offer possible connections as hypotheses. Their intent, private work, costs and causal impact remain unknown unless documented.

## Report structure

1. Executive answer: what changed and why it matters for the user's stated goal.
2. Our visibility versus the named comparison cohort: previous/current values, dates, definition, sample sizes and coverage.
3. Topic gains/losses and model/location differences on comparable measurements.
4. Competitor changes: entity, observed change, before/after evidence, observation interval, confidence and associated visibility movement.
5. Our work, in four separate columns: recommended, completed (done), confirmed (no longer flagged), outcome measured — without causal attribution.
6. Three priorities for the next period, owner and verification method (reuse the saved Plan; no duplicate tasks).
7. Material coverage gaps and a link to the underlying evidence.

For sparse data, give a shorter report with the unsupported sections marked unavailable. Do not fill them with generic advice or fabricate activity.

## Establishing a baseline

When there is no historical evidence, report the current state and the missing baseline. Offer to start prospective monitoring if supported; do not imply a reconstructed historical report. Gather authorized source snapshots and stable IDs alongside answer observations, so future reports can explain changes.

## Recurrence and delivery

Recommend a cadence appropriate to measurement cost and the business: for example, weekly sampled visibility checks, monthly competitor/action review, and targeted verification after substantial changes. These are proposals, not schedules already configured. More frequent runs may add noise and cost.

A working recurring flow needs scan execution, history retention, comparison, report generation and delivery. Verify each independently. Never assume a schedule or a delivery exists without a tool result showing it. If only reminders are available, label them reminders; do not promise automatic scans.

Configure supported recurrence only after the user requests it. Confirm saved schedule/job ID, timezone, next run, scope, destination and known cost/limits from tool results. Use existing schedules to avoid duplicates. Report failures or partial coverage honestly. Do not send a report to another person without explicit authorization. If scheduling is unavailable, describe the setup gap and provide an on-demand report or manual follow-up.

## Existing project reports and tasks

Load the relevant shared report (`reports`: findings, recommendations, evidence, disclosures — no plan or task status) and the current plan tasks (`next_steps`). Use the relevant saved report before generating a new one. State the report's snapshot date and source scans; the report is historical. Show current task state separately, with its own timestamp, rather than rewriting the report. Preserve persisted recommendation priority and its explanation; mark any new assistant suggestion as a draft. Never treat done, verified, measured visibility change and causal effect as the same state. See plan-improvements/references/plans-and-tasks.md for details.

## Current schedule capability

Read the Schedules section of [scans-schedules-prompts.md](../../run-a-scan/references/scans-schedules-prompts.md) before scheduling. Specific to reviews: `measure_plan`'s settings may show a weekly or monthly cycle set on the web; `measure_schedule` would switch it to daily. No chat tool creates, generates or delivers a recurring review or report — never claim one was set up.

## Tools for "what changed?"

- **What changed?** `visibility` view history (dated points, oldest first; `since` / `until`; `compare` two named periods: each one's means and the change, withheld across different panels), `did_it_work` (equal spans before and after a date, with the comparability verdict), `measure_plan` (its settings). Matched periods and scope; a history of scores is not a record of competitor activity.
- **Citation changes** (same call, with `since`, `until` or `compare`; the citation part of the answer): citations lost (cited in one scan, not in the next, same prompt, engine and location), gaps of three or more scans in a row, and prompts where a competitor is cited and the brand is not, from the latest scan. Each is observed in the AI answers for that prompt, engine and location: say what the answers did, never why. Answers without citation attribution are unmeasured, not "not cited": say how many there were. If the period had more scans than were compared, say so. Competitor-set changes mark the scans where the competitor set changed, and gaps across them are flagged.
- History points alone carry no comparability verdict: never compute a like-for-like change from them yourself. Give each period's values, or the change `did_it_work` reports, with its reason when withheld.
