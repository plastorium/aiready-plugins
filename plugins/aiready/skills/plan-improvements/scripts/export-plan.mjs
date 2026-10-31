// Table export for the plan's tasks (ADR-311 skill script). Pure: JSON stdin → JSON stdout.
//
// Library: exportPlan({ tasks, format, columns?, locale? }) returns the result object and
// throws an Error on bad input. CLI: reads JSON from stdin, writes JSON to stdout.
// Exit 0 on success; bad input writes {"error": "..."} and exits 1.
// It formats only the tasks the AIReady tool returned: a missing value is an empty cell.

import process from "node:process";

const MAX_TASKS = 1000;
const FORMATS = ["csv", "markdown", "tsv"];
const COLUMNS = ["title", "status", "priority", "owner", "due", "url", "notes"];
const DEFAULT_COLUMNS = ["title", "status", "priority", "owner", "due", "url"];

const LOCALES = {
  en: {
    title: "Title",
    status: "Status",
    priority: "Priority",
    owner: "Owner",
    due: "Due",
    url: "URL",
    notes: "Notes",
  },
  ru: {
    title: "Название",
    status: "Статус",
    priority: "Приоритет",
    owner: "Ответственный",
    due: "Срок",
    url: "Ссылка",
    notes: "Примечания",
  },
};

// First present key wins; null and "" count as missing.
const ALIASES = {
  title: ["title", "name"],
  status: ["status", "state"],
  priority: ["priority"],
  owner: ["owner", "assignee"],
  due: ["dueDate", "due", "due_date"],
  url: ["url", "pageUrl", "planUrl"],
  notes: ["notes", "description"],
};

// The tool nests free text under untrustedContent; read it there when no top-level key is set.
const NESTED = { title: "title", owner: "owner", notes: "description" };

function isPresent(v) {
  return v !== undefined && v !== null && v !== "";
}

function pick(task, field) {
  for (const key of ALIASES[field]) {
    if (isPresent(task[key])) return task[key];
  }
  const nested = NESTED[field];
  const content = task.untrustedContent;
  if (
    nested &&
    content &&
    typeof content === "object" &&
    isPresent(content[nested])
  ) {
    return content[nested];
  }
  return "";
}

// A number is an epoch-millisecond date only in the due column.
function isoDay(ms) {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function cellText(field, value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return field === "due" ? isoDay(value) : String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string").join("; ");
  }
  return "";
}

// Spreadsheets run a cell that starts like a formula; a leading apostrophe stops that.
const FORMULA_START = /^[=+\-@\t\r]/;
function guard(text) {
  return FORMULA_START.test(text) ? `'${text}` : text;
}

function csvCell(text) {
  const safe = guard(text);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function tsvCell(text) {
  return guard(text).replace(/[\t\r\n]/g, " ");
}

function mdCell(text) {
  return text.replace(/\|/g, "\\|").replace(/\r\n|\r|\n/g, "<br>");
}

function render(format, headers, rows) {
  if (format === "markdown") {
    const line = (cells) => `| ${cells.map(mdCell).join(" | ")} |`;
    const divider = headers.map(() => "---");
    return [line(headers), line(divider), ...rows.map(line)].join("\n") + "\n";
  }
  const isCsv = format === "csv";
  const sep = isCsv ? "," : "\t";
  const eol = isCsv ? "\r\n" : "\n";
  const cell = isCsv ? csvCell : tsvCell;
  return [headers, ...rows]
    .map((cells) => cells.map(cell).join(sep) + eol)
    .join("");
}

export function exportPlan(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be a JSON object");
  }
  const { tasks, format, columns, locale } = input;
  if (!FORMATS.includes(format)) {
    throw new Error(`format must be one of: ${FORMATS.join(", ")}`);
  }
  const lang = locale ?? "en";
  if (typeof lang !== "string" || !Object.hasOwn(LOCALES, lang)) {
    throw new Error("locale must be en or ru");
  }
  const cols = columns === undefined ? DEFAULT_COLUMNS : columns;
  if (!Array.isArray(cols) || cols.length === 0) {
    throw new Error("columns must be a non-empty array");
  }
  for (const c of cols) {
    if (!COLUMNS.includes(c)) throw new Error(`unknown column: ${String(c)}`);
  }
  if (!Array.isArray(tasks)) throw new Error("tasks must be an array");
  if (tasks.length > MAX_TASKS) {
    throw new Error(`at most ${MAX_TASKS} tasks; got ${tasks.length}`);
  }

  const labels = LOCALES[lang];
  const skipped = [];
  const rows = [];
  tasks.forEach((task, index) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      skipped.push(index);
      return;
    }
    rows.push(cols.map((c) => cellText(c, pick(task, c))));
  });

  const headers = cols.map((c) => labels[c]);
  return {
    format,
    rowCount: rows.length,
    content: render(format, headers, rows),
    skipped,
  };
}

// Run main() only when this file is the entry point. `import.meta.main`
// (Node 22.18+) answers that exactly. Older Node falls back to comparing
// paths: import.meta.url reads file:///C:/x on Windows while argv[1] reads
// C:\x, so normalize both spellings before comparing.
function isEntryPoint() {
  if (typeof import.meta.main === "boolean") return import.meta.main;
  const argv = process.argv[1];
  if (!argv) return false;
  const norm = (p) => {
    let s = p.replace(/\\/g, "/");
    if (/^\/[A-Za-z]:/.test(s)) s = s.slice(1);
    // A drive-letter path is a Windows path, which ignores case.
    return /^[A-Za-z]:/.test(s) ? s.toLowerCase() : s;
  };
  return (
    norm(argv) ===
    norm(decodeURIComponent(import.meta.url.replace(/^file:\/\//, "")))
  );
}

async function main() {
  let raw = "";
  try {
    process.stdin.setEncoding("utf8");
    for await (const chunk of process.stdin) raw += chunk;
    const input = JSON.parse(raw);
    process.stdout.write(`${JSON.stringify(exportPlan(input))}\n`);
    process.exitCode = 0;
  } catch (err) {
    process.stdout.write(
      `${JSON.stringify({ error: err instanceof Error ? err.message : String(err) })}\n`,
    );
    process.exitCode = 1;
  }
}

if (isEntryPoint()) {
  await main();
}
