// Deterministic period resolver for report-changes (ADR-311). Pure: JSON stdin → JSON stdout.
// Input:  {"now": ISO-8601 instant, "timeZone": IANA zone, "period": last_month|this_month|last_week|last_7_days|last_30_days|last_quarter}
// Output: {"timeZone","today","current":{"from","to"},"previous":{"from","to"},"compare":{current,previous as date-times, to exclusive},"label"} (dates YYYY-MM-DD, inclusive)
import process from "node:process";

const PERIODS = new Set([
  "last_month",
  "this_month",
  "last_week",
  "last_7_days",
  "last_30_days",
  "last_quarter",
]);
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_ABBR = MONTHS.map((m) => m.slice(0, 3));
const DAY_MS = 86400000;
const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

// Day numbers (days since 1970-01-01, UTC) keep all date arithmetic integer-based.
const toDay = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
const fromDay = (n) => {
  const d = new Date(n * DAY_MS);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
};
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (n) => {
  const [y, m, d] = fromDay(n);
  return `${y}-${pad(m)}-${pad(d)}`;
};
const shortDate = (n) => {
  const [y, m, d] = fromDay(n);
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
};
const monthLabel = (n) => {
  const [y, m] = fromDay(n);
  return `${MONTHS[m - 1]} ${y}`;
};

// First day of month (m may be out of 1..12; normalized through year arithmetic).
const monthStart = (y, m) => {
  const idx = y * 12 + (m - 1);
  const yy = Math.floor(idx / 12);
  return toDay(yy, idx - yy * 12 + 1, 1);
};
const monthSpan = (y, m) => ({
  from: monthStart(y, m),
  to: monthStart(y, m + 1) - 1,
});
// absQ = year * 4 + quarterIndex (0..3)
const quarterSpan = (absQ) => {
  const yy = Math.floor(absQ / 4);
  const q = absQ - yy * 4;
  return { from: monthStart(yy, q * 3 + 1), to: monthStart(yy, q * 3 + 4) - 1 };
};
// Monday on or before day n (ISO weeks). 1970-01-01 was a Thursday.
const mondayOnOrBefore = (n) => {
  const sundayBased = (((n + 4) % 7) + 7) % 7;
  return n - ((sundayBased + 6) % 7);
};

// Local calendar day of an instant in a zone, never the host zone.
const localDay = (ms, timeZone) => {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    throw new Error(`invalid timeZone: ${timeZone}`);
  }
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
  );
  return toDay(Number(parts.year), Number(parts.month), Number(parts.day));
};

