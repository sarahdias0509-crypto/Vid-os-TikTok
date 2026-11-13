export type Customer = { name: string; email: string; phone: string; address: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valide les coordonnées de la cliente ; renvoie un message d'erreur en français ou les données propres. */
export function parseCustomer(body: Record<string, unknown>, needAddress: boolean): Customer | string {
  const c = {
    name: str(body.name, 100),
    email: str(body.email, 200),
    phone: str(body.phone, 40),
    address: str(body.address, 300),
  };
  if (c.name.length < 2) return "Indique ton prénom et ton nom.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return "Adresse e-mail invalide.";
  if (c.phone.replace(/[^\d]/g, "").length < 9) return "Numéro de téléphone invalide.";
  if (needAddress && c.address.length < 8) return "Indique ton adresse complète.";
  return c;
}

export const notes = (v: unknown) => str(v, 1000);
