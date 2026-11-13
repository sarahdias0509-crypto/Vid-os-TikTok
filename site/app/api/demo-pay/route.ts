import { NextResponse } from "next/server";
import { db } from "@/lib/db.ts";
import { demoMode } from "@/lib/payments.ts";

/** Mode démo uniquement (pas de clé Stripe) : simule un paiement réussi. */
export async function POST(req: Request) {
  if (!demoMode()) return NextResponse.json({ error: "Indisponible" }, { status: 404 });
  const { type, id } = (await req.json().catch(() => ({}))) as { type?: string; id?: string };
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  if (type === "booking") {
    const b = await db().getBooking(id);
    if (!b || b.status !== "pending") return NextResponse.json({ error: "Réservation introuvable ou expirée" }, { status: 404 });
    await db().setBookingStatus(id, "confirmed");
    return NextResponse.json({ url: `/reserver/merci?id=${id}` });
  }
  if (type === "order") {
    const o = await db().getOrder(id);
    if (!o || o.status !== "pending") return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    await db().setOrderStatus(id, "confirmed");
    return NextResponse.json({ url: `/boutique/merci?id=${id}` });
  }
  return NextResponse.json({ error: "type invalide" }, { status: 400 });
}
