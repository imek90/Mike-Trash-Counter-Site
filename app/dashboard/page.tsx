"use client";

import { useEffect, useState } from "react";

type ApiResponse = {
  daily: Record<string, number>;
  weeklyTotal: number;
  monthlyTotal: number;
};

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function Dashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/trash");
      if (!res.ok) throw new Error("Network response not OK");
      const json = await res.json();
      console.log("Fetched data:", json);
      setData(json);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  }

  async function addTrashForDate(dayIndex: number) {
    // Compute the date for the selected day in THIS week
    const now = new Date();
    const currentDayIndex = now.getDay();
    const diff = dayIndex - currentDayIndex;
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + diff);
    targetDate.setHours(0, 0, 0, 0);

    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: targetDate.toISOString() }),
    });

    fetchData();
  }

  async function deleteTrashForDate(dayIndex: number) {
    const now = new Date();
    const currentDayIndex = now.getDay();
    const diff = dayIndex - currentDayIndex;

    const targetDate = new Date();
    targetDate.setDate(now.getDate() + diff);
    targetDate.setHours(0, 0, 0, 0);

    await fetch("/api/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: targetDate.toISOString() }),
    });

    fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (!data)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );

  function getISODateForDayIndex(dayIndex: number) {
    const now = new Date();
    const currentDayIndex = now.getDay();
    const diff = dayIndex - currentDayIndex;

    const targetDate = new Date();
    targetDate.setDate(now.getDate() + diff);
    targetDate.setHours(0, 0, 0, 0);

    return targetDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Trash Tracker</h1>

      <h3>Mark Trash Taken for a Day:</h3>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {daysOfWeek.map((day, index) => (
          <div key={day} style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => addTrashForDate(index)}>{day}</button>
            <button
              onClick={() => deleteTrashForDate(index)}
              disabled={
                !data.daily[getISODateForDayIndex(index)] ||
                data.daily[getISODateForDayIndex(index)] === 0
              }
            >
              Undo
            </button>
          </div>
        ))}
      </div>

      <h2>This Week: {data.weeklyTotal}</h2>
      <h2>This Month: {data.monthlyTotal}</h2>

      <h3>Daily Totals</h3>
      <ul>
        {Object.entries(data.daily).map(([day, count]) => (
          <li key={day}>
            {day}: {count}
          </li>
        ))}
      </ul>
    </main>
  );
}
