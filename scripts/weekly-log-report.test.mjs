import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, formatReport, parseLines } from "./weekly-log-report.mjs";

const NOW = 1_800_000_000;
const MOBILE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const log = (ts, uri, { method = "GET", status = 200, ua = MOBILE, referer, prefetch = false, rsc = false } = {}) =>
  JSON.stringify({
    ts,
    status,
    request: { method, uri, headers: { "User-Agent": [ua], ...(referer ? { Referer: [referer] } : {}), ...(prefetch ? { "Next-Router-Prefetch": ["1"] } : {}), ...(rsc ? { Rsc: ["1"] } : {}) } },
  });

test("an ad visitor who opens the matrix calculator and buys is counted; prefetches and robots are not", () => {
  const t = NOW - 3600;
  const lines = [
    log(t, "/arkan-2027?rb_clickid=abc"),
    log(t + 5, "/matrica-sudby?_rsc=x", { rsc: true, prefetch: true }), // предзагрузка из шапки — не переход
    log(t + 60, "/matrica-sudby?_rsc=y", { rsc: true }), // настоящий переход
    log(t + 120, "/api/purchases", { method: "POST" }),
    log(t + 10, "/", { ua: "Mozilla/5.0 (compatible; SeoAudit/1.0)" }),
    log(t + 20, "/_next/static/a.js"),
  ].join("\n");
  const result = analyze(parseLines(lines), { now: NOW, days: 7 });
  assert.equal(result.current.landings, 1);
  assert.equal(result.current.reachedAny, 1);
  assert.equal(result.current.adBuyers, 1);
  assert.equal(result.current.purchases, 1);
  assert.equal(result.current.documents, 1);
  assert.equal(result.current.bots, 1);
  assert.ok(result.current.reached.some(([path]) => path === "/matrica-sudby"));
});

test("a browser with an absurd number of views is excluded as a hidden robot and named in the report", () => {
  const lines = Array.from({ length: 60 }, (_, i) => log(NOW - 3000 + i, `/p${i}`, { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3)" })).join("\n");
  const result = analyze(parseLines(lines), { now: NOW, days: 7 });
  assert.equal(result.current.views, 0);
  assert.equal(result.current.heavy.length, 1);
  assert.match(formatReport(result), /исключены аномально частые/);
});

test("the report compares with the previous window only when the log covers it", () => {
  const rows = parseLines([log(NOW - 86400, "/"), log(NOW - 8 * 86400, "/")].join("\n"));
  assert.match(formatReport(analyze(rows, { now: NOW, days: 7 })), /прошлого окна целиком в нём нет/);
  const full = parseLines([log(NOW - 86400, "/"), log(NOW - 13 * 86400 - 3600 * 12, "/"), log(NOW - 8 * 86400, "/")].join("\n"));
  assert.match(formatReport(analyze(full, { now: NOW, days: 7 })), /к прошлому окну|было 0/);
});

test("broken lines are skipped", () => {
  assert.equal(parseLines("не json\n\n{\"ts\":1,\"status\":200,\"request\":{\"method\":\"GET\",\"uri\":\"/\",\"headers\":{}}}").length, 1);
});
