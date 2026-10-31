// Pasted list preparation for the understand-my-business skill (ADR-311). Pure: JSON stdin → JSON stdout.
//
// Library: parseList({ text, kind }) returns the result object and throws an Error on bad input.
// kind is "competitors" (CSV or lines of name and website) or "questions" (one question per line).
// CLI: reads JSON from stdin, writes JSON to stdout. Exit 0 on success; bad input writes
// {"error": "..."} and exits 1.

import process from "node:process";

const MAX_ROWS = 2000;
const MAX_QUESTION_CHARS = 300;
const KINDS = new Set(["competitors", "questions"]);
const NAME_HEADERS = new Set(["name", "компания"]);
const URL_HEADERS = new Set(["url", "website", "domain", "сайт"]);
const QUESTION_HEADERS = new Set([
  "question",
  "questions",
  "prompt",
  "prompts",
  "text",
  "вопрос",
  "вопросы",
]);
// Instruction-like content, EN and RU. Flagged for review only; never acted on.
const INSTRUCTION_RE =
  /ignore\s+(?:all|previous)\s+instructions|system\s+prompt|you\s+are\s+now|run\s+a\s+scan|start\s+a\s+scan|\bdelete\b|игнорируй|запусти\s+скан|удали/iu;
// A cell a spreadsheet would read as a formula.
const FORMULA_RE = /^[=+\-@]/;
const DOMAIN_LIKE_RE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#].*)?$/i;
const URL_PARTS_RE = /^(https?):\/\/([^/?#@\s]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;
const HOST_RE = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

// Number of occurrences of ch outside double quotes.
function countOutsideQuotes(line, ch) {
  let inQuote = false;
  let n = 0;
  for (const c of line) {
    if (c === '"') inQuote = !inQuote;
    else if (c === ch && !inQuote) n++;
  }
  return n;
}

// The candidate separator that occurs most often outside quotes, or null.
function pickDelimiter(line, candidates) {
  let best = null;
  let bestCount = 0;
  for (const ch of candidates) {
    const n = countOutsideQuotes(line, ch);
    if (n > bestCount) {
      best = ch;
      bestCount = n;
    }
  }
  return best;
}

// Splits one line into trimmed cells. A cell that starts with a quote may hold the delimiter; "" is a quote.
function splitCells(line, delim) {
  const cells = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuote = false;
      } else cur += ch;
    } else if (ch === '"' && cur.trim() === "") {
      inQuote = true;
      cur = "";
    } else if (ch === delim) {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function cellsOf(raw) {
  return splitCells(raw, pickDelimiter(raw, ["\t", ";", ","]));
}

function looksLikeUrl(cell) {
  return (
    cell.includes("://") || (!/\s/.test(cell) && DOMAIN_LIKE_RE.test(cell))
  );
}

// Normalizes a website: https:// when no scheme, lowercase host, no trailing slash, domain without "www.".
function normalizeUrl(raw) {
  const s = raw.trim();
  if (!s) return { url: null, domain: null, bad: false };
  const bad = { url: s, domain: null, bad: true };
  if (/\s/.test(s)) return bad;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`;
  const m = URL_PARTS_RE.exec(withScheme);
  if (!m) return bad;
  const host = m[2].replace(/:\d+$/, "").toLowerCase();
  if (!HOST_RE.test(host)) return bad;
  const path = (m[3] ?? "").replace(/\/+$/, "");
  const query = m[4] ?? "";
  return {
    url: `${m[1].toLowerCase()}://${host}${path}${query}`,
    domain: host.replace(/^www\./, ""),
    bad: false,
  };
}

// The question text of one line: list marker, surrounding quotes and spaces removed.
// One question per line keeps its commas and semicolons. Only a spreadsheet
// paste (tabs) or a quoted CSV row ("…",…) is split into cells.
function questionDelim(raw) {
  if (raw.includes("\t")) return "\t";
  return /^\s*"(?:[^"]|"")*"\s*,/.test(raw) ? "," : null;
}

function cleanQuestion(cell) {
  const noMarker = cell
    .trim()
    .replace(/^(?:\d+[.)]|[-*•])(?:\s+|$)/, "")
    .trim();
  return noMarker.replace(/^["“«]+|["”»]+$/g, "").trim();
}

// The question text of one line. Under a header row every line is split with
// the header's delimiter and read at its question column, so a missing cell
// stays empty: another column (notes, metadata) never stands in for it.
// Without a header a line is one question, commas and all.
function questionText(raw, table) {
  if (table)
    return cleanQuestion(splitCells(raw, table.delim)[table.col] ?? "");
  const delim = questionDelim(raw);
  return cleanQuestion(delim ? (splitCells(raw, delim)[0] ?? "") : raw);
}

// The delimiter and question column a header row names, or null when the row
// is not a header ("question", "id,question", "id\tprompt").
function questionHeader(raw) {
  for (const delim of ["\t", ";", ","]) {
    if (!raw.includes(delim)) continue;
    const cells = splitCells(raw, delim);
    // A tab is a spreadsheet paste, so any label length goes. A comma or
    // semicolon also occurs in prose, so there a header needs short labels
    // and no question mark: a question that mentions "text" between commas
    // is not one.
    if (
      delim !== "\t" &&
      (raw.includes("?") ||
        cells.some((c) => cleanQuestion(c).split(/\s+/).length > 3))
    )
      continue;
    const col = cells.findIndex((c) =>
      QUESTION_HEADERS.has(cleanQuestion(c).toLowerCase()),
    );
    if (col >= 0) return { delim, col };
  }
  return QUESTION_HEADERS.has(cleanQuestion(raw).toLowerCase())
    ? { delim: null, col: 0 }
    : null;
}

