import Link from "next/link";
import { booking, business, categoryLabels, services, type ServiceCategory } from "@/lib/config.ts";
import { formatChf, formatDuration } from "@/lib/format.ts";

export default function Home() {
  const cats = Object.keys(categoryLabels) as ServiceCategory[];
  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <p className="eyebrow">À domicile · {business.city}</p>
            <h1>Des cheveux de rêve,<br />sans bouger de chez toi.</h1>
            <p className="lead">
              Extensions Weft et bandes adhésives, lissages et soins botox capillaires.
              Je viens chez toi avec tout le matériel, tu n&apos;as plus qu&apos;à te détendre.
            </p>
            <div className="hero-actions">
              <Link href="/reserver" className="btn btn-primary">Réserver un créneau</Link>
              <Link href="/boutique" className="btn btn-ghost">Voir la boutique</Link>
            </div>
            <div className="badges">
              <span className="badge">Spécialiste extensions</span>
              <span className="badge">Paiement carte & TWINT</span>
              <span className="badge">{business.area}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="prestations">
        <div className="container">
          <p className="eyebrow">Prestations & tarifs</p>
          <h2>Ce que je propose</h2>
          <p className="muted">Un acompte est demandé à la réservation ; il est déduit du prix final.</p>
          {cats.map((cat) => (
            <div key={cat} style={{ marginTop: 28 }}>
              <h3>{categoryLabels[cat]}</h3>
              <div className="grid">
                {services.filter((s) => s.category === cat).map((s) => (
                  <article key={s.id} className="card">
                    <h3>{s.name}</h3>
                    <p className="muted small">{s.description}</p>
                    <span className="chip">{formatDuration(s.durationMin)}</span>
                    <div className="price-row">
                      <span className="price">{s.priceFrom ? "dès " : ""}{formatChf(s.price)}</span>
                      <span className="small muted">Acompte {formatChf(s.deposit)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <div className="center" style={{ marginTop: 32 }}>
            <Link href="/reserver" className="btn btn-primary">Choisir ma date</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Comment ça marche</p>
          <h2>Réserver en 3 étapes</h2>
          <div className="steps" style={{ marginTop: 20 }}>
            <div className="step"><h3>Choisis ta date</h3><p className="muted">Tu vois mes créneaux libres et les prestations possibles à chaque horaire.</p></div>
            <div className="step"><h3>Paie l&apos;acompte</h3><p className="muted">Par carte ou TWINT, en toute sécurité. Ton créneau est bloqué pour toi.</p></div>
            <div className="step"><h3>Je viens chez toi</h3><p className="muted">Le jour J, tu règles le solde. Une question ? Écris-moi en DM Instagram.</p></div>
          </div>
          <p className="small muted" style={{ marginTop: 20 }}>{booking.cancellationPolicy}</p>
        </div>
      </section>
    </>
  );
}
