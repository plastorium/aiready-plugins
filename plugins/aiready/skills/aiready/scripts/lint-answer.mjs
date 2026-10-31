// Provenance and scope lint for a draft AIReady answer (ADR-311). Pure: JSON stdin → JSON stdout.
//
// Library: lintAnswer({ draft, toolResults, userText?, derive? }) returns the result object and
// throws an Error on bad input. CLI: reads JSON from stdin, writes JSON to stdout.
// Exit 0 on success; bad input writes {"error": "..."} and exits 1.

import process from "node:process";

const MAX_SOURCE_NUMBERS = 400;

// A number: thousands with comma/space/nbsp groups of three digits, or plain digits, optional decimal part.
const NUM = String.raw`(?:\d{1,3}(?:[ \u00a0\u202f,]\d{3})+|\d+)(?:[.,]\d+)?`;
const PRE = String.raw`(?<![\p{L}\d])`;
const POST = String.raw`(?![\p{L}\d])`;
const DATE_SRC = String.raw`(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)`;

const AXES = [
  {
    name: "date",
    re: new RegExp(
      [
        String.raw`\d{4}-\d{2}-\d{2}`,
        String.raw`(?<!\p{L})(?:january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?!\p{L})`,
        String.raw`(?<!\p{L})may(?=\s+\d)`,
        String.raw`(?<!\p{L})(?:январ|феврал|март|апрел|июн|июл|август|сентябр|октябр|ноябр|декабр)\p{L}*`,
        String.raw`(?<!\p{L})ма[йя](?!\p{L})`,
      ].join("|"),
      "iu",
    ),
  },
  {
    name: "engines",
    re: /(?<!\p{L})(?:ChatGPT|Claude|Gemini|Perplexity|Copilot|AI Overviews|engines?)(?!\p{L})|(?<!\p{L})движ\p{L}*/iu,
  },
  // Whole words only: "website" is not the web source, "promptly" not a prompt.
  {
    name: "source",
    re: /(?<!\p{L})(?:web|API|interface|веб|интерфейс\p{L}*)(?!\p{L})/iu,
  },
  {
    name: "questions",
    re: /(?<!\p{L})(?:questions?|prompts?|вопрос\p{L}*)(?!\p{L})/iu,
  },
];

function blank(match) {
  return match.replace(/[^\n]/g, " ");
}

// Masks ordinals at line start, code spans and URLs with spaces (indices preserved).
function prepareDraft(draft) {
  const noOrdinals = draft.replace(
    /^([ \t]*)\d+[.)](?=\s|$)/gm,
    (m, ws) => ws + " ".repeat(m.length - ws.length),
  );
  return noOrdinals.replace(
    /```[\s\S]*?```|`[^`\n]*`|https?:\/\/[^\s)\]>]+|www\.[^\s)\]>]+/gi,
    blank,
  );
}

// Parses one number token. "1,200" and "1 200" are thousands; "10,5" and "10.5" are decimals.
function parseNum(text) {
  const s = text.trim();
  let intPart;
  let dec;
  let m = /^(\d{1,3}(?:[ \u00a0\u202f,]\d{3})+)(?:[.,](\d+))?$/.exec(s);
  if (m) {
    intPart = m[1].replace(/[ \u00a0\u202f,]/g, "");
    dec = m[2] ?? "";
  } else {
    m = /^(\d+)(?:[.,](\d+))?$/.exec(s);
    if (!m) return null;
    intPart = m[1];
    dec = m[2] ?? "";
  }
  return {
    value: Number(dec ? `${intPart}.${dec}` : intPart),
    decimals: dec.length,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/g;
// A clock time of day, HH:MM or HH:MM:SS. A UTC offset ("+02:00", "-05:00") is not one.
const TOD_RE = /(?<![\d:+\-−])([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?![\d:])/g;
// Written dates ("20 Sep 2026", "Sep 20, 2026", "20 сентября"): masked in the
// draft so their parts are not number claims; never added to the source pool.
const MONTH_WORD = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?|(?:январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)\p{L}*`;
const WRITTEN_DATE_SRC = String.raw`(?<![\p{L}\d])(?:\d{1,2}\s+(?:${MONTH_WORD})(?:\s+\d{4})?|(?:${MONTH_WORD})\s+\d{1,2}(?:,?\s+\d{4})?)(?![\p{L}\d])`;

