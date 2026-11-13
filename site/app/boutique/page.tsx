import { productCategoryLabels, products, shipping } from "@/lib/config.ts";
import Shop from "@/components/Shop.tsx";

export const metadata = { title: "Boutique — Hair by SD" };

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const { annule } = await searchParams;
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Boutique</p>
        <h1>Prends soin de tes cheveux</h1>
        <p className="muted">Les produits que j&apos;utilise et recommande pour tes extensions et ton lissage, et des cartes cadeaux à offrir.</p>
        {annule && <p className="alert alert-info">Paiement annulé : ta commande n&apos;a pas été passée. Ton panier est toujours là.</p>}
        <Shop products={products} categories={productCategoryLabels} shippingOptions={shipping.options} />
      </div>
    </section>
  );
}
