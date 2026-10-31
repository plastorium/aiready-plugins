# Plan export script

How to run a skill script, and what to do when it cannot run:
[skill-scripts.md](../../aiready/references/skill-scripts.md).

## `scripts/export-plan.mjs`: the plan's tasks → a table file

- **Run when** the person asks for the plan as a CSV, a spreadsheet or a
  Markdown table, after reading the tasks with `next_steps`.
- **Input** `{"tasks": [<tasks as the tool returned them>], "format": "csv"}`;
  `format` is `csv`, `tsv` or `markdown`. Optional `columns` (any of `title`,
  `status`, `priority`, `owner`, `due`, `url`, `notes`, in the order wanted;
  default all but `notes`) and `locale` (`en` or `ru`, for the headers).
- **Output** `{"format", "content", "rowCount", "skipped"}`: the file text,
  its row count, and the indexes of items that were not tasks.
- **Then** hand over the content as it is and name any skipped items. A
  missing owner or due date stays an empty cell; a cell that starts like a
  spreadsheet formula gets a leading apostrophe.
- **By hand**, when it cannot run: the same columns from the same tasks, no
  value added or filled in, and say the file was formatted by hand.
