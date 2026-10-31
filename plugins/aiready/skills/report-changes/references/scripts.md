# Skill scripts

Two helpers under `scripts/`. How to run one, and what to do when it cannot
run: [skill-scripts.md](../../aiready/references/skill-scripts.md). Run them;
there is no need to read their source.

## `scripts/resolve-period.mjs`: a relative period → exact dates

- **Run when** the person names a relative period: last month, this month,
  last week, last 7 or 30 days, last quarter.
- **Input** `{"now": "<ISO instant with offset>", "timeZone": "<IANA zone>", "period": "last_month"}`.
  The period is one of
  `last_month | this_month | last_week | last_7_days | last_30_days | last_quarter`.
  The zone is the business's, not the server's or UTC.
- **Output** `current` and `previous` (`from`, `to`: inclusive YYYY-MM-DD),
  `label` (e.g. "August 2026 vs July 2026"), and `compare`: the same ranges as
  date-times with the zone's offset, `to` exclusive. Pass `compare` unchanged
  to `visibility` view history; say `label` back for correction.
- **Meaning** last month = the previous full calendar month vs the one before;
  this month = month to date vs the same number of days of last month; last
  week = the previous Monday–Sunday; last N days = the N days before today,
  today excluded.
- **Error** `{"error"}` for a bad zone, a date that does not exist or an
  unknown period.

## `scripts/check-report.mjs`: form check of a report draft

- **Run when** a report or monthly review draft is ready, before sending it.
- **Input** `{"draft": "<text>", "kind": "period_comparison"}`, or
  `"kind": "snapshot"` for one date or period.
- **Output** `{"ok", "checks": [{"id", "pass", "reason"}], "percentsWithoutCount", "causalPhrases"}`.
  The check ids: period (two periods named for a comparison, one for a
  snapshot), source (web or API), engines (an engine by name; "all engines"
  names none), denominator (each percentage has an "N of M" in the same
  sentence), comparability (a stated change says whether the questions are
  comparable), next_step, no_causation.
- **Then** fix each failed check and send. It checks form, never figures:
  those still come from AIReady tools (core rule 1). A listed causal phrase
  becomes timing wording ("rose after the FAQ went live"), never an effect of
  the work ([reporting.md](reporting.md), "Historical comparison").
