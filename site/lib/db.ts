import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { booking as bookingCfg } from "./config.ts";
import type { BusyRange } from "./slots.ts";

export type Status = "pending" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  createdAt: string;
  status: Status;
  date: string;
  startMin: number;
  endMin: number;
  serviceId: string;
  serviceName: string;
  price: number;
  deposit: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  stripeSessionId: string | null;
};

export type OrderItem = { productId: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  createdAt: string;
  status: Status;
  items: OrderItem[];
  shippingId: string;
  shippingPrice: number;
  total: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  stripeSessionId: string | null;
};

export type NewBooking = Omit<Booking, "id" | "createdAt" | "status" | "stripeSessionId">;
export type NewOrder = Omit<Order, "id" | "createdAt" | "status" | "stripeSessionId">;

interface Store {
  /** Crée la réservation seulement si le créneau est encore libre (sinon null). */
  createBookingIfFree(b: NewBooking): Promise<Booking | null>;
  getBooking(id: string): Promise<Booking | null>;
  setBookingSession(id: string, sessionId: string): Promise<void>;
  setBookingStatus(id: string, status: Status): Promise<void>;
  listBookings(): Promise<Booking[]>;
  busyRanges(): Promise<BusyRange[]>;
  createOrder(o: NewOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  setOrderSession(id: string, sessionId: string): Promise<void>;
  setOrderStatus(id: string, status: Status): Promise<void>;
  listOrders(): Promise<Order[]>;
  blockedDates(): Promise<string[]>;
  setBlocked(date: string, blocked: boolean): Promise<void>;
}

function holdCutoff(): number {
  return Date.now() - bookingCfg.holdMinutes * 60_000;
}

/** Une réservation occupe le créneau si elle est confirmée, ou en attente de paiement depuis peu. */
function isBusy(b: Pick<Booking, "status" | "createdAt">): boolean {
  return b.status === "confirmed" || (b.status === "pending" && new Date(b.createdAt).getTime() > holdCutoff());
}

function overlaps(a: { date: string; startMin: number; endMin: number }, b: BusyRange): boolean {
  const buf = bookingCfg.travelBufferMin;
  return a.date === b.date && !(a.endMin + buf <= b.startMin || a.startMin >= b.endMin + buf);
}

// ── Fichier JSON (développement local uniquement) ───────────────────────────
type FileData = { bookings: Booking[]; orders: Order[]; blocked: string[] };

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "db.json");
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<FileData> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      return { bookings: [], orders: [], blocked: [] };
    }
  }
  private async write(d: FileData) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(d, null, 2));
  }
  /** Sérialise les modifications pour éviter deux réservations simultanées du même créneau. */
  private mutate<T>(fn: (d: FileData) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const d = await this.read();
      const r = await fn(d);
      await this.write(d);
      return r;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  createBookingIfFree(nb: NewBooking) {
    return this.mutate((d) => {
      const busy = d.bookings.filter(isBusy);
      if (busy.some((b) => overlaps(nb, b))) return null;
      const b: Booking = { ...nb, id: randomUUID(), createdAt: new Date().toISOString(), status: "pending", stripeSessionId: null };
      d.bookings.push(b);
      return b;
    });
  }
  async getBooking(id: string) {
    return (await this.read()).bookings.find((b) => b.id === id) ?? null;
  }
  setBookingSession(id: string, sessionId: string) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (b) b.stripeSessionId = sessionId;
    });
  }
  setBookingStatus(id: string, status: Status) {
    return this.mutate((d) => {
      const b = d.bookings.find((x) => x.id === id);
      if (b) b.status = status;
    });
  }
  async listBookings() {
    return (await this.read()).bookings;
  }
  async busyRanges() {
    return (await this.read()).bookings.filter(isBusy).map(({ date, startMin, endMin }) => ({ date, startMin, endMin }));
  }
  createOrder(no: NewOrder) {
    return this.mutate((d) => {
      const o: Order = { ...no, id: randomUUID(), createdAt: new Date().toISOString(), status: "pending", stripeSessionId: null };
      d.orders.push(o);
      return o;
    });
  }
  async getOrder(id: string) {
    return (await this.read()).orders.find((o) => o.id === id) ?? null;
  }
  setOrderSession(id: string, sessionId: string) {
    return this.mutate((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (o) o.stripeSessionId = sessionId;
    });
  }
  setOrderStatus(id: string, status: Status) {
    return this.mutate((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (o) o.status = status;
    });
  }
  async listOrders() {
    return (await this.read()).orders;
  }
  async blockedDates() {
    return (await this.read()).blocked;
  }
  setBlocked(date: string, blocked: boolean) {
    return this.mutate((d) => {
      d.blocked = d.blocked.filter((x) => x !== date);
      if (blocked) d.blocked.push(date);
      d.blocked.sort();
    });
  }
}

// ── Postgres (production) ───────────────────────────────────────────────────
class PgStore implements Store {
  private sql: import("postgres").Sql;
  private ready: Promise<void>;

  constructor(url: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres") as typeof import("postgres");
    this.sql = postgres(url, { ssl: url.includes("localhost") ? false : "require", max: 3 });
    this.ready = this.migrate();
  }

