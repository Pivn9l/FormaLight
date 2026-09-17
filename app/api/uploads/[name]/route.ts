import { promises as fs } from "fs";
import path from "path";
import { IMAGE_TYPES, UPLOAD_DIR, isUploadName } from "@/lib/uploads";

type Ctx = { params: Promise<{ name: string }> };

const CONTENT_TYPES = Object.fromEntries(
  Object.entries(IMAGE_TYPES).map(([type, ext]) => [ext, type]),
);

export async function GET(_req: Request, { params }: Ctx) {
  const { name } = await params;
  if (!isUploadName(name)) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[name.split(".").pop()!],
        // Имя файла уникально и не меняется — можно кэшировать навсегда
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
