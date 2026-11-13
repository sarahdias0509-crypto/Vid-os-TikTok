import { booking } from "@/lib/config.ts";
import BookingFlow from "@/components/BookingFlow.tsx";

export const metadata = { title: "Réserver — Hair by SD" };

export default async function ReserverPage({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const { annule } = await searchParams;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <p className="eyebrow">Réservation</p>
        <h1>Choisis ton créneau</h1>
        <p className="muted">Je me déplace chez toi. Le prix de chaque prestation et l&apos;acompte sont indiqués sous chaque horaire.</p>
        {annule && <p className="alert alert-info">Paiement annulé : ton créneau n&apos;a pas été réservé. Tu peux recommencer ci-dessous.</p>}
        <BookingFlow cancellationPolicy={booking.cancellationPolicy} />
      </div>
    </section>
  );
}
