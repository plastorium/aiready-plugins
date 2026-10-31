# Skill scripts

Some skills ship small Node.js helpers under `scripts/`. Every one has the
same shape:

- **Run** from the skill's directory, where this chat app can run code:
  `echo '<input JSON>' | node scripts/<name>.mjs` (Node 18 or later). Run it;
  reading its source teaches nothing the contract below does not.
- **Input** one JSON object on stdin. **Output** one JSON object on stdout;
  exit 1 with `{"error": "<message>"}` on bad input.
- **Never** a network call, a file read or an AIReady call. Its output checks
  or formats your work; it is not evidence. Numbers still come from AIReady
  tools (core rule 1).
- **When it cannot run** (no code execution, an error, or output that is not
  the JSON described): do the step yourself and never state the value the
  script would have produced as if it had. Say it was not checked, or ask.

## `scripts/lint-answer.mjs` (this skill): numbers and scope in a draft

- **Run when** a draft answer cites numbers, before sending it.
- **Input** `{"draft": "<your answer>", "toolResults": [<the AIReady results you used>], "userText": "<what the person said>"}`.
- **Output** `{"ok", "claims", "unsupported", "missingScope"}`. The
  unsupported list holds numbers in the draft that no result or the person
  gave, nor a ratio, percentage or difference of them; the missing-scope list
  names which of date, engines, source, questions the draft leaves out.
- **Then** take each unsupported number from a result, or drop it; name each
  missing scope item (core rule 8).

## Other skills' scripts

Each is described, as input and output, in its own skill's
`references/scripts.md`:

- `report-changes/scripts/resolve-period.mjs`: "last month" and similar → exact dates in the business's time zone, ready for `visibility` view history.
- `report-changes/scripts/check-report.mjs`: a report draft checked for period, source, engines, counts behind percentages, comparability, a next step and no causal claims.
- `understand-my-business/scripts/parse-list.mjs`: a pasted list of competitors or questions, cleaned, deduplicated and with suspicious rows flagged.
- `plan-improvements/scripts/export-plan.mjs`: the tasks AIReady returned, as CSV, TSV or a Markdown table.
