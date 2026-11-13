import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth.ts";
import { db } from "@/lib/db.ts";
import { isValidDate } from "@/lib/slots.ts";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", req.url), 303);
  const form = await req.formData();
  const date = String(form.get("date") ?? "");
  if (isValidDate(date)) await db().setBlocked(date, form.get("action") !== "unblock");
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
