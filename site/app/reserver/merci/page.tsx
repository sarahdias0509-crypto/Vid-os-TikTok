import Link from "next/link";
import { business } from "@/lib/config.ts";
import { db } from "@/lib/db.ts";
import { formatChf, formatDateFr } from "@/lib/format.ts";
import { syncPayment } from "@/lib/payments.ts";
import { formatMinutes } from "@/lib/slots.ts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Réservation — Hair by SD" };

export default async function Merci({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (id) await syncPayment("booking", id).catch(() => {});
  const b = id ? await db().getBooking(id) : null;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        {!b && <><h1>Réservation introuvable</h1><p className="muted">Écris-moi en DM Instagram si tu as un doute.</p></>}
        {b?.status === "confirmed" && (
          <>
            <p className="eyebrow">C&apos;est confirmé ✨</p>
            <h1>À très vite, {b.name.split(" ")[0]} !</h1>
            <div className="card" style={{ marginTop: 16 }}>
              <p><strong>{b.serviceName}</strong></p>
              <p>{formatDateFr(b.date)} à {formatMinutes(b.startMin)}<br /><span className="muted">{b.address}</span></p>
              <div className="summary">
                <div className="line"><span>Acompte payé</span><span>{formatChf(b.deposit)}</span></div>
                <div className="line"><span>Solde le jour J</span><span>{formatChf(b.price - b.deposit)}</span></div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 16 }}>
              Un reçu de paiement t&apos;est envoyé par e-mail. Pour toute question ou modification, écris-moi en DM sur{" "}
              <a href={`https://instagram.com/${business.instagram}`}>@{business.instagram}</a>.
            </p>
          </>
        )}
        {b?.status === "pending" && (
          <>
            <h1>Paiement en cours de validation…</h1>
            <p className="muted">Ça prend parfois quelques secondes (surtout avec TWINT). Actualise cette page dans un instant.</p>
          </>
        )}
        {b?.status === "cancelled" && (
          <>
            <h1>Réservation non aboutie</h1>
            <p className="muted">Le paiement n&apos;a pas été finalisé, le créneau a été libéré.</p>
            <Link className="btn btn-primary" href="/reserver">Choisir un autre créneau</Link>
          </>
        )}
      </div>
    </section>
  );
}
