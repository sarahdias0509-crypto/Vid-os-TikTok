import { booking as bookingCfg, business, openingHours, services, type Service } from "./config.ts";

// Toutes les heures sont en heure locale de Genève, exprimées en minutes depuis minuit.
// Une date est une chaîne "YYYY-MM-DD".

export type BusyRange = { date: string; startMin: number; endMin: number };

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Date et minute actuelles à Genève. */
export function nowInZurich(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T12:00:00Z`).getTime()) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}

/** Minute absolue (jours * 1440 + minutes) pour comparer avec le préavis minimum. */
function absMinutes(date: string, minutes: number): number {
  return Math.round(new Date(`${date}T00:00:00Z`).getTime() / 60000) + minutes;
}

/** Le jour est-il réservable (ouvert, dans la fenêtre, pas bloqué) ? */
export function isBookableDay(date: string, blockedDates: string[], now = nowInZurich()): boolean {
  if (!isValidDate(date)) return false;
  if (!openingHours[weekday(date)]) return false;
  if (blockedDates.includes(date)) return false;
  if (date < now.date) return false;
  if (date > addDays(now.date, bookingCfg.maxDaysAhead)) return false;
  return true;
}

/**
 * Prestations réservables à `startMin` ce jour-là : la prestation (+ trajet) doit
 * tenir avant la fermeture et ne chevaucher aucune réservation existante (+ trajet).
 */
export function servicesFittingAt(
  date: string,
  startMin: number,
  busy: BusyRange[],
  list: Service[] = services,
): Service[] {
  const hours = openingHours[weekday(date)];
  if (!hours) return [];
  const close = toMinutes(hours.end);
  const buf = bookingCfg.travelBufferMin;
  const sameDay = busy.filter((b) => b.date === date);
  return list.filter((s) => {
    const end = startMin + s.durationMin;
    if (end > close) return false;
    // Chevauchement en comptant le trajet avant et après chaque rendez-vous.
    return sameDay.every((b) => end + buf <= b.startMin || startMin >= b.endMin + buf);
  });
}

export type Slot = { start: string; startMin: number; services: Service[] };

/** Créneaux d'une journée, chacun avec la liste des prestations possibles. */
export function slotsForDay(
  date: string,
  busy: BusyRange[],
  blockedDates: string[],
  now = nowInZurich(),
): Slot[] {
  if (!isBookableDay(date, blockedDates, now)) return [];
  const hours = openingHours[weekday(date)]!;
  const open = toMinutes(hours.start);
  const close = toMinutes(hours.end);
  const earliest = absMinutes(now.date, now.minutes) + bookingCfg.minNoticeHours * 60;
  const slots: Slot[] = [];
  for (let m = open; m < close; m += bookingCfg.slotStepMin) {
    if (absMinutes(date, m) < earliest) continue;
    const fitting = servicesFittingAt(date, m, busy);
    if (fitting.length) slots.push({ start: formatMinutes(m), startMin: m, services: fitting });
  }
  return slots;
}

/** Jours réservables des `maxDaysAhead` prochains jours ayant au moins un créneau. */
export function availableDays(busy: BusyRange[], blockedDates: string[], now = nowInZurich()): string[] {
  const days: string[] = [];
  for (let i = 0; i <= bookingCfg.maxDaysAhead; i++) {
    const d = addDays(now.date, i);
    if (slotsForDay(d, busy, blockedDates, now).length) days.push(d);
  }
  return days;
}
