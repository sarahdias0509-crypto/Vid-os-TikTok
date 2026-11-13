import { NextResponse } from "next/server";
import { services } from "@/lib/config.ts";
import { db } from "@/lib/db.ts";
import { formatDateFr } from "@/lib/format.ts";
import { startBookingPayment } from "@/lib/payments.ts";
import { slotsForDay, toMinutes } from "@/lib/slots.ts";
import { notes, parseCustomer } from "@/lib/validate.ts";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const customer = parseCustomer(body, true);
  if (typeof customer === "string") return NextResponse.json({ error: customer }, { status: 400 });

  const date = String(body.date ?? "");
  const start = String(body.start ?? "");
  const service = services.find((s) => s.id === body.serviceId);
  if (!service || !/^\d{2}:\d{2}$/.test(start)) return NextResponse.json({ error: "Prestation ou horaire invalide." }, { status: 400 });

  // On revérifie côté serveur que ce créneau propose bien cette prestation.
  const [busy, blocked] = await Promise.all([db().busyRanges(), db().blockedDates()]);
  const slot = slotsForDay(date, busy, blocked).find((s) => s.start === start);
  if (!slot || !slot.services.some((s) => s.id === service.id)) {
    return NextResponse.json({ error: "Ce créneau vient d'être pris. Choisis-en un autre." }, { status: 409 });
  }

  // Option choisie (longueur, couleur…) : le prix vient toujours de la config, jamais du navigateur.
  let price = service.price;
  let serviceName = service.name;
  if (service.variants?.length) {
    const v = service.variants.find((x) => x.id === body.variantId);
    if (!v) return NextResponse.json({ error: "Choisis une option (longueur, couleur…)." }, { status: 400 });
    price = v.price;
    serviceName = `${service.name} — ${v.label}`;
  }

  const startMin = toMinutes(start);
  const b = await db().createBookingIfFree({
    date, startMin, endMin: startMin + service.durationMin,
    serviceId: service.id, serviceName, price, deposit: Math.min(service.deposit, price),
    ...customer, notes: notes(body.notes),
  });
  if (!b) return NextResponse.json({ error: "Ce créneau vient d'être pris. Choisis-en un autre." }, { status: 409 });

  try {
    const url = await startBookingPayment(b, `${formatDateFr(date)} à ${start}`);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Stripe booking error", e);
    await db().setBookingStatus(b.id, "cancelled");
    return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessaie dans un instant." }, { status: 502 });
  }
}
