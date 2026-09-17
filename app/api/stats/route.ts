import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isLinkKey } from "@/lib/links";
import { readSummary, recordClick, recordVisit } from "@/lib/stats";

const VISITOR_ID = /^[a-f0-9]{16}$/;
const BOT_UA = /bot|crawl|spider|slurp|preview|headless/i;

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }
  return NextResponse.json(await readSummary());
}

/** Приём событий с сайта: { type: "visit", id } или { type: "click", key } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { type?: unknown; id?: unknown; key?: unknown };

  // Визиты администратора и поисковых роботов не считаем
  const ignored = BOT_UA.test(req.headers.get("user-agent") ?? "") || (await isAdmin());

  if (body.type === "visit" && typeof body.id === "string" && VISITOR_ID.test(body.id)) {
    if (!ignored) await recordVisit(body.id);
  } else if (body.type === "click" && isLinkKey(body.key)) {
    if (!ignored) await recordClick(body.key);
  } else {
    return NextResponse.json({ error: "Неверное событие" }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
