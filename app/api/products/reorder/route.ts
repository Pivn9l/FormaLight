import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Ожидается список ids" }, { status: 400 });
  }

  const position = new Map(body.ids.map((id, i) => [String(id), i + 1]));
  const store = await readStore();
  store.products = store.products.map((p) => ({
    ...p,
    order: position.get(p.id) ?? p.order,
  }));
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
