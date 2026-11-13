import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "hairbysd_admin";

function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("hairbysd-admin-v1").digest("hex");
}

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const t = token();
  const c = (await cookies()).get(COOKIE)?.value;
  if (!t || !c || c.length !== t.length) return false;
  return timingSafeEqual(Buffer.from(c), Buffer.from(t));
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token()!, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
