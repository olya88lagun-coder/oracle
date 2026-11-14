// Недельный отчёт по журналу заходов tvoy-orakul.ru (Caddy, без IP и cookie). Метрика считает только принявших cookies,
// журнал — все заходы. Запуск: `pnpm report:weekly` (читает журнал по ssh, только чтение) или `... | node scripts/weekly-log-report.mjs`.
// Журнал хранит не больше 30 суток, поэтому окна: последние N суток и N суток до них.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BOT = /bot|spider|crawl|slurp|yandex|google|bing|baidu|facebook|telegram|vkshare|whatsapp|gort|python|curl|wget|headless|lighthouse|monitor|uptime|check|scan|ahrefs|semrush|seoaudit|go-http|java|okhttp|preview|embed|ahc\/|^$/i;
const ASSET_PREFIX = ["/_next", "/images", "/lila/", "/taro/", "/arcana/", "/natal/", "/practices", "/fonts", "/favicon", "/icon", "/hero", "/portrait", "/examples"];
const ASSET_EXT = /\.(webp|png|jpg|svg|ico|css|js|woff2?|txt|xml|json|pdf|avif)$/;
const SESSION_GAP = 30 * 60;
// Один браузер с таким числом просмотров за окно — почти наверняка робот с «человеческим» User-Agent
const HEAVY_UA = 40;
const DAY = 86400;

export const pathOf = (uri) => uri.split("?")[0];
const isAsset = (uri) => {
  const path = pathOf(uri);
  return ASSET_PREFIX.some((prefix) => path.startsWith(prefix)) || ASSET_EXT.test(path);
};

export function parseLines(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const request = entry.request ?? {};
    const headers = request.headers ?? {};
    const first = (name) => (headers[name] ?? [""])[0] ?? "";
    rows.push({
      ts: entry.ts,
      method: request.method,
      uri: request.uri ?? "",
      status: entry.status,
      ua: first("User-Agent"),
      referer: first("Referer"),
      prefetch: Boolean(headers["Next-Router-Prefetch"]),
      rsc: Boolean(headers["Rsc"]),
    });
  }
  return rows.sort((a, b) => a.ts - b.ts);
}

// Просмотр страницы — загрузка документа или настоящий переход внутри сайта (RSC без Next-Router-Prefetch); предзагрузки не считаются
const isView = (row) => row.method === "GET" && row.status === 200 && !row.uri.startsWith("/api") && !isAsset(row.uri) && !(row.rsc && row.prefetch);
const isDocument = (row) => isView(row) && !row.uri.includes("_rsc=");

