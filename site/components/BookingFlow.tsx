"use client";

import { useEffect, useRef, useState } from "react";

type Variant = { id: string; label: string; price: number };
type Svc = {
  id: string; name: string; category: string; durationMin: number;
  price: number; priceFrom?: boolean; deposit: number; description: string; variants?: Variant[];
};
type Slot = { start: string; services: Svc[] };

const catLabel: Record<string, string> = { extensions: "Extensions", lissages: "Lissages", soins: "Soins" };
const chf = (n: number) => `${n} CHF`;
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}`);

function dayParts(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-CH", { ...o, timeZone: "UTC" }).format(d);
  return { dow: f({ weekday: "short" }).replace(".", ""), num: f({ day: "numeric" }), mon: f({ month: "short" }).replace(".", "") };
}
function longDate(date: string) {
  const s = new Intl.DateTimeFormat("fr-CH", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BookingFlow({ cancellationPolicy }: { cancellationPolicy: string }) {
  const [days, setDays] = useState<string[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [svc, setSvc] = useState<Svc | null>(null);
  const [variantId, setVariantId] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const slotsRef = useRef<HTMLDivElement>(null);
  const svcRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/availability").then((r) => r.json()).then((d) => setDays(d.days)).catch(() => setDays([]));
  }, []);

  const scrollTo = (r: React.RefObject<HTMLDivElement | null>) =>
    setTimeout(() => r.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  async function pickDate(d: string) {
    setDate(d); setSlot(null); setSvc(null); setSlots(null); setError(null);
    const r = await fetch(`/api/availability?date=${d}`).then((x) => x.json()).catch(() => ({ slots: [] }));
    setSlots(r.slots);
    scrollTo(slotsRef);
  }
  function pickSlot(s: Slot) {
    setSlot(s); setSvc(null); setError(null);
    scrollTo(svcRef);
  }
  function pickSvc(s: Svc) {
    setSvc(s); setVariantId(""); setError(null);
    scrollTo(formRef);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !slot || !svc) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, start: slot.start, serviceId: svc.id, variantId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        if (res.status === 409 && date) pickDate(date);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
      setLoading(false);
    }
  }

  const variant = svc?.variants?.find((v) => v.id === variantId) ?? null;
  const needsVariant = !!svc?.variants?.length;
  const price = variant ? variant.price : svc?.price ?? 0;
  const deposit = svc ? Math.min(svc.deposit, price || svc.deposit) : 0;
  const exact = !needsVariant || !!variant;

  const grouped = slot
    ? Object.entries(slot.services.reduce<Record<string, Svc[]>>((acc, s) => ((acc[s.category] ||= []).push(s), acc), {}))
    : [];

  return (
    <div className="flow" style={{ marginTop: 24 }}>
      <div className="panel">
        <div className="panel-title"><h2>Date</h2><span className="stepnum">Étape 1 / 4</span></div>
        {days === null && <p className="empty">Chargement des disponibilités…</p>}
        {days?.length === 0 && <p className="empty">Aucun créneau disponible pour le moment. Écris-moi en DM Instagram !</p>}
        {!!days?.length && (
          <div className="days" role="group" aria-label="Jours disponibles">
            {days.map((d) => {
              const p = dayParts(d);
              return (
                <button key={d} type="button" className="day" aria-pressed={d === date} onClick={() => pickDate(d)} aria-label={longDate(d)}>
                  <div className="dow">{p.dow}</div><div className="num">{p.num}</div><div className="mon">{p.mon}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {date && (
        <div className="panel" ref={slotsRef}>
          <div className="panel-title"><h2>Horaire</h2><span className="stepnum">Étape 2 / 4</span></div>
          <p className="small muted">{longDate(date)}</p>
          {slots === null && <p className="empty">Chargement…</p>}
          {slots?.length === 0 && <p className="empty">Plus de créneau ce jour-là, choisis une autre date.</p>}
          {!!slots?.length && (
            <div className="slots" role="group" aria-label="Horaires disponibles">
              {slots.map((s) => (
                <button key={s.start} type="button" className="slot" aria-pressed={slot?.start === s.start} onClick={() => pickSlot(s)}>
                  {s.start}
                  <small>{s.services.length} prestation{s.services.length > 1 ? "s" : ""}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {slot && date && (
        <div className="panel" ref={svcRef}>
          <div className="panel-title"><h2>Prestation</h2><span className="stepnum">Étape 3 / 4</span></div>
          <p className="small muted">Disponibles le {longDate(date).toLowerCase()} à {slot.start}</p>
          <div className="services-list" role="group" aria-label="Prestations disponibles">
            {grouped.map(([cat, list]) => (
              <div key={cat} className="services-list">
                <p className="cat-title">{catLabel[cat] ?? cat}</p>
                {list.map((s) => (
                  <button key={s.id} type="button" className="service-opt" aria-pressed={svc?.id === s.id} onClick={() => pickSvc(s)}>
                    <span className="name">{s.name}</span>
                    <span className="p">{s.priceFrom ? "dès " : ""}{chf(s.price)}</span>
                    <span className="meta">{dur(s.durationMin)} · Acompte {chf(s.deposit)} · {s.description}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {svc && slot && date && (
        <div className="panel" ref={formRef}>
          <div className="panel-title"><h2>Tes coordonnées</h2><span className="stepnum">Étape 4 / 4</span></div>
          <form className="form" onSubmit={submit}>
            {needsVariant && (
              <div className="field">
                <label htmlFor="variant">Ton option pour « {svc.name} »</label>
                <select id="variant" required value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                  <option value="" disabled>Choisis…</option>
                  {svc.variants!.map((v) => <option key={v.id} value={v.id}>{v.label} — {chf(v.price)}</option>)}
                </select>
              </div>
            )}
            <div className="row2">
              <div className="field"><label htmlFor="name">Prénom et nom</label>
                <input id="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label htmlFor="phone">Téléphone</label>
                <input id="phone" required type="tel" autoComplete="tel" placeholder="+41 79 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="field"><label htmlFor="email">E-mail</label>
              <input id="email" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label htmlFor="address">Adresse du rendez-vous (je viens chez toi)</label>
              <input id="address" required autoComplete="street-address" placeholder="Rue, n°, code postal, ville" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="field"><label htmlFor="notes">Infos utiles (facultatif)</label>
              <textarea id="notes" rows={3} placeholder="Longueur et couleur souhaitées, étage, code d'entrée…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            <div className="summary" aria-live="polite">
              <div className="line"><span>{svc.name}{variant ? ` — ${variant.label}` : ""}</span><span>{exact ? "" : "dès "}{chf(price)}</span></div>
              <div className="line small muted"><span>{longDate(date)} à {slot.start}</span><span>{dur(svc.durationMin)}</span></div>
              <div className="line total"><span>Acompte à payer maintenant</span><span>{chf(deposit)}</span></div>
              <div className="line small muted"><span>Solde le jour du rendez-vous</span><span>{exact ? "" : "dès "}{chf(price - deposit)}</span></div>
            </div>

            <label className="small" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" required checked={accept} onChange={(e) => setAccept(e.target.checked)} style={{ marginTop: 4 }} />
              <span>J&apos;ai lu les conditions : {cancellationPolicy}</span>
            </label>

            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <button className="btn btn-accent btn-block" disabled={loading || !accept || !exact}>
              {loading ? "Redirection vers le paiement…" : `Payer l'acompte de ${chf(deposit)}`}
            </button>
            <p className="small muted center">Paiement sécurisé par carte ou TWINT.</p>
          </form>
        </div>
      )}
    </div>
  );
}