  private async migrate() {
    await this.sql`create table if not exists bookings (
      id uuid primary key, created_at timestamptz not null default now(), status text not null,
      date text not null, start_min int not null, end_min int not null,
      service_id text not null, service_name text not null, price numeric not null, deposit numeric not null,
      name text not null, email text not null, phone text not null, address text not null, notes text not null,
      stripe_session_id text)`;
    await this.sql`create table if not exists orders (
      id uuid primary key, created_at timestamptz not null default now(), status text not null,
      items jsonb not null, shipping_id text not null, shipping_price numeric not null, total numeric not null,
      name text not null, email text not null, phone text not null, address text not null, stripe_session_id text)`;
    await this.sql`create table if not exists blocked_dates (date text primary key)`;
  }

  private toBooking(r: Record<string, unknown>): Booking {
    return {
      id: r.id as string, createdAt: new Date(r.created_at as string).toISOString(), status: r.status as Status,
      date: r.date as string, startMin: r.start_min as number, endMin: r.end_min as number,
      serviceId: r.service_id as string, serviceName: r.service_name as string,
      price: Number(r.price), deposit: Number(r.deposit), name: r.name as string, email: r.email as string,
      phone: r.phone as string, address: r.address as string, notes: r.notes as string,
      stripeSessionId: (r.stripe_session_id as string) ?? null,
    };
  }
  private toOrder(r: Record<string, unknown>): Order {
    return {
      id: r.id as string, createdAt: new Date(r.created_at as string).toISOString(), status: r.status as Status,
      items: r.items as OrderItem[], shippingId: r.shipping_id as string, shippingPrice: Number(r.shipping_price),
      total: Number(r.total), name: r.name as string, email: r.email as string, phone: r.phone as string,
      address: r.address as string, stripeSessionId: (r.stripe_session_id as string) ?? null,
    };
  }

  async createBookingIfFree(nb: NewBooking) {
    await this.ready;
    const holdSince = new Date(holdCutoff());
    // Transaction + verrou : deux clientes ne peuvent pas prendre le même créneau en même temps.
    return this.sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext(${nb.date}))`;
      const rows = await tx`select date, start_min, end_min from bookings where date = ${nb.date}
        and (status = 'confirmed' or (status = 'pending' and created_at > ${holdSince}))`;
      const busy = rows.map((r) => ({ date: r.date as string, startMin: r.start_min as number, endMin: r.end_min as number }));
      if (busy.some((b) => overlaps(nb, b))) return null;
      const [r] = await tx`insert into bookings (id, status, date, start_min, end_min, service_id, service_name, price, deposit, name, email, phone, address, notes)
        values (${randomUUID()}, 'pending', ${nb.date}, ${nb.startMin}, ${nb.endMin}, ${nb.serviceId}, ${nb.serviceName}, ${nb.price}, ${nb.deposit},
        ${nb.name}, ${nb.email}, ${nb.phone}, ${nb.address}, ${nb.notes}) returning *`;
      return this.toBooking(r);
    }) as Promise<Booking | null>;
  }
  async getBooking(id: string) {
    await this.ready;
    const [r] = await this.sql`select * from bookings where id = ${id}`;
    return r ? this.toBooking(r) : null;
  }
  async setBookingSession(id: string, sessionId: string) {
    await this.ready;
    await this.sql`update bookings set stripe_session_id = ${sessionId} where id = ${id}`;
  }
  async setBookingStatus(id: string, status: Status) {
    await this.ready;
    await this.sql`update bookings set status = ${status} where id = ${id}`;
  }
  async listBookings() {
    await this.ready;
    return (await this.sql`select * from bookings order by date, start_min`).map((r) => this.toBooking(r));
  }
  async busyRanges() {
    await this.ready;
    const holdSince = new Date(holdCutoff());
    const rows = await this.sql`select date, start_min, end_min from bookings
      where status = 'confirmed' or (status = 'pending' and created_at > ${holdSince})`;
    return rows.map((r) => ({ date: r.date as string, startMin: r.start_min as number, endMin: r.end_min as number }));
  }
  async createOrder(no: NewOrder) {
    await this.ready;
    const [r] = await this.sql`insert into orders (id, status, items, shipping_id, shipping_price, total, name, email, phone, address)
      values (${randomUUID()}, 'pending', ${this.sql.json(no.items)}, ${no.shippingId}, ${no.shippingPrice}, ${no.total},
      ${no.name}, ${no.email}, ${no.phone}, ${no.address}) returning *`;
    return this.toOrder(r);
  }
  async getOrder(id: string) {
    await this.ready;
    const [r] = await this.sql`select * from orders where id = ${id}`;
    return r ? this.toOrder(r) : null;
  }
  async setOrderSession(id: string, sessionId: string) {
    await this.ready;
    await this.sql`update orders set stripe_session_id = ${sessionId} where id = ${id}`;
  }
  async setOrderStatus(id: string, status: Status) {
    await this.ready;
    await this.sql`update orders set status = ${status} where id = ${id}`;
  }
  async listOrders() {
    await this.ready;
    return (await this.sql`select * from orders order by created_at desc`).map((r) => this.toOrder(r));
  }
  async blockedDates() {
    await this.ready;
    return (await this.sql`select date from blocked_dates order by date`).map((r) => r.date as string);
  }
  async setBlocked(date: string, blocked: boolean) {
    await this.ready;
    if (blocked) await this.sql`insert into blocked_dates (date) values (${date}) on conflict do nothing`;
    else await this.sql`delete from blocked_dates where date = ${date}`;
  }
}

const g = globalThis as unknown as { __hairbysdStore?: Store };

export function db(): Store {
  if (!g.__hairbysdStore) {
    g.__hairbysdStore = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new FileStore();
  }
  return g.__hairbysdStore;
}
