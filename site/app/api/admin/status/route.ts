import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth.ts";
import { db, type Status } from "@/lib/db.ts";

/** Permet d'annuler une réservation (libère le créneau) ou une commande. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", req.url), 303);
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as Status;
  if (["confirmed", "cancelled"].includes(status)) {
    if (form.get("kind") === "order") await db().setOrderStatus(id, status);
    else await db().setBookingStatus(id, status);
  }
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
