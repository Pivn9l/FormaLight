import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";
import { removeUploads } from "@/lib/uploads";
import { sanitizeProduct } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

const unauthorized = () => NextResponse.json({ error: "Нет доступа" }, { status: 401 });
const notFound = () => NextResponse.json({ error: "Товар не найден" }, { status: 404 });

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  const data = sanitizeProduct(await req.json());
  if (!data.title) {
    return NextResponse.json({ error: "Укажите название" }, { status: 400 });
  }

  const store = await readStore();
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) return notFound();

  const previous = store.products[index];
  store.products[index] = { ...previous, ...data };
  await writeStore(store);
  await removeUploads(previous.images.filter((url) => !data.images.includes(url)));

  return NextResponse.json(store.products[index]);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  const store = await readStore();
  const product = store.products.find((p) => p.id === id);
  if (!product) return notFound();

  store.products = store.products.filter((p) => p.id !== id);
  await writeStore(store);
  await removeUploads(product.images);

  return NextResponse.json({ ok: true });
}
