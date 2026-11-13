import { isAdmin } from "@/lib/auth.ts";
import { db, type Status } from "@/lib/db.ts";
import { formatChf, formatDateFr } from "@/lib/format.ts";
import { demoMode } from "@/lib/payments.ts";
import { formatMinutes, nowInZurich } from "@/lib/slots.ts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Hair by SD", robots: { index: false } };

const label: Record<Status, string> = { confirmed: "Confirmé", pending: "En attente", cancelled: "Annulé" };
const Badge = ({ s }: { s: Status }) => <span className={`status status-${s}`}>{label[s]}</span>;

export default async function Admin({ searchParams }: { searchParams: Promise<{ erreur?: string; passes?: string }> }) {
  const { erreur, passes } = await searchParams;

  if (!(await isAdmin())) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 420 }}>
          <h1>Espace admin</h1>
          {!process.env.ADMIN_PASSWORD && <p className="alert alert-info">Définis la variable ADMIN_PASSWORD pour activer l&apos;admin.</p>}
          {erreur && <p className="alert alert-error">Mot de passe incorrect.</p>}
          <form className="form" method="post" action="/api/admin/login">
            <div className="field"><label htmlFor="pw">Mot de passe</label><input id="pw" name="password" type="password" required autoComplete="current-password" /></div>
            <button className="btn btn-primary btn-block">Se connecter</button>
          </form>
        </div>
      </section>
    );
  }

  const today = nowInZurich().date;
  const [bookings, orders, blocked] = await Promise.all([db().listBookings(), db().listOrders(), db().blockedDates()]);
  const visible = bookings
    .filter((b) => b.status !== "pending" || Date.now() - new Date(b.createdAt).getTime() < 60 * 60_000)
    .filter((b) => (passes ? b.date < today : b.date >= today))
    .sort((a, b) => (a.date + a.startMin).localeCompare(b.date + b.startMin) * (passes ? -1 : 1));
  const shownOrders = orders.filter((o) => o.status !== "pending" || Date.now() - new Date(o.createdAt).getTime() < 60 * 60_000);

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>Espace admin</h1>
          <form method="post" action="/api/admin/logout"><button className="btn btn-ghost">Se déconnecter</button></form>
        </div>
        {demoMode() && <p className="alert alert-info" style={{ marginTop: 16 }}>Mode démo : Stripe n&apos;est pas connecté, les paiements sont simulés.</p>}

        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-title">
            <h2>{passes ? "Rendez-vous passés" : "Prochains rendez-vous"}</h2>
            <a className="small" href={passes ? "/admin" : "/admin?passes=1"}>{passes ? "Voir les prochains" : "Voir les passés"}</a>
          </div>
          {!visible.length ? <p className="empty">Aucun rendez-vous.</p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>Prestation</th><th>Cliente</th><th>Acompte / solde</th><th>Statut</th><th></th></tr></thead>
              <tbody>{visible.map((b) => (
                <tr key={b.id}>
                  <td><strong>{formatDateFr(b.date)}</strong><br />{formatMinutes(b.startMin)} – {formatMinutes(b.endMin)}</td>
                  <td>{b.serviceName}{b.notes && <><br /><span className="small muted">{b.notes}</span></>}</td>
                  <td>{b.name}<br /><a href={`tel:${b.phone}`}>{b.phone}</a><br /><a href={`mailto:${b.email}`} className="small">{b.email}</a><br /><span className="small muted">{b.address}</span></td>
                  <td>{formatChf(b.deposit)}<br /><span className="small muted">reste {formatChf(b.price - b.deposit)}</span></td>
                  <td><Badge s={b.status} /></td>
                  <td>{b.status !== "cancelled" && (
                    <form className="inline-form" method="post" action="/api/admin/status">
                      <input type="hidden" name="id" value={b.id} /><input type="hidden" name="kind" value="booking" /><input type="hidden" name="status" value="cancelled" />
                      <button className="linkbtn">Annuler</button>
                    </form>)}
                  </td>
                </tr>))}
              </tbody>
            </table></div>
          )}
          <p className="small muted">Annuler ici libère le créneau. Pense à rembourser l&apos;acompte dans Stripe si besoin.</p>
        </div>

        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-title"><h2>Jours bloqués</h2></div>
          <p className="small muted">Congés, formation… Ces jours-là, personne ne peut réserver.</p>
          <form className="form" method="post" action="/api/admin/block" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
            <div className="field"><label htmlFor="d">Date</label><input id="d" type="date" name="date" min={today} required /></div>
            <button className="btn btn-primary">Bloquer</button>
          </form>
          {!!blocked.length && (
            <ul style={{ marginTop: 12, paddingLeft: 18 }}>
              {blocked.map((d) => (
                <li key={d}>{formatDateFr(d)}{" "}
                  <form className="inline-form" method="post" action="/api/admin/block">
                    <input type="hidden" name="date" value={d} /><input type="hidden" name="action" value="unblock" />
                    <button className="linkbtn">débloquer</button>
                  </form>
                </li>))}
            </ul>
          )}
        </div>

        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-title"><h2>Commandes boutique</h2></div>
          {!shownOrders.length ? <p className="empty">Aucune commande.</p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>Articles</th><th>Cliente</th><th>Livraison</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody>{shownOrders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.createdAt).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich" })}</td>
                  <td>{o.items.map((it) => <div key={it.productId}>{it.qty} × {it.name}</div>)}</td>
                  <td>{o.name}<br /><a href={`tel:${o.phone}`}>{o.phone}</a><br /><a href={`mailto:${o.email}`} className="small">{o.email}</a></td>
                  <td>{o.shippingId === "poste" ? <>La Poste<br /><span className="small muted">{o.address}</span></> : o.shippingId === "rdv" ? "Au rendez-vous" : "E-mail"}</td>
                  <td>{formatChf(o.total)}</td>
                  <td><Badge s={o.status} /></td>
                </tr>))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </section>
  );
}
