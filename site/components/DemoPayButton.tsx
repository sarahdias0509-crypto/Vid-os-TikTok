"use client";
import { useState } from "react";

export default function DemoPayButton({ type, id }: { type: string; id: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function pay() {
    setBusy(true);
    const r = await fetch("/api/demo-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); setBusy(false); return; }
    window.location.href = d.url;
  }
  return (
    <>
      {err && <p className="alert alert-error">{err}</p>}
      <button className="btn btn-accent btn-block" onClick={pay} disabled={busy}>{busy ? "…" : "Simuler le paiement réussi"}</button>
    </>
  );
}
