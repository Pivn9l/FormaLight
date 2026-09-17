import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import { sanitizeSoldCount } from "@/lib/validate";

export async function GET() {
  const { soldCount } = await readStore();
  return NextResponse.json({ soldCount });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { soldCount?: unknown };
  const store = await readStore();
  store.soldCount = sanitizeSoldCount(body.soldCount);
  await writeStore(store);

  return NextResponse.json({ soldCount: store.soldCount });
}
