import { NextResponse } from "next/server";
import { db } from "@/lib/db.ts";
import { availableDays, slotsForDay } from "@/lib/slots.ts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  const [busy, blocked] = await Promise.all([db().busyRanges(), db().blockedDates()]);
  if (!date) return NextResponse.json({ days: availableDays(busy, blocked) });
  const slots = slotsForDay(date, busy, blocked).map((s) => ({
    start: s.start,
    services: s.services.map(({ id, name, category, durationMin, price, priceFrom, deposit, description }) => ({
      id, name, category, durationMin, price, priceFrom, deposit, description,
    })),
  }));
  return NextResponse.json({ date, slots });
}
