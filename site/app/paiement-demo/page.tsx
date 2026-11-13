import { notFound } from "next/navigation";
import { db } from "@/lib/db.ts";
import { formatChf } from "@/lib/format.ts";
import { demoMode } from "@/lib/payments.ts";
import DemoPayButton from "@/components/DemoPayButton.tsx";

export const dynamic = "force-dynamic";

export default async function DemoPay({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  if (!demoMode()) notFound();
  const { type, id } = await searchParams;
  if (!id || (type !== "booking" && type !== "order")) notFound();
  const rec = type === "booking" ? await db().getBooking(id) : await db().getOrder(id);
  if (!rec) notFound();
  const amount = "deposit" in rec ? rec.deposit : rec.total;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <p className="alert alert-info">
          <strong>Mode démo</strong> : Stripe n&apos;est pas encore connecté, aucun argent n&apos;est débité.
        </p>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Paiement</h2>
          <p className="muted">{"serviceName" in rec ? `Acompte — ${rec.serviceName}` : `Commande boutique (${rec.items.length} article(s))`}</p>
          <p className="price" style={{ fontSize: "1.6rem" }}>{formatChf(amount)}</p>
          <DemoPayButton type={type} id={id} />
        </div>
      </div>
    </section>
  );
}