// A four-digit number is a year only in one of these contexts (otherwise it is a number claim).
const MONTH_CTX = String.raw`(?<!\p{L})(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?|(?<!\p{L})(?:январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)\p{L}*`;
const YEAR_BEFORE = new RegExp(
  String.raw`(?:(?<!\p{L})(?:in|since|from|by|until|through|during|в|с|до|по|за)|${MONTH_CTX})\.?,?\s+$`,
  "iu",
);
const YEAR_AFTER = /^(?:-\d{2}(?!\d)|\s*(?:г\.|год(?:а|у)?(?!\p{L})))/iu;

const MONTH_PREFIXES = [
  ["jan", "январ"],
  ["feb", "феврал"],
  ["mar", "март"],
  ["apr", "апрел"],
  ["may", "ма"],
  ["jun", "июн"],
  ["jul", "июл"],
  ["aug", "август"],
  ["sep", "сентябр"],
  ["oct", "октябр"],
  ["nov", "ноябр"],
  ["dec", "декабр"],
];

function writtenDateSupported(text, dates) {
  const lower = text.toLowerCase();
  const word = /\p{L}+/u.exec(lower)?.[0] ?? "";
  const month = MONTH_PREFIXES.findIndex(([en, ru]) =>
    en === "may"
      ? word === "may" || /^ма[йя]$/.test(word)
      : word.startsWith(en) || word.startsWith(ru),
  );
  if (month < 0) return false;
  const nums = (lower.match(/\d+/g) ?? []).map(Number);
  const year = nums.find((n) => n >= 1900);
  const day = nums.find((n) => n >= 1 && n <= 31);
  const mmdd = `-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  for (const d of dates) {
    if (d.endsWith(mmdd) && (year === undefined || d.startsWith(`${year}-`)))
      return true;
  }
  return false;
}

// A draft clock time is supported by a sourced time that equals it, or that carries it to seconds.
function timeSourced(text, times) {
  for (const t of times) {
    if (
      t === text ||
      (t.length > text.length && t.startsWith(text) && t[text.length] === ":")
    )
      return true;
  }
  return false;
}

function collectString(str, acc) {
  // IDs and links carry digits that are not measurements.
  if (UUID_RE.test(str) || /^https?:\/\//i.test(str)) return;
  for (const m of str.matchAll(TOD_RE)) acc.times.add(m[0]);
  const noTime = str
    .replace(TIME_RE, (t) => " ".repeat(t.length))
    .replace(TOD_RE, (t) => " ".repeat(t.length));
  const stripped = noTime.replace(new RegExp(DATE_SRC, "g"), (d) => {
    acc.dates.add(d);
    return " ".repeat(d.length);
  });
  // A sign counts only when it is not glued to a word or digit ("x-24" is not -24).
  const numRe = new RegExp(
    String.raw`(?:(?<![\p{L}\d])([+\-−]))?(${NUM})`,
    "gu",
  );
  for (const m of stripped.matchAll(numRe)) {
    const parsed = parseNum(m[2]);
    if (!parsed) continue;
    const negative = m[1] === "-" || m[1] === "−";
    acc.nums.push(negative ? -parsed.value : parsed.value);
  }
}

function collect(value, acc) {
  if (typeof value === "number") {
    if (Number.isFinite(value)) acc.nums.push(value);
  } else if (typeof value === "string") {
    collectString(value, acc);
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, acc);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collect(v, acc);
  }
}

// Sorted pool of every sourced value, signed: raw numbers, fraction-to-percent, and (unless skipped)
// pairwise percentages a/b*100 and differences a-b. Both orders of a pair are generated, so a
// derived difference matches its sign whichever way round the source lists the two numbers.
function buildPool(nums, skipPairs) {
  const values = [...nums];
  for (const x of nums) {
    if (Math.abs(x) <= 1) values.push(x * 100);
  }
  if (!skipPairs) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = 0; j < nums.length; j++) {
        if (i === j) continue;
        const a = nums[i];
        const b = nums[j];
        if (b !== 0) values.push((a / b) * 100);
        values.push(a - b);
      }
    }
  }
  return Float64Array.from(values).sort();
}

// True when some pool value rounds to the claim at the decimals shown (half a unit of the last digit).
function isSourced(value, decimals, pool) {
  const tol = 0.5 * 10 ** -decimals + 1e-9;
  const target = value - tol;
  let lo = 0;
  let hi = pool.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (pool[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo < pool.length && pool[lo] <= value + tol;
}

function addNumberClaim(found, pools, { raw, text, index, sign = "", kind }) {
  const parsed = parseNum(raw);
  if (!parsed) return;
  const negative = sign === "-" || sign === "−";
  const value = negative ? -parsed.value : parsed.value;
  // A signed claim ("−24%") needs a sourced value of that sign; an unsigned one ("fell 24%") matches a magnitude.
  const supported = sign
    ? isSourced(value, parsed.decimals, pools.signed)
    : isSourced(parsed.value, parsed.decimals, pools.magnitude);
  found.push({ index, text, value, kind, supported });
}

function isYearContext(text, m) {
  const end = m.index + m[0].length;
  const before = text.slice(Math.max(0, m.index - 40), m.index);
  const after = text.slice(end, end + 12);
  return YEAR_BEFORE.test(before) || YEAR_AFTER.test(after);
}

// A sign counts only when no letter or digit precedes it ("10-20" is a range). Earlier matches are
// already blanked in `cur`, so this reads `prose`, which keeps every index.
function claimSign(m, prose) {
  const sign = m[1] ?? "";
  return sign && !/[\p{L}\d]/u.test(prose[m.index - 1] ?? "") ? sign : "";
}

// The matched text without a sign that claimSign dropped.
function claimText(m, sign) {
  return sign === m[1] ? m[0].trim() : m[0].trim().slice(m[1].length);
}

// Replaces each match with spaces and reports it; later passes never see matched text.
// onMatch gets the text as it stands before this match is blanked, so it can read the context.
function scan(re, text, onMatch) {
  let cur = text;
  let m;
  while ((m = re.exec(cur)) !== null) {
    onMatch(m, cur);
    cur =
      cur.slice(0, m.index) +
      " ".repeat(m[0].length) +
      cur.slice(m.index + m[0].length);
  }
  return cur;
}

// Kinds that state a point in time or a year, not a measurement: they need no scope.
const NON_MEASUREMENT = new Set(["date", "time", "year"]);

function fail(message) {
  throw new Error(message);
}

export function lintAnswer(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    fail("input must be a JSON object");
  if (typeof input.draft !== "string") fail("draft must be a string");
  if (!Array.isArray(input.toolResults)) fail("toolResults must be an array");
  if (input.userText !== undefined && typeof input.userText !== "string")
    fail("userText must be a string when present");
  if (input.derive !== undefined && typeof input.derive !== "boolean")
    fail("derive must be a boolean when present");

  const acc = { nums: [], dates: new Set(), times: new Set() };
  for (const value of input.toolResults) collect(value, acc);
  if (typeof input.userText === "string") collectString(input.userText, acc);

  // derive: false accepts only numbers a source states (and a fraction as a
  // percentage), never a ratio or difference of two of them: any two
  // unrelated numbers can otherwise "source" a fabricated change.
  const skipPairs =
    input.derive === false || acc.nums.length > MAX_SOURCE_NUMBERS;
  const signed = buildPool(acc.nums, skipPairs);
  const pools = {
    signed,
    magnitude: Float64Array.from(signed, Math.abs).sort(),
  };
  const sourcedYears = new Set(
    [...acc.dates].map((d) => Number(d.slice(0, 4))),
  );
  const prose = prepareDraft(input.draft);
  const found = [];

  let cur = scan(new RegExp(DATE_SRC, "gu"), prose, (m) => {
    found.push({
      index: m.index,
      text: m[0],
      value: m[0],
      kind: "date",
      supported: acc.dates.has(m[0]),
    });
  });

  // Written dates are claims too: supported when a sourced date has the same
  // month and day (and year, when the draft gives one).
  cur = scan(new RegExp(WRITTEN_DATE_SRC, "giu"), cur, (m) => {
    found.push({
      index: m.index,
      text: m[0],
      value: m[0],
      kind: "date",
      supported: writtenDateSupported(m[0], acc.dates),
    });
  });

  cur = scan(new RegExp(TOD_RE.source, "g"), cur, (m) => {
    found.push({
      index: m.index,
      text: m[0],
      value: m[0],
      kind: "time",
      supported: timeSourced(m[0], acc.times),
    });
  });

  cur = scan(
    new RegExp(
      String.raw`${PRE}(${NUM})\s*(?:из|of|out\s+of)\s*(${NUM})${POST}`,
      "giu",
    ),
    cur,
    (m) => {
      addNumberClaim(found, pools, {
        raw: m[1],
        text: m[1],
        index: m.index,
        kind: "ratio",
      });
      addNumberClaim(found, pools, {
        raw: m[2],
        text: m[2],
        index: m.index + m[0].lastIndexOf(m[2]),
        kind: "ratio",
      });
    },
  );

  cur = scan(
    new RegExp(
      String.raw`${PRE}([+\-−]?)(${NUM})\s*(?:pp|п\.\s?п\.)(?!\p{L})`,
      "giu",
    ),
    cur,
    (m) => {
      const sign = claimSign(m, prose);
      addNumberClaim(found, pools, {
        raw: m[2],
        text: claimText(m, sign),
        index: m.index,
        sign,
        kind: "pp",
      });
    },
  );

  cur = scan(
    new RegExp(String.raw`${PRE}([+\-−]?)(${NUM})\s*%`, "giu"),
    cur,
    (m) => {
      const sign = claimSign(m, prose);
      addNumberClaim(found, pools, {
        raw: m[2],
        text: claimText(m, sign),
        index: m.index,
        sign,
        kind: "pct",
      });
    },
  );

  scan(
    new RegExp(String.raw`${PRE}([+\-−]?)(${NUM})${POST}`, "giu"),
    cur,
    (m, text) => {
      const sign = claimSign(m, prose);
      const year = Number(m[2]);
      if (
        !sign &&
        /^\d{4}$/.test(m[2]) &&
        year >= 1900 &&
        year <= 2100 &&
        (sourcedYears.has(year) || isYearContext(text, m))
      ) {
        found.push({
          index: m.index,
          text: m[2],
          value: year,
          kind: "year",
          supported:
            sourcedYears.has(year) || isSourced(year, 0, pools.magnitude),
        });
        return;
      }
      addNumberClaim(found, pools, {
        raw: m[2],
        text: claimText(m, sign),
        index: m.index,
        sign,
        kind: "plain",
      });
    },
  );

  found.sort((a, b) => a.index - b.index);
  const claims = found.map(({ text, value, supported }) => ({
    text,
    value,
    supported,
  }));
  const unsupported = claims.filter((c) => !c.supported).map((c) => c.text);
  // Any measured number (a count as much as a share) needs its scope stated.
  const hasMeasurement = found.some((f) => !NON_MEASUREMENT.has(f.kind));
  const missingScope = hasMeasurement
    ? AXES.filter((a) => !a.re.test(prose)).map((a) => a.name)
    : [];

  const result = {
    ok: unsupported.length === 0,
    claims,
    unsupported,
    missingScope,
  };
  if (skipPairs && input.derive !== false) result.derivationsSkipped = true;
  return result;
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
    process.stdout.write(`${JSON.stringify(lintAnswer(input))}\n`);
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
