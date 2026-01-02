import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TrashEntry } from "@/models/TrashEntry";

export async function GET() {
  await connectDB();

  const entries = await TrashEntry.find().lean();

  const daysMap: Record<
    string,
    {
      date: string;
      actions: {
        type: string;
        count: number;
        approved: boolean;
      }[];
    }
  > = {};

  for (const entry of entries) {
    const date = entry.date;

    if (!daysMap[date]) {
      daysMap[date] = {
        date,
        actions: [],
      };
    }

    const action = daysMap[date].actions.find((a) => a.type === entry.action);

    if (action) {
      action.count += 1;
      action.approved = action.approved && entry.approved;
    } else {
      daysMap[date].actions.push({
        type: entry.action,
        count: 1,
        approved: entry.approved,
      });
    }
  }

  return NextResponse.json({
    days: Object.values(daysMap),
  });
}

export async function POST(req: Request) {
  await connectDB();

  const { date, type } = await req.json();

  if (!date || !type) {
    return NextResponse.json(
      { error: "date and type required" },
      { status: 400 }
    );
  }

  await TrashEntry.create({
    date,
    action: type,
    approved: false,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  await connectDB();

  const { date, type } = await req.json();

  if (!date || !type) {
    return NextResponse.json(
      { error: "date and type required" },
      { status: 400 }
    );
  }

  const entries = await TrashEntry.find({ date, action: type });

  const nextApproved = !entries.every((e) => e.approved);

  await TrashEntry.updateMany(
    { date, action: type },
    { approved: nextApproved }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await connectDB();

  const { date, type } = await req.json();

  if (!date || !type) {
    return NextResponse.json(
      { error: "date and type required" },
      { status: 400 }
    );
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Find **one entry** for this action on that day
  const entry = await TrashEntry.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    action: type,
  });

  if (!entry) return NextResponse.json({ ok: true });

  await TrashEntry.deleteOne({ _id: entry._id });

  return NextResponse.json({ ok: true });
}
