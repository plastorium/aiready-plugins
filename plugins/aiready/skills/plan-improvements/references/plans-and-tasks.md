# Recommendations, the Plan and verification

## What chat can read

| Source                                   | Contains                                                                                                                                                                                                     | Does not contain                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `next_steps` → recommendations           | `recommendationId`, `priorityLevel` (high/medium/low), `lever`, `effort`, `confidence`, `normalizedImpact`, title and description, `pageUrl`                                                                 | a numeric target or a predicted lift                             |
| `next_steps` → the plan's tasks          | `actionId`, `status` (open/done/verified/dismissed), `doneAt`, `verifiedAt`, `dueDate`, `dependsOnActionIds`, `recommendationId`, `lever`, title, description, `acceptanceCriteria`, `verification`, `owner` | a priority or rationale — ordering comes from the recommendation |
| `next_steps` → `deferredRecommendations` | recommendations parked as "Not now", with any revisit date                                                                                                                                                   | a reminder                                                       |
| `reports` → a report's `result` (frozen) | up to 5 `recommendations[]` (title, rationale, priority, rank, `isHypothesis: true`), findings, evidence, disclosures                                                                                        | live task status, targets, roadmap                               |

Model-estimated targets and roadmaps are not reachable from chat
tools, and shared reports do not include them. Never present a target,
predicted lift or probability unless a tool result in this conversation
contains it; link to the web instead and say it is not available here — never
that AIReady has no model.

## Lifecycle

recommended → accepted (`task_update` accept, creates Plan tasks) → done
(`task_update` done, the person's claim) → no longer flagged (`verified`,
set by AIReady's re-check after `doneAt`) → measured change (a comparable
measurement moved) → cause (never established).

Side paths: dismiss (optional `reason`; closes open tasks; on a plan task it
cannot be undone), later ("Not now", optional future `until` date
`YYYY-MM-DD`; the item returns at the next AIReady check after that day —
not on the day, and not if no check runs; not a reminder message),
bring_back (a parked recommendation, now).

## Finished work — five separate answers (the measured change is report-changes')

`did_it_work` (optional `since`: when the work was done; default the latest
finished work) returns the done and verified tasks, recorded shipments, and
the visibility change over equal spans before and after, or why it is
withheld.

1. **Reported done?** Status done, with `doneAt` — the person's statement.
2. **Still flagged?** `verified` means a re-check after `doneAt` no longer
   raises the recommendation. Say "AIReady no longer flags it", never "a new
   measurement confirmed the fix": the re-check can re-analyse earlier data or
   run with a changed question set, competitor set or extraction.
3. **Measured change?** Only on the comparable subset over matched periods,
   as `did_it_work` reports it; `visibility` view topics for per-topic
   change when comparable.
4. **Enough data?** `did_it_work` withholds a change without at least two
   comparable visibility scans on each side, and says why (no scan since,
   no baseline, different panels). Say that reason.
5. **Caused by the work?** Not established. Offer the timing as context, never
   as proof.

## Duplicates and existing work

Before suggesting any action, check whether an open, done, deferred or
dismissed item already covers it. An existing open action is the answer to
"add a task for X". A dismissed one is not re-proposed without new evidence.
A drafted plan that goes beyond the saved Plan is labelled a draft; saving new
tasks happens on the web (`planUrl`). An existing task's owner and due date
are set on the web Plan or the AIReady Advanced connector, not here.

## A 30-day plan, when asked

At most five rows from the saved Plan and recommendations: action, why
(finding + evidence + scope), owner (as returned, or "not set"), completion
criterion (`acceptanceCriteria` if present), verification (which measurement,
earliest date it can show a change). Qualitative benefit unless a validated
model result is in hand.

## Tools for decisions and progress

- **Where are we? What next?** `next_steps` (optional `status`: open, done, verified, dismissed; past 200 tasks, call it again with the `cursor` its `continuation` returns). Reuse saved tasks; order by the recommendation's `priorityLevel`; a report is historical.
- `task_update`: the person's `decision` on one recommendation or task, by title or id — accept, later (optional `until`), bring_back, dismiss (optional `reason`; `reasonCode: already_covered` when the person says their site already answers a recommendation), done. Free; it never measures. Accepting creates plan work; it is not evidence the work happened. Never dismiss to postpone.
- A task's owner and due date: the person sets them on the web Plan (`planUrl`) or the AIReady Advanced connector.
- `work_log*` (AIReady Advanced connector only; on Standard, send the person there): outside work that matches no recommendation or task, on the person's word; a claim, not a measurement.
- `did_it_work`: the five answers above.
- `brief`, `publication_*` and `topic_improvement*` (`topic_improvement*` on the AIReady Advanced connector only): content briefs, published pages and placements, lever shipments — see [briefs-and-publishing.md](briefs-and-publishing.md).
