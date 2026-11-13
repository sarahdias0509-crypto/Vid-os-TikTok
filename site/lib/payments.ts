import Stripe from "stripe";
import { booking as bookingCfg, business } from "./config.ts";
import { db, type Booking, type Order } from "./db.ts";

export const demoMode = () => !process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

const chf = (amount: number) => Math.round(amount * 100);

// Stripe impose au moins 30 min avant expiration d'une session.
const expiresAt = () => Math.floor(Date.now() / 1000) + Math.max(30, bookingCfg.holdMinutes) * 60;

/** Renvoie l'URL où envoyer la cliente pour payer l'acompte. */
export async function startBookingPayment(b: Booking, dateLabel: string): Promise<string> {
  if (demoMode()) return `${siteUrl()}/paiement-demo?type=booking&id=${b.id}`;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    currency: business.currency,
    payment_method_types: ["card", "twint"],
    customer_email: b.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: business.currency,
          unit_amount: chf(b.deposit),
          product_data: {
            name: `Acompte — ${b.serviceName}`,
            description: `${dateLabel}. Solde de ${b.price - b.deposit} CHF à régler le jour du rendez-vous.`,
          },
        },
      },
    ],
    metadata: { kind: "booking", id: b.id },
    expires_at: expiresAt(),
    success_url: `${siteUrl()}/reserver/merci?id=${b.id}`,
    cancel_url: `${siteUrl()}/reserver?annule=1`,
  });
  await db().setBookingSession(b.id, session.id);
  return session.url!;
}

export async function startOrderPayment(o: Order): Promise<string> {
  if (demoMode()) return `${siteUrl()}/paiement-demo?type=order&id=${o.id}`;
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = o.items.map((it) => ({
    quantity: it.qty,
    price_data: { currency: business.currency, unit_amount: chf(it.price), product_data: { name: it.name } },
  }));
  if (o.shippingPrice > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: business.currency, unit_amount: chf(o.shippingPrice), product_data: { name: "Envoi" } },
    });
  }
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    currency: business.currency,
    payment_method_types: ["card", "twint"],
    customer_email: o.email,
    line_items,
    metadata: { kind: "order", id: o.id },
    expires_at: expiresAt(),
    success_url: `${siteUrl()}/boutique/merci?id=${o.id}`,
    cancel_url: `${siteUrl()}/boutique?annule=1`,
  });
  await db().setOrderSession(o.id, session.id);
  return session.url!;
}

/**
 * Vérifie auprès de Stripe si la session est payée et met à jour la base.
 * Appelé par le webhook ET par la page « merci » (au cas où le webhook n'est pas configuré).
 */
export async function syncPayment(kind: "booking" | "order", id: string): Promise<void> {
  if (demoMode()) return;
  const rec = kind === "booking" ? await db().getBooking(id) : await db().getOrder(id);
  if (!rec || !rec.stripeSessionId || rec.status !== "pending") return;
  const s = await stripe().checkout.sessions.retrieve(rec.stripeSessionId);
  const status = s.payment_status === "paid" ? "confirmed" : s.status === "expired" ? "cancelled" : null;
  if (!status) return;
  if (kind === "booking") await db().setBookingStatus(id, status);
  else await db().setOrderStatus(id, status);
}