// UTC offset ("+02:00") of a zone at a local wall-clock time on day n.
// Wall-clock parts and UTC offset of an instant in a zone.
const wallParts = (ms, timeZone) => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "longOffset",
  });
  const p = Object.fromEntries(
    fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
  );
  const mt = /GMT([+-])(\d{2}):?(\d{2})?/.exec(p.timeZoneName);
  const off = mt ? `${mt[1]}${mt[2]}:${mt[3] ?? "00"}` : "+00:00";
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${off}`;
};
// First real instant of local day n: binary search over UTC seconds, so a day
// whose midnight is skipped by a DST jump starts at the jump (e.g. 01:00).
const startOfDay = (n, timeZone) => {
  const [y, m, d] = fromDay(n);
  let lo = Date.UTC(y, m - 1, d) / 1000 - 15 * 3600;
  let hi = Date.UTC(y, m - 1, d) / 1000 + 15 * 3600;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (localDay(mid * 1000, timeZone) >= n) hi = mid;
    else lo = mid + 1;
  }
  return wallParts(lo * 1000, timeZone);
};
// `to` is exclusive (the server compares with `lt`): the first instant of the
// day after the range, so the range's last second is included.
const instants = (span, timeZone) => ({
  from: startOfDay(span.from, timeZone),
  to: startOfDay(span.to + 1, timeZone),
});

function ranges(period, today) {
  const [Y, M] = fromDay(today);
  const N_DAYS = { last_7_days: 7, last_30_days: 30 };
  if (period === "last_month") {
    const cur = monthSpan(Y, M - 1);
    const prev = monthSpan(Y, M - 2);
    return {
      cur,
      prev,
      label: `${monthLabel(cur.from)} vs ${monthLabel(prev.from)}`,
    };
  }
  if (period === "this_month") {
    const start = monthStart(Y, M);
    const cur = { from: start, to: today };
    const days = today - start + 1;
    const pFrom = monthStart(Y, M - 1);
    const pLast = start - 1;
    const prev = { from: pFrom, to: Math.min(pFrom + days - 1, pLast) };
    return {
      cur,
      prev,
      label: `${monthLabel(cur.from)} to date vs ${monthLabel(prev.from)}`,
    };
  }
  if (period === "last_week") {
    const thisMon = mondayOnOrBefore(today);
    const cur = { from: thisMon - 7, to: thisMon - 1 };
    const prev = { from: thisMon - 14, to: thisMon - 8 };
    return {
      cur,
      prev,
      label: `${shortDate(cur.from)} to ${shortDate(cur.to)} vs ${shortDate(prev.from)} to ${shortDate(prev.to)}`,
    };
  }
  if (period in N_DAYS) {
    const n = N_DAYS[period];
    const cur = { from: today - n, to: today - 1 };
    const prev = { from: today - 2 * n, to: today - n - 1 };
    return { cur, prev, label: `Last ${n} days vs previous ${n} days` };
  }
  // last_quarter
  const absQ = Y * 4 + Math.floor((M - 1) / 3);
  const cur = quarterSpan(absQ - 1);
  const prev = quarterSpan(absQ - 2);
  const [cy, cm] = fromDay(cur.from);
  const [py, pm] = fromDay(prev.from);
  return {
    cur,
    prev,
    label: `Q${Math.floor((cm - 1) / 3) + 1} ${cy} vs Q${Math.floor((pm - 1) / 3) + 1} ${py}`,
  };
}

export function resolvePeriod(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("input must be a JSON object");
  const { now, timeZone, period } = input;
  if (typeof now !== "string" || !ISO_INSTANT.test(now))
    throw new Error("now must be an ISO-8601 instant with an offset");
  const ms = Date.parse(now);
  if (Number.isNaN(ms)) throw new Error("now is not a parseable instant");
  // Date.parse rolls an impossible date over (2026-02-30 → March 2); refuse it.
  const [y, mo, d] = now.slice(0, 10).split("-").map(Number);
  if (isoOf(toDay(y, mo, d)) !== now.slice(0, 10))
    throw new Error("now is not a calendar date");
  if (typeof timeZone !== "string" || timeZone.length === 0)
    throw new Error("timeZone must be an IANA zone name");
  if (!PERIODS.has(period))
    throw new Error(`unknown period: ${String(period)}`);

  const today = localDay(ms, timeZone);
  const { cur, prev, label } = ranges(period, today);
  return {
    timeZone,
    today: isoOf(today),
    current: { from: isoOf(cur.from), to: isoOf(cur.to) },
    previous: { from: isoOf(prev.from), to: isoOf(prev.to) },
    // Ready for `visibility` view history `compare`, which takes date-times.
    compare: {
      current: instants(cur, timeZone),
      previous: instants(prev, timeZone),
    },
    label,
  };
}

function main() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    raw += chunk;
  });
  process.stdin.on("end", () => {
    let out;
    try {
      out = resolvePeriod(JSON.parse(raw));
      process.exitCode = 0;
    } catch (err) {
      out = { error: err instanceof Error ? err.message : String(err) };
      process.exitCode = 1;
    }
    process.stdout.write(`${JSON.stringify(out)}\n`);
  });
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

if (isEntryPoint()) main();
