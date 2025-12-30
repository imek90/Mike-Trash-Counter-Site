import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TrashEntry } from "@/models/TrashEntry";

export async function GET() {
  await connectDB();

  const entries = await TrashEntry.find();

  const now = new Date();

  // Start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let daily: Record<string, number> = {};
  let weeklyTotal = 0;
  let monthlyTotal = 0;

  entries.forEach((e) => {
    const entryDate = new Date(e.date); // <-- important!
    const dayKey = entryDate.toISOString().split("T")[0];

    daily[dayKey] = (daily[dayKey] || 0) + e.count;

    if (entryDate >= startOfWeek) weeklyTotal += e.count;
    if (entryDate >= startOfMonth) monthlyTotal += e.count;
  });

  return NextResponse.json({
    daily,
    weeklyTotal,
    monthlyTotal,
    entries,
  });
}

export async function POST(request: Request) {
  await connectDB();

  const { date, count } = await request.json();

  const entry = await TrashEntry.create({ date, count });

  return NextResponse.json(entry);
}

export async function DELETE(request: Request) {
  await connectDB();

  const { date } = await request.json();

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Find the entry for that date
  const entry = await TrashEntry.findOne({
    date: {
      $gte: targetDate,
      $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Nothing to undo → return OK (idempotent)
  if (!entry) {
    return NextResponse.json({ ok: true });
  }

  // If count > 1, decrement
  if (entry.count > 1) {
    entry.count -= 1;
    await entry.save();
    return NextResponse.json(entry);
  }

  // If count === 1, delete the document
  await TrashEntry.deleteOne({ _id: entry._id });

  return NextResponse.json({ ok: true });
}
