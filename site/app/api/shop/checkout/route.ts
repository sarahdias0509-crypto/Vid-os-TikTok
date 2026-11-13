import { NextResponse } from "next/server";
import { products, shipping } from "@/lib/config.ts";
import { db, type OrderItem } from "@/lib/db.ts";
import { startOrderPayment } from "@/lib/payments.ts";
import { parseCustomer } from "@/lib/validate.ts";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = Array.isArray(body.items) ? body.items : [];
  const items: OrderItem[] = [];
  for (const it of raw as { id?: unknown; qty?: unknown }[]) {
    const p = products.find((x) => x.id === it.id && x.available !== false);
    const qty = Math.floor(Number(it.qty));
    if (p && qty > 0 && qty <= 20) items.push({ productId: p.id, name: p.name, price: p.price, qty });
  }
  if (!items.length) return NextResponse.json({ error: "Ton panier est vide." }, { status: 400 });

  const physical = items.some((it) => !products.find((p) => p.id === it.productId)?.digital);
  const ship = physical ? shipping.options.find((s) => s.id === body.shippingId) : { id: "email", price: 0 };
  if (!ship) return NextResponse.json({ error: "Choisis un mode de livraison." }, { status: 400 });

  const customer = parseCustomer(body, ship.id === "poste");
  if (typeof customer === "string") return NextResponse.json({ error: customer }, { status: 400 });

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const o = await db().createOrder({
    items, shippingId: ship.id, shippingPrice: ship.price, total: subtotal + ship.price, ...customer,
  });
  try {
    return NextResponse.json({ url: await startOrderPayment(o) });
  } catch (e) {
    console.error("Stripe order error", e);
    await db().setOrderStatus(o.id, "cancelled");
    return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessaie dans un instant." }, { status: 502 });
  }
}
