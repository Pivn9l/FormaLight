import { promises as fs } from "fs";
import path from "path";
import { LINK_FIELDS, type LinkKey } from "./links";
import type { StatsPeriod, StatsSummary } from "./types";

type StatsFile = {
  /** id посетителя → день первого визита */
  visitors: Record<string, string>;
  /** день → id посетителей за этот день (хранятся только последние KEEP_DAYS дней) */
  days: Record<string, string[]>;
  /** день → число переходов по каждой ссылке */
  clicks: Record<string, Partial<Record<LinkKey, number>>>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "stats.json");
const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 31;
const WINDOWS: Record<Exclude<StatsPeriod, "total">, number> = { month: 30, week: 7, day: 1 };

// Дни считаем по московскому времени, формат YYYY-MM-DD
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" });
const dayKey = (date = new Date()) => dayFormat.format(date);

function lastDays(count: number): string[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => dayKey(new Date(now - i * DAY_MS)));
}

async function load(): Promise<StatsFile> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<StatsFile>;
    return {
      visitors: parsed.visitors ?? {},
      days: parsed.days ?? {},
      clicks: parsed.clicks ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { visitors: {}, days: {}, clicks: {} };
    }
    throw error;
  }
}

async function save(stats: StatsFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Пишем во временный файл и подменяем — чтение никогда не увидит половину JSON
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(stats), "utf8");
  await fs.rename(tmp, FILE);
}

let queue: Promise<unknown> = Promise.resolve();

/** Изменения выполняются строго по очереди, чтобы одновременные запросы не затирали друг друга */
function update(mutate: (stats: StatsFile) => boolean): Promise<void> {
  const run = queue.then(async () => {
    const stats = await load();
    if (mutate(stats)) await save(stats);
  });
  queue = run.catch(() => undefined);
  return run;
}

export function recordVisit(id: string): Promise<void> {
  return update((stats) => {
    const today = dayKey();
    const ids = (stats.days[today] ??= []);
    if (ids.includes(id)) return false;

    ids.push(id);
    stats.visitors[id] ??= today;

    const keep = new Set(lastDays(KEEP_DAYS));
    for (const day of Object.keys(stats.days)) {
      if (!keep.has(day)) delete stats.days[day];
    }
    return true;
  });
}

export function recordClick(key: LinkKey): Promise<void> {
  return update((stats) => {
    const day = (stats.clicks[dayKey()] ??= {});
    day[key] = (day[key] ?? 0) + 1;
    return true;
  });
}

export async function readSummary(): Promise<StatsSummary> {
  const stats = await load();
  const windows = Object.entries(WINDOWS).map(
    ([period, count]) => [period as Exclude<StatsPeriod, "total">, lastDays(count)] as const,
  );

  const visitors = { total: Object.keys(stats.visitors).length, month: 0, week: 0, day: 0 };
  for (const [period, days] of windows) {
    visitors[period] = new Set(days.flatMap((d) => stats.days[d] ?? [])).size;
  }

  const sum = (key: LinkKey, days: string[]) =>
    days.reduce((total, d) => total + (stats.clicks[d]?.[key] ?? 0), 0);
  const allDays = Object.keys(stats.clicks);

  const clicks = {} as StatsSummary["clicks"];
  for (const { key } of LINK_FIELDS) {
    clicks[key] = { total: sum(key, allDays), month: 0, week: 0, day: 0 };
    for (const [period, days] of windows) clicks[key][period] = sum(key, days);
  }

  return { visitors, clicks };
}
