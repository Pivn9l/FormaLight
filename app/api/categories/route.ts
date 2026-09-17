import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import { sanitizeCategory } from "@/lib/validate";

const unauthorized = () => NextResponse.json({ error: "Нет доступа" }, { status: 401 });
const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

const same = (a: string, b: string) => a.toLocaleLowerCase("ru") === b.toLocaleLowerCase("ru");

async function body(req: Request): Promise<Record<string, unknown>> {
  return (await req.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.categories);
}

/** Создать категорию: { name } */
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const name = sanitizeCategory((await body(req)).name);
  if (!name) return bad("Введите название категории");

  const store = await readStore();
  if (store.categories.some((c) => same(c, name))) return bad("Такая категория уже есть");

  store.categories.push(name);
  await writeStore(store);
  return NextResponse.json(store.categories, { status: 201 });
}

/** Переименовать: { from, to } — или изменить порядок: { order: string[] } */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const data = await body(req);
  const store = await readStore();

  if (Array.isArray(data.order)) {
    const order = data.order.map(String);
    const known = new Set(store.categories);
    if (order.length !== known.size || !order.every((c) => known.has(c))) {
      return bad("Список категорий устарел, обновите страницу");
    }
    store.categories = order;
    await writeStore(store);
    return NextResponse.json(store.categories);
  }

  const from = sanitizeCategory(data.from);
  const to = sanitizeCategory(data.to);
  if (!to) return bad("Введите название категории");

  const index = store.categories.indexOf(from);
  if (index === -1) return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
  if (store.categories.some((c, i) => i !== index && same(c, to))) {
    return bad("Такая категория уже есть");
  }

  store.categories[index] = to;
  store.products = store.products.map((p) => (p.category === from ? { ...p, category: to } : p));
  await writeStore(store);
  return NextResponse.json(store.categories);
}

/** Удалить: { name } — у товаров этой категории категория очищается */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const name = sanitizeCategory((await body(req)).name);

  const store = await readStore();
  if (!store.categories.includes(name)) {
    return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
  }

  store.categories = store.categories.filter((c) => c !== name);
  store.products = store.products.map((p) => (p.category === name ? { ...p, category: "" } : p));
  await writeStore(store);
  return NextResponse.json(store.categories);
}
