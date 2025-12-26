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
