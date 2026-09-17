import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdmin } from "@/lib/auth";
import { readStore, sortProducts, writeStore } from "@/lib/store";
import { sanitizeProduct } from "@/lib/validate";

const unauthorized = () => NextResponse.json({ error: "Нет доступа" }, { status: 401 });

export async function GET() {
  const [store, admin] = await Promise.all([readStore(), isAdmin()]);
  const products = sortProducts(store.products).filter((p) => admin || p.visible);
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const data = sanitizeProduct(await req.json());
  if (!data.title) {
    return NextResponse.json({ error: "Укажите название" }, { status: 400 });
  }

  const store = await readStore();
  const product = {
    ...data,
    id: randomUUID(),
    order: Math.max(0, ...store.products.map((p) => p.order)) + 1,
  };
  store.products.push(product);
  await writeStore(store);

  return NextResponse.json(product, { status: 201 });
}
