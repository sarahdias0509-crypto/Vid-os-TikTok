import Link from "next/link";
import { business } from "@/lib/config.ts";
import { db } from "@/lib/db.ts";
import { formatChf } from "@/lib/format.ts";
import { syncPayment } from "@/lib/payments.ts";
import ClearCart from "@/components/ClearCart.tsx";

export const dynamic = "force-dynamic";

export default async function MerciCommande({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (id) await syncPayment("order", id).catch(() => {});
  const o = id ? await db().getOrder(id) : null;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        {!o && <h1>Commande introuvable</h1>}
        {o?.status === "confirmed" && (
          <>
            <ClearCart />
            <p className="eyebrow">Merci ✨</p>
            <h1>Commande confirmée</h1>
            <div className="card summary" style={{ marginTop: 16 }}>
              {o.items.map((it) => <div key={it.productId} className="line"><span>{it.qty} × {it.name}</span><span>{formatChf(it.price * it.qty)}</span></div>)}
              {o.shippingPrice > 0 && <div className="line"><span>Envoi</span><span>{formatChf(o.shippingPrice)}</span></div>}
              <div className="line total"><span>Total payé</span><span>{formatChf(o.total)}</span></div>
            </div>
            <p className="muted" style={{ marginTop: 16 }}>
              {o.shippingId === "poste" ? "Je t'envoie ta commande très vite." : o.shippingId === "rdv" ? "Je te remets ta commande lors de ton prochain rendez-vous." : "Ta carte cadeau t'arrive par e-mail."}{" "}
              Une question ? DM sur <a href={`https://instagram.com/${business.instagram}`}>@{business.instagram}</a>.
            </p>
          </>
        )}
        {o?.status === "pending" && <><h1>Paiement en cours de validation…</h1><p className="muted">Actualise cette page dans un instant.</p></>}
        {o?.status === "cancelled" && <><h1>Commande non aboutie</h1><Link className="btn btn-primary" href="/boutique">Retour à la boutique</Link></>}
      </div>
    </section>
  );
}
