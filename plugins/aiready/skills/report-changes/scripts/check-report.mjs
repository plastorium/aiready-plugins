// Form check for a draft report or monthly review (ADR-311). Pure: JSON stdin → JSON stdout.
//
// Library: checkReport({ draft, kind? }) returns the result object and throws an Error on bad input.
// CLI: reads JSON from stdin, writes JSON to stdout.
// Exit 0 on success; bad input writes {"error": "..."} and exits 1.
// It checks form only: the numbers still come from AIReady tools, and an association is never a cause.

import process from "node:process";

const KINDS = new Set(["period_comparison", "snapshot"]);

// Months, English and Russian, any case or inflection. "may" counts only with a day or year, or after "in".
const MONTH_RE = new RegExp(
  [
    String.raw`(?<!\p{L})(?:january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)(?!\p{L})`,
    String.raw`(?<!\p{L})may(?=\s+\d)(?!\p{L})`,
    String.raw`(?<=\b(?:in|since|from|until|to|for)\s+)may(?!\p{L})`,
    String.raw`(?<!\p{L})(?:январ|феврал|март|апрел|ма[йяю]|июн|июл|август|сентябр|октябр|ноябр|декабр)\p{L}*`,
  ].join("|"),
  "giu",
);
const ISO_RE = /(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)/g;
const QUARTER_RE = /(?<![\p{L}\d])Q([1-4])(?![\p{L}\d])/giu;

const PERCENT_RE = /(?<![\p{L}\d])\d+(?:[.,]\d+)?\s?%/gu;
// A count: "N of M", "N out of M", "N из M".
const COUNT_RE = /(?<![\p{L}\d.,])\d+\s+(?:of|out\s+of|из)\s+\d+(?!\d)/giu;

// "up" and "down" state a change only before an amount or from/to/by:
// "set up tracking" and "follow up" are not changes.
const CHANGE_RE =
  /(?<!\p{L})(?:rose|fell|increased|decreased|вырос\p{L}*|снизил\p{L}*|упал\p{L}*)(?!\p{L})|(?<!\p{L})(?:up|down)(?=\s+(?:from|to|by)(?!\p{L})|\s*[+\-−]?\d)|(?<![\p{L}\d])[+\-−]\d+(?:[.,]\d+)?\s?(?:pp|п\.\s?п\.|%)/giu;
const COMPARABLE_RE =
  /(?<!\p{L})(?:comparable|not comparable|same questions|те же вопросы|сопостав\p{L}*)(?!\p{L})/giu;
const NEXT_STEP_RE =
  /(?<!\p{L})(?:next steps?|recommend\p{L}*|рекоменд\p{L}*|we suggest|следующ\p{L}*\s+шаг\p{L}*)/giu;
// Wording that credits a change to the business's own work (or anything else).
const CAUSAL_RE =
  /(?<!\p{L})(?:because\s+(?:of\s+)?(?:we|you|our|your)|caused|led\s+to|thanks\s+to|drove|driven\s+by|resulted\s+in|as\s+a\s+result\s+of|due\s+to\s+(?:our|your)|благодаря|из-за\s+(?:наш|ваш)\p{L}*|привело\s+к|в\s+результате)(?!\p{L})/giu;

const EN_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const RU_MONTHS = [
  "январ",
  "феврал",
  "март",
  "апрел",
  "ма",
  "июн",
  "июл",
  "август",
  "сентябр",
  "октябр",
  "ноябр",
  "декабр",
];

function monthIndex(word) {
  const w = word.toLowerCase();
  if (/^[a-z]/.test(w)) return EN_MONTHS.indexOf(w.slice(0, 3)) + 1;
  return RU_MONTHS.findIndex((prefix) => w.startsWith(prefix)) + 1;
}

// The year written right before or after a month or quarter, if any.
function yearNear(draft, index, length) {
  // A year may follow the day: "March 1, 2026".
  const after =
    /^(?:\s+\d{1,2}(?:st|nd|rd|th)?)?[\s,]{0,3}((?:19|20)\d{2})(?!\d)/.exec(
      draft.slice(index + length),
    );
  if (after) return after[1];
  const before = /(?<!\d)((?:19|20)\d{2})[\s,]{0,3}$/.exec(
    draft.slice(Math.max(0, index - 8), index),
  );
  return before ? before[1] : "";
}

// Distinct periods named: ISO dates, months and quarters, each with its year
// when one is written (March 2025 and March 2026 are two periods).
// The day of month written right after ("March 1", "Sep 21st") or before
// ("1 March", "31 марта") a month name, if any.
function dayNear(draft, index, length) {
  // A day only when what follows is what follows a date (end, punctuation,
  // a year, a connective), never a measurement: "March 10%", "March 2 of 20",
  // "March 2.5", "March 2,000" are numbers, "March 1, 2026" and "March 1 and March 31" days.
  const after =
    /^\s+(\d{1,2})(?:st|nd|rd|th)?(?=\s*$|\s*(?:,(?!\d)|[;:)\]–—])|\.(?!\d)|\s+(?:(?:19|20)\d{2}(?!\d)|and|vs\.?|versus|to|through|until|-|и|по|до|против|или)(?![\p{L}\d]))/iu.exec(
      draft.slice(index + length),
    );
  // An ordinal ("21st") is a day whatever follows it.
  const ordinal = /^\s+(\d{1,2})(?:st|nd|rd|th)(?![\p{L}\d])/iu.exec(
    draft.slice(index + length),
  );
  const before = /(?<![\d.:])(\d{1,2})(?:st|nd|rd|th)?\s+$/i.exec(
    draft.slice(Math.max(0, index - 6), index),
  );
  const day = Number((after ?? ordinal ?? before)?.[1]);
  return day >= 1 && day <= 31 ? String(day) : "";
}