// Groups rows by key; every later occurrence pairs with the first.
function findDuplicates(keyed) {
  const first = new Map();
  const duplicates = [];
  const dupLines = new Set();
  for (const { line, key } of keyed) {
    if (!key) continue;
    if (first.has(key)) {
      duplicates.push({ lines: [first.get(key), line], key });
      dupLines.add(line);
    } else first.set(key, line);
  }
  return { duplicates, dupLines };
}

// Header row detection: only the first non-empty line can be a header.
function takeHeader(items, isHeader) {
  if (items.length && isHeader(items[0].raw)) return items.shift();
  return null;
}

function parseCompetitors(items) {
  // One delimiter for the whole table, read from its first line (the header
  // when there is one): a comma inside a tab-separated cell is not a column.
  const tableDelim = items.length
    ? pickDelimiter(items[0].raw, ["\t", ";", ","])
    : null;
  const rowCells = (raw) =>
    tableDelim ? splitCells(raw, tableDelim) : cellsOf(raw);
  const header = takeHeader(items, (raw) =>
    cellsOf(raw).some((c) => {
      const k = c.toLowerCase();
      return NAME_HEADERS.has(k) || URL_HEADERS.has(k);
    }),
  );
  let nameCol = null;
  let urlCol = null;
  if (header) {
    const keys = rowCells(header.raw).map((c) => c.toLowerCase());
    const n = keys.findIndex((k) => NAME_HEADERS.has(k));
    const u = keys.findIndex((k) => URL_HEADERS.has(k));
    nameCol = n >= 0 ? n : null;
    urlCol = u >= 0 ? u : null;
  }
  if (items.length > MAX_ROWS) throw new Error("too many rows");

  const built = items.map(({ line, raw }) => {
    const cells = rowCells(raw);
    const urlIdx = urlCol ?? cells.findIndex(looksLikeUrl);
    const nameIdx =
      nameCol ?? cells.findIndex((c, i) => i !== urlIdx && c !== "");
    const name = (cells[nameIdx] ?? "") || null;
    const norm = normalizeUrl(urlIdx >= 0 ? (cells[urlIdx] ?? "") : "");
    const issues = [];
    if (!name) issues.push("no_name");
    if (!norm.url) issues.push("no_url");
    if (norm.bad) issues.push("bad_url");
    const suspicious = cells.some(
      (c) => INSTRUCTION_RE.test(c) || FORMULA_RE.test(c),
    );
    const key = norm.domain ?? (name ? name.toLowerCase() : null);
    return {
      row: { line, name, url: norm.url, domain: norm.domain, issues },
      key,
      suspicious,
    };
  });

  const { duplicates } = findDuplicates(
    built.map((b) => ({ line: b.row.line, key: b.key })),
  );
  return {
    rows: built.map((b) => b.row),
    duplicates,
    invalid: built.filter((b) => b.row.issues.length).map((b) => b.row.line),
    suspicious: built.filter((b) => b.suspicious).map((b) => b.row.line),
  };
}

function parseQuestions(items) {
  const header = takeHeader(items, (raw) => questionHeader(raw) !== null);
  const found = header ? questionHeader(header.raw) : null;
  // A one-column header ("question") adds no delimiter: lines stay whole.
  const table = found?.delim ? found : null;
  if (items.length > MAX_ROWS) throw new Error("too many rows");

  const built = items.map(({ line, raw }) => {
    const text = questionText(raw, table);
    const issues = [];
    if (!text) issues.push("empty");
    if (text.length > MAX_QUESTION_CHARS) issues.push("too_long");
    const key = text ? text.toLowerCase().replace(/\s+/g, " ").trim() : null;
    return {
      row: { line, text, issues },
      key,
      suspicious: INSTRUCTION_RE.test(text) || FORMULA_RE.test(text),
    };
  });

  const { duplicates, dupLines } = findDuplicates(
    built.map((b) => ({ line: b.row.line, key: b.key })),
  );
  for (const b of built) {
    if (dupLines.has(b.row.line)) b.row.issues.push("duplicate");
  }
  return {
    rows: built.map((b) => b.row),
    duplicates,
    invalid: built
      .filter(
        (b) =>
          b.row.issues.includes("empty") || b.row.issues.includes("too_long"),
      )
      .map((b) => b.row.line),
    suspicious: built.filter((b) => b.suspicious).map((b) => b.row.line),
  };
}

export function parseList(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object");
  }
  const { text, kind } = input;
  if (typeof text !== "string") throw new Error("text must be a string");
  if (!KINDS.has(kind)) {
    throw new Error('kind must be "competitors" or "questions"');
  }
  const items = [];
  text
    .replace(/^\uFEFF/, "")
    .split(/\r\n|\r|\n/)
    .forEach((raw, i) => {
      if (raw.trim() !== "") items.push({ line: i + 1, raw });
    });

  const result =
    kind === "competitors" ? parseCompetitors(items) : parseQuestions(items);
  return { kind, ...result };
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
    process.stdout.write(`${JSON.stringify(parseList(input))}\n`);
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
