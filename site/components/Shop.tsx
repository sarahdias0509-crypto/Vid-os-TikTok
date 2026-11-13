"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/config.ts";

type Cart = Record<string, number>;
const KEY = "hairbysd-cart";
const chf = (n: number) => `${n} CHF`;

function loadCart(): Cart {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function saveCart(c: Cart) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* navigation privée */ }
}

export default function Shop({ products, categories, shippingOptions }: {
  products: Product[];
  categories: Record<string, string>;
  shippingOptions: { id: string; label: string; price: number }[];
}) {
  const [cat, setCat] = useState<string>("tout");
  const [cart, setCart] = useState<Cart>({});
  const [checkout, setCheckout] = useState(false);
  const [ship, setShip] = useState(shippingOptions[0].id);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCart(loadCart()), []);
  const update = (id: string, delta: number) => {
    setCart((c) => {
      const n = { ...c, [id]: Math.max(0, Math.min(20, (c[id] || 0) + delta)) };
      if (!n[id]) delete n[id];
      saveCart(n);
      return n;
    });
  };

  const lines = useMemo(() => products.filter((p) => cart[p.id]).map((p) => ({ p, qty: cart[p.id] })), [products, cart]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const physical = lines.some((l) => !l.p.digital);
  const shipOpt = shippingOptions.find((o) => o.id === ship)!;
  const shipPrice = physical ? shipOpt.price : 0;
  const shown = cat === "tout" ? products : products.filter((p) => p.category === cat);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ id: l.p.id, qty: l.qty })), shippingId: ship, ...form }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); setLoading(false); return; }
      window.location.href = d.url;
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div className="tabs" role="group" aria-label="Catégories">
        <button type="button" className="tab" aria-pressed={cat === "tout"} onClick={() => setCat("tout")}>Tout</button>
        {Object.entries(categories).map(([id, label]) => (
          <button key={id} type="button" className="tab" aria-pressed={cat === id} onClick={() => setCat(id)}>{label}</button>
        ))}
      </div>

      <div className="grid">
        {shown.map((p) => (
          <article key={p.id} className="card product">
            <div className="img" aria-hidden="true">
              {p.image ? <img src={p.image} alt="" /> : p.digital ? "🎁" : "SD"}
            </div>
            <div className="grow">
              <h3>{p.name}</h3>
              <p className="muted small">{p.description}</p>
            </div>
            <div className="price-row">
              <span className="price">{chf(p.price)}</span>
              {p.available === false ? (
                <span className="small muted">Épuisé</span>
              ) : cart[p.id] ? (
                <span className="qty">
                  <button type="button" onClick={() => update(p.id, -1)} aria-label={`Retirer un ${p.name}`}>−</button>
                  <span aria-live="polite">{cart[p.id]}</span>
                  <button type="button" onClick={() => update(p.id, 1)} aria-label={`Ajouter un ${p.name}`}>+</button>
                </span>
              ) : (
                <button type="button" className="btn btn-ghost" style={{ minHeight: 38, padding: "8px 16px" }} onClick={() => update(p.id, 1)}>Ajouter</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {count > 0 && !checkout && (
        <div className="cart-bar">
          <div className="inner">
            <span>{count} article{count > 1 ? "s" : ""} · {chf(subtotal)}</span>
            <button className="btn btn-accent" onClick={() => { setCheckout(true); setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }}>
              Commander
            </button>
          </div>
        </div>
      )}

      {checkout && count > 0 && (
        <div className="panel" ref={checkoutRef} style={{ marginTop: 28, maxWidth: 640 }}>
          <div className="panel-title"><h2>Ma commande</h2>
            <button type="button" className="linkbtn" style={{ color: "var(--muted)" }} onClick={() => setCheckout(false)}>Continuer mes achats</button>
          </div>
          <form className="form" onSubmit={pay}>
            <div className="summary">
              {lines.map((l) => (
                <div key={l.p.id} className="line"><span>{l.qty} × {l.p.name}</span><span>{chf(l.p.price * l.qty)}</span></div>
              ))}
              {physical && <div className="line"><span>Livraison</span><span>{shipPrice ? chf(shipPrice) : "offerte"}</span></div>}
              <div className="line total"><span>Total</span><span>{chf(subtotal + shipPrice)}</span></div>
            </div>
            {physical && (
              <div className="field">
                <label htmlFor="ship">Livraison</label>
                <select id="ship" value={ship} onChange={(e) => setShip(e.target.value)}>
                  {shippingOptions.map((o) => <option key={o.id} value={o.id}>{o.label}{o.price ? ` (+${chf(o.price)})` : " (gratuit)"}</option>)}
                </select>
              </div>
            )}
            {!physical && <p className="small muted">Tes cartes cadeaux te seront envoyées par e-mail.</p>}
            <div className="row2">
              <div className="field"><label htmlFor="s-name">Prénom et nom</label>
                <input id="s-name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-phone">Téléphone</label>
                <input id="s-phone" required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="field"><label htmlFor="s-email">E-mail</label>
              <input id="s-email" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            {physical && ship === "poste" && (
              <div className="field"><label htmlFor="s-address">Adresse de livraison</label>
                <input id="s-address" required autoComplete="street-address" placeholder="Rue, n°, code postal, ville" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            )}
            {error && <p className="alert alert-error" role="alert">{error}</p>}
            <button className="btn btn-accent btn-block" disabled={loading}>{loading ? "Redirection…" : `Payer ${chf(subtotal + shipPrice)}`}</button>
            <p className="small muted center">Paiement sécurisé par carte ou TWINT.</p>
          </form>
        </div>
      )}
    </div>
  );
}