function periodsNamed(draft) {
  const found = new Set();
  for (const m of draft.matchAll(ISO_RE)) found.add(`date:${m[0]}`);
  // A month with a day is a date, so March 1 and March 31 are two periods.
  for (const m of draft.matchAll(MONTH_RE))
    found.add(
      `month:${yearNear(draft, m.index, m[0].length)}-${monthIndex(m[0])}-${dayNear(draft, m.index, m[0].length)}`,
    );
  for (const m of draft.matchAll(QUARTER_RE))
    found.add(`quarter:${yearNear(draft, m.index, m[0].length)}-${m[1]}`);
  // A month read without a day may be the same date in another sentence
  // shape (March 1 and March 1 in …), so it is a period of its own only
  // when no dated mention of that month exists.
  return [...found].filter(
    (k) =>
      !(
        k.startsWith("month:") &&
        k.endsWith("-") &&
        [...found].some((o) => o !== k && o.startsWith(k))
      ),
  );
}

function sentences(draft) {
  return draft.split(/(?<=[.!?])\s+|\n+/u).filter((s) => s.trim() !== "");
}

const check = (id, pass, yes, no) => ({ id, pass, reason: pass ? yes : no });
const has = (re, text) => [...text.matchAll(re)].length > 0;

function validated(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be a JSON object");
  }
  if (typeof input.draft !== "string") {
    throw new Error("draft must be a string");
  }
  const kind = input.kind ?? "period_comparison";
  if (!KINDS.has(kind)) {
    throw new Error("kind must be period_comparison or snapshot");
  }
  return { draft: input.draft, kind };
}

function periodCheck(draft, kind) {
  const periods = periodsNamed(draft).length;
  const needed = kind === "period_comparison" ? 2 : 1;
  return check(
    "period",
    periods >= needed,
    `names ${periods} period(s)`,
    `names ${periods} period(s); a ${kind} needs at least ${needed}`,
  );
}

const SOURCE_RE = /(?<!\p{L})(?:web|API|веб|интерфейс\p{L}*)(?!\p{L})/iu;
// An engine by name: the generic word ("engines", "движок") names none.
const ENGINE_RE =
  /(?<!\p{L})(?:ChatGPT|Claude|Gemini|Perplexity|Copilot|AI Overviews?|AI Mode|Grok|DeepSeek|YandexGPT|Алиса|GigaChat|Qwen)(?!\p{L})/iu;

// Every percentage needs an "N of M" count in its own sentence.
function percentsWithoutCountIn(draft) {
  const out = [];
  for (const s of sentences(draft)) {
    const percents = [...s.matchAll(PERCENT_RE)].map((m) => m[0].trim());
    if (percents.length > 0 && !has(COUNT_RE, s)) out.push(...percents);
  }
  return out;
}

function denominatorCheck(draft, missing) {
  const detail = has(COUNT_RE, draft)
    ? `${missing.length} percentage(s) lack a count in their sentence, but the draft has counts`
    : `percentages without a count: ${missing.join(", ")}`;
  return check(
    "denominator",
    missing.length === 0,
    "every percentage has a count",
    detail,
  );
}

function comparabilityCheck(draft, kind) {
  const changed = has(CHANGE_RE, draft);
  if (kind !== "period_comparison" || !changed) {
    return check(
      "comparability",
      true,
      changed ? "not a period comparison" : "no change stated",
    );
  }
  return check(
    "comparability",
    has(COMPARABLE_RE, draft),
    "change stated with comparability wording",
    "change stated without comparability",
  );
}

export function checkReport(input) {
  const { draft, kind } = validated(input);
  const percentsWithoutCount = percentsWithoutCountIn(draft);
  const causalPhrases = [
    ...new Set([...draft.matchAll(CAUSAL_RE)].map((m) => m[0])),
  ];
  const checks = [
    periodCheck(draft, kind),
    check(
      "source",
      SOURCE_RE.test(draft),
      "names the measurement source",
      "does not name the measurement source (web, web interface or API)",
    ),
    check(
      "engines",
      ENGINE_RE.test(draft),
      "names an engine",
      "names no engine",
    ),
    denominatorCheck(draft, percentsWithoutCount),
    comparabilityCheck(draft, kind),
    check(
      "next_step",
      has(NEXT_STEP_RE, draft),
      "names a next step",
      "no next step or recommendation",
    ),
    check(
      "no_causation",
      causalPhrases.length === 0,
      "no causal wording",
      `causal wording: ${causalPhrases.join(", ")}`,
    ),
  ];
  return {
    ok: checks.every((c) => c.pass),
    checks,
    percentsWithoutCount,
    causalPhrases,
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
    process.stdout.write(`${JSON.stringify(checkReport(input))}\n`);
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
