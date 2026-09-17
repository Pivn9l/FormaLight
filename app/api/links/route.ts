import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import { sanitizeLinks } from "@/lib/validate";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.links);
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const store = await readStore();
  store.links = sanitizeLinks(await req.json());
  await writeStore(store);

  return NextResponse.json(store.links);
}
