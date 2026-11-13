import { NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/auth.ts";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!checkPassword(String(form.get("password") ?? ""))) {
    return NextResponse.redirect(new URL("/admin?erreur=1", req.url), 303);
  }
  await setAdminCookie();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