function host(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function analyzeWindow(rows, from, to) {
  const inWindow = rows.filter((row) => row.ts >= from && row.ts < to);
  const views = inWindow.filter(isView);
  const perUa = new Map();
  for (const row of views) perUa.set(row.ua, (perUa.get(row.ua) ?? 0) + 1);
  const heavy = new Map([...perUa].filter(([ua, n]) => n >= HEAVY_UA && !BOT.test(ua)));
  const isHuman = (row) => !BOT.test(row.ua) && !heavy.has(row.ua);
  const human = views.filter(isHuman);
  const documents = human.filter(isDocument);

  // Сессия — один User-Agent с паузами не больше 30 минут; приблизительно, IP в журнале нет
  const sessionOf = new Map();
  const last = new Map();
  let sessions = 0;
  for (const row of human) {
    if (!last.has(row.ua) || row.ts - last.get(row.ua) > SESSION_GAP) sessions += 1;
    last.set(row.ua, row.ts);
    sessionOf.set(row, sessions);
  }

  const byDay = new Map();
  for (const row of documents) {
    const day = new Date(row.ts * 1000).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const external = new Map();
  let direct = 0;
  for (const row of documents) {
    if (!row.referer) direct += 1;
    else if (!host(row.referer).endsWith("tvoy-orakul.ru")) external.set(host(row.referer), (external.get(host(row.referer)) ?? 0) + 1);
  }

  const topPages = new Map();
  for (const row of documents) topPages.set(pathOf(row.uri), (topPages.get(pathOf(row.uri)) ?? 0) + 1);

  // Реклама VK: заход с rb_clickid; что тот же браузер открыл в течение 30 минут (просмотры и платёжные запросы)
  const landings = documents.filter((row) => row.uri.includes("rb_clickid"));
  const reached = new Map();
  let reachedAny = 0;
  let adBuyers = 0;
  for (const landing of landings) {
    const after = inWindow.filter((row) => row.ua === landing.ua && row.ts > landing.ts && row.ts <= landing.ts + SESSION_GAP);
    const paths = new Set(after.filter(isView).map((row) => pathOf(row.uri)));
    paths.delete(pathOf(landing.uri));
    for (const path of paths) reached.set(path, (reached.get(path) ?? 0) + 1);
    if ([...paths].some((path) => path.startsWith("/matrica-sudby") || path === "/natalnaya-karta" || path === "/lila/igra" || path === "/sovmestimost")) reachedAny += 1;
    if (after.some((row) => row.method === "POST" && pathOf(row.uri) === "/api/purchases" && row.status === 200)) adBuyers += 1;
  }

  const purchases = inWindow.filter((row) => row.method === "POST" && pathOf(row.uri) === "/api/purchases" && row.status === 200 && !BOT.test(row.ua)).length;
  const paid = inWindow.filter((row) => row.method === "POST" && pathOf(row.uri) === "/api/yookassa/notification" && row.status === 200).length;
  const errors = inWindow.filter((row) => row.status >= 500).length;

  return {
    views: human.length,
    documents: documents.length,
    bots: views.filter((row) => BOT.test(row.ua)).length,
    heavy: [...heavy],
    sessions,
    browsers: new Set(human.map((row) => row.ua)).size,
    byDay: [...byDay].sort(),
    direct,
    external: [...external].sort((a, b) => b[1] - a[1]),
    topPages: [...topPages].sort((a, b) => b[1] - a[1]),
    landings: landings.length,
    landingPaths: [...new Set(landings.map((row) => pathOf(row.uri)))],
    reached: [...reached].sort((a, b) => b[1] - a[1]),
    reachedAny,
    adBuyers,
    calculatorLoads: documents.filter((row) => pathOf(row.uri) === "/matrica-sudby").length,
    purchases,
    paid,
    errors,
  };
}

export function analyze(rows, { now = Date.now() / 1000, days = 7 } = {}) {
  const span = days * DAY;
  const first = rows[0]?.ts ?? now;
  return { now, days, logFrom: first, current: analyzeWindow(rows, now - span, now + 1), previous: analyzeWindow(rows, now - 2 * span, now - span), previousComplete: first <= now - 2 * span + DAY };
}

const delta = (cur, prev, complete) => (!complete ? "" : prev === 0 ? (cur === 0 ? " (0)" : " (было 0)") : ` (${cur >= prev ? "+" : "−"}${Math.round((Math.abs(cur - prev) / prev) * 100)}% к прошлому окну: ${prev})`);
const date = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);
const list = (items, limit = 8) => items.slice(0, limit).map(([name, n]) => `${n} ${name}`).join(", ") || "нет";

export function formatReport(result) {
  const { current: c, previous: p, previousComplete: complete, days } = result;
  const d = (key) => delta(c[key], p[key], complete);
  const lines = [
    `# Отчёт по журналу заходов: ${date(result.now - days * DAY)} — ${date(result.now)}`,
    "",
    `Журнал начинается с ${date(result.logFrom)}${complete ? "" : ": прошлого окна целиком в нём нет, сравнения нет"}. IP в журнале нет, поэтому «сессии» приблизительны (браузер + паузы до 30 минут).`,
    "",
    "## Трафик",
    `- Просмотры страниц (без роботов): ${c.views}${d("views")}; загрузки документов: ${c.documents}`,
    `- Сессии примерно: ${c.sessions}${d("sessions")}; разных браузеров: ${c.browsers}`,
    `- Роботы (просмотры): ${c.bots}${c.heavy.length ? `; исключены аномально частые браузеры: ${c.heavy.map(([ua, n]) => `${n} × ${ua.slice(0, 60)}`).join("; ")}` : ""}`,
    `- По дням (загрузки документов): ${c.byDay.map(([day, n]) => `${day.slice(5)}: ${n}`).join(", ") || "нет"}`,
    `- Откуда: без реферера ${c.direct}; внешние: ${list(c.external)}`,
    `- Страницы: ${list(c.topPages, 10)}`,
    "",
    "## Реклама VK (заходы с rb_clickid)",
    `- Заходов: ${c.landings}${d("landings")}${c.landingPaths.length ? `, страницы: ${c.landingPaths.join(", ")}` : ""}`,
    `- В течение 30 минут тот же браузер открыл калькулятор или практику: ${c.reachedAny} из ${c.landings}`,
    `- Что ещё открывали после захода: ${list(c.reached, 8)}`,
    `- Дошли до запроса покупки: ${c.adBuyers}`,
    "",
    "## Воронка и оплата",
    `- Загрузок страницы калькулятора матрицы (/matrica-sudby): ${c.calculatorLoads}${d("calculatorLoads")}`,
    `- Запросов на покупку (200): ${c.purchases}${d("purchases")}; подтверждений оплаты от ЮKassa (200): ${c.paid}${d("paid")}`,
    `- Ответов 5xx: ${c.errors}`,
    "",
    "Метрика видит только принявших cookies, журнал — все заходы; оценка конверсий по малым числам шумная (одна покупка меняет все проценты).",
  ];
  return lines.join("\n");
}

function fetchViaSsh() {
  const host = process.env.DEPLOY_HOST ?? "200.169.178.231";
  const user = process.env.DEPLOY_USER ?? "root";
  const command = 'docker exec food-tracker-bot-caddy-1 sh -c "zcat /data/tvoy-orakul-access-*.gz 2>/dev/null; cat /data/tvoy-orakul-access.log"';
  const result = spawnSync("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=20", `${user}@${host}`, command], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`ssh не удался: ${result.stderr.trim() || result.status}`);
  return result.stdout;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const daysIndex = args.indexOf("--days");
  const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : 7;
  const text = args.includes("--ssh") ? fetchViaSsh() : await readStdin();
  const rows = parseLines(text);
  if (rows.length === 0) {
    console.error("В журнале нет записей.");
    process.exit(1);
  }
  console.log(formatReport(analyze(rows, { days })));
}
