import assert from "node:assert/strict";
import { test } from "node:test";
import { availableDays, nowInZurich, servicesFittingAt, slotsForDay, toMinutes } from "../lib/slots.ts";

// Mardi 1er décembre 2026 à 08:00 à Genève comme « maintenant ».
const NOW = { date: "2026-12-01", minutes: 8 * 60 };
const WED = "2026-12-02"; // mercredi, 09:00-18:00
const SUN = "2026-12-06"; // dimanche, ouvert 24 h/24

test("jour bloqué et jour passé : aucun créneau ; dimanche ouvert", () => {
  assert.ok(slotsForDay(SUN, [], [], NOW).length > 0);
  assert.equal(slotsForDay(WED, [], [WED], NOW).length, 0);
  assert.equal(slotsForDay("2026-11-30", [], [], NOW).length, 0);
});

test("préavis de 24 h : le lendemain commence à 08:00 + 24 h", () => {
  const slots = slotsForDay(WED, [], [], NOW);
  assert.equal(slots[0].start, "08:00");
  const tomorrowLate = slotsForDay(WED, [], [], { date: "2026-12-01", minutes: 14 * 60 });
  assert.equal(tomorrowLate[0].start, "14:00");
});

test("un lissage (4 h) ne peut pas commencer après 20:00 (fin de journée 24:00)", () => {
  const at2000 = servicesFittingAt(WED, toMinutes("20:00"), []).map((s) => s.id);
  const at2030 = servicesFittingAt(WED, toMinutes("20:30"), []).map((s) => s.id);
  assert.ok(at2000.includes("lissage-indien"));
  assert.ok(!at2030.includes("lissage-indien"));
  assert.ok(at2030.includes("botox-spiruline")); // 3 h 30 : 20:30-24:00
  assert.ok(!servicesFittingAt(WED, toMinutes("21:00"), []).some((s) => s.id === "botox-spiruline"));
});

test("dernier créneau de la journée : 23:30, seules les prestations de 30 min tiennent", () => {
  const last = slotsForDay(WED, [], [], NOW).at(-1)!;
  assert.equal(last.start, "23:30");
  assert.deepEqual(last.services.map((s) => s.id).sort(), ["coupe-fourche", "devis"]);
});

test("une réservation 10:00-13:00 bloque le créneau, avec 30 min de trajet avant et après", () => {
  const busy = [{ date: WED, startMin: toMinutes("10:00"), endMin: toMinutes("13:00") }];
  const starts = slotsForDay(WED, busy, [], NOW).map((s) => s.start);
  // 09:00 : seules les prestations de 30 min tiennent (09:30 + 30 min de trajet = 10:00)
  const s0900 = slotsForDay(WED, busy, [], NOW).find((s) => s.start === "09:00")!;
  assert.deepEqual(s0900.services.map((s) => s.id).sort(), ["coupe-fourche", "devis"]);
  assert.ok(!starts.includes("09:30"));
  for (const t of ["10:00", "11:00", "12:30", "13:00"]) assert.ok(!starts.includes(t), t);
  assert.ok(starts.includes("13:30"));
  // à 13:30, la pose Weft (1 h 30) finit à 15:00 : OK
  const s1330 = slotsForDay(WED, busy, [], NOW).find((s) => s.start === "13:30")!;
  assert.ok(s1330.services.some((s) => s.id === "weft-200g"));
});

test("prestation longue refusée si elle chevauche un rendez-vous plus tard", () => {
  const busy = [{ date: WED, startMin: toMinutes("14:00"), endMin: toMinutes("15:00") }];
  const at1100 = servicesFittingAt(WED, toMinutes("11:00"), busy).map((s) => s.id);
  assert.ok(!at1100.includes("lissage-indien")); // 11:00-15:00 chevauche 14:00
  assert.ok(at1100.includes("weft-200g")); // 11:00-12:30 + 30 = 13:00 ≤ 14:00
  assert.ok(!servicesFittingAt(WED, toMinutes("12:30"), busy).some((s) => s.id === "weft-200g")); // 12:30-14:00 + 30 > 14:00
});

test("fenêtre de 60 jours", () => {
  const days = availableDays([], [], NOW);
  assert.ok(days.length > 40);
  assert.ok(days.every((d) => d > NOW.date && d <= "2027-01-30"));
  assert.ok(days.includes(SUN));
});

test("nowInZurich gère l'heure d'été / d'hiver", () => {
  assert.deepEqual(nowInZurich(new Date("2026-07-01T10:00:00Z")), { date: "2026-07-01", minutes: 12 * 60 });
  assert.deepEqual(nowInZurich(new Date("2026-12-31T23:30:00Z")), { date: "2027-01-01", minutes: 30 });
});

test("grilles de prix : options et prix « dès » correspondent aux tarifs", async () => {
  const { services } = await import("../lib/config.ts");
  const get = (id: string) => services.find((s) => s.id === id)!;
  const weft = get("weft-200g");
  assert.equal(weft.variants!.length, 18);
  assert.equal(weft.price, 480);
  assert.equal(weft.variants!.find((v) => v.id === "65-couleur-claire")!.price, 650);
  assert.equal(weft.variants!.find((v) => v.id === "70-ombre")!.price, 710);
  assert.equal(get("tape-ins-200g").variants!.find((v) => v.id === "55-couleur-foncee")!.price, 520);
  assert.deepEqual(get("lissage-ruby").variants!.map((v) => v.price), [220, 250, 280, 300]);
  assert.equal(get("devis").priceFrom, undefined);
  for (const s of services) {
    assert.ok(s.deposit <= s.price, `acompte > prix pour ${s.id}`);
    assert.equal(new Set((s.variants ?? []).map((v) => v.id)).size, (s.variants ?? []).length, `ids en double ${s.id}`);
  }
});
