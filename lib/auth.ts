import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "fl_admin";

const adminPassword = () => process.env.ADMIN_PASSWORD || "formalight";

const tokenFor = (password: string) =>
  createHash("sha256").update(`forma-light:${password}`).digest("hex");

export function checkPassword(candidate: string): boolean {
  const a = Buffer.from(tokenFor(candidate));
  const b = Buffer.from(tokenFor(adminPassword()));
  return timingSafeEqual(a, b);
}

export function adminToken(): string {
  return tokenFor(adminPassword());
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === adminToken();
}
