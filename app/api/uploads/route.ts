import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isAdmin } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, UPLOAD_DIR, UPLOAD_PREFIX } from "@/lib/uploads";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const ext = IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Поддерживаются JPG, PNG, WebP и AVIF" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Фото больше 10 МБ" }, { status: 400 });
  }

  const name = `${randomUUID()}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: UPLOAD_PREFIX + name }, { status: 201 });
}
