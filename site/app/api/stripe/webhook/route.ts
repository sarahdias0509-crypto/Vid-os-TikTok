import { NextResponse } from "next/server";
import { db } from "@/lib/db.ts";
import { demoMode, stripe } from "@/lib/payments.ts";

export async function POST(req: Request) {
  if (demoMode() || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 400 });
  const sig = req.headers.get("stripe-signature") ?? "";
  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded" ||
      event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const s = event.data.object;
    const paid = s.payment_status === "paid";
    const failed = event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed";
    const status = paid ? "confirmed" : failed ? "cancelled" : null;
    const { kind, id } = s.metadata ?? {};
    if (status && id) {
      if (kind === "booking") await db().setBookingStatus(id, status);
      if (kind === "order") await db().setOrderStatus(id, status);
    }
  }
  return NextResponse.json({ received: true });
}
