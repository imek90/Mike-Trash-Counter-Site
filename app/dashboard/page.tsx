"use client";

import { useEffect, useState } from "react";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type TrashAction =
  | "BIN_OUT"
  | "NEW_BAG"
  | "TRASH_TO_CURB"
  | "TRASH_FROM_CURB"
  | "RECYCLE_TO_CURB"
  | "RECYCLE_FROM_CURB";

const actionLabels: Record<TrashAction, string> = {
  BIN_OUT: "Trash taken to bin",
  NEW_BAG: "New trash bag inserted",
  TRASH_TO_CURB: "Trash can to curb",
  TRASH_FROM_CURB: "Trash can from curb",
  RECYCLE_TO_CURB: "Recycling to curb",
  RECYCLE_FROM_CURB: "Recycling from curb",
};

type DayRecord = {
  date: string;
  actions: {
    type: TrashAction;
    count: number;
    approved: boolean;
  }[];
};

type ApiResponse = {
  days: DayRecord[];
};

export default function Dashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);

  // Fetch history from API
  async function fetchData() {
    const res = await fetch("/api/trash");
    const json = await res.json();
    setData(json);
  }

  // Convert dayIndex (0=Sunday) to ISO date string
  function getISODateForDayIndex(dayIndex: number) {
    const now = new Date();
    const diff = dayIndex - now.getDay();
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    target.setHours(0, 0, 0, 0);
    return target.toISOString();
  }

  // Add one action for a specific day
  async function addAction(dayIndex: number, type: TrashAction) {
    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: getISODateForDayIndex(dayIndex),
        type,
      }),
    });
    fetchData();
  }

  // Toggle approval of an action
  async function toggleApproval(date: string, type: TrashAction) {
    await fetch("/api/trash", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, type }),
    });
    fetchData();
  }

  // Undo one instance of an action
  async function undoAction(date: string, type: TrashAction) {
    await fetch("/api/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, type }), // <-- must include type
    });
    fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <p>Loading…</p>;

  // Group days by month
  const groupedByMonth = data.days.reduce<Record<string, DayRecord[]>>(
    (acc, day) => {
      const monthKey = day.date.slice(0, 7); // YYYY-MM
      acc[monthKey] ??= [];
      acc[monthKey].push(day);
      return acc;
    },
    {}
  );

  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <main style={{ padding: 24 }}>
      <h1>Trash Tracker</h1>

      <h3>Select Day of Week</h3>
      {daysOfWeek.map((day, dayIndex) => (
        <div key={day} style={{ marginBottom: 12 }}>
          <strong>{day}</strong>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(actionLabels).map(([type, label]) => (
              <button
                key={type}
                onClick={() => addAction(dayIndex, type as TrashAction)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <h2>History</h2>

      {sortedMonths.map((month) => (
        <div key={month} style={{ marginBottom: 24 }}>
          <h3>{month}</h3>

          {groupedByMonth[month]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((day) => {
              const dateObj = new Date(day.date);
              const weekday = daysOfWeek[dateObj.getDay()];

              return (
                <div key={day.date} style={{ marginLeft: 16 }}>
                  <strong>
                    {weekday} — {day.date.split("T")[0]}
                  </strong>

                  <ul>
                    {day.actions.map((action) => (
                      <li
                        key={action.type}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={action.approved}
                          onChange={() => toggleApproval(day.date, action.type)}
                        />
                        {actionLabels[action.type]}: {action.count}
                        <button
                          onClick={() => undoAction(day.date, action.type)}
                          disabled={action.count === 0}
                          style={{
                            marginLeft: 8,
                            padding: "2px 6px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Undo
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      ))}
    </main>
  );
}

// "use client";

// import { useEffect, useState } from "react";

// type ApiResponse = {
//   daily: Record<string, number>;
//   weeklyTotal: number;
//   monthlyTotal: number;
// };

// const daysOfWeek = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ];

// export default function Dashboard() {
//   const [data, setData] = useState<ApiResponse | null>(null);

//   async function fetchData() {
//     try {
//       const res = await fetch("/api/trash");
//       if (!res.ok) throw new Error("Network response not OK");
//       const json = await res.json();
//       console.log("Fetched data:", json);
//       setData(json);
//     } catch (err) {
//       console.error("Fetch failed:", err);
//     }
//   }

//   async function addTrashForDate(dayIndex: number) {
//     // Compute the date for the selected day in THIS week
//     const now = new Date();
//     const currentDayIndex = now.getDay();
//     const diff = dayIndex - currentDayIndex;
//     const targetDate = new Date();
//     targetDate.setDate(now.getDate() + diff);
//     targetDate.setHours(0, 0, 0, 0);

//     await fetch("/api/trash", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ date: targetDate.toISOString() }),
//     });

//     fetchData();
//   }

//   async function deleteTrashForDate(dayIndex: number) {
//     const now = new Date();
//     const currentDayIndex = now.getDay();
//     const diff = dayIndex - currentDayIndex;

//     const targetDate = new Date();
//     targetDate.setDate(now.getDate() + diff);
//     targetDate.setHours(0, 0, 0, 0);

//     await fetch("/api/trash", {
//       method: "DELETE",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ date: targetDate.toISOString() }),
//     });

//     fetchData();
//   }

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (!data)
//     return (
//       <div>
//         <p>Loading...</p>
//       </div>
//     );

//   function getISODateForDayIndex(dayIndex: number) {
//     const now = new Date();
//     const currentDayIndex = now.getDay();
//     const diff = dayIndex - currentDayIndex;

//     const targetDate = new Date();
//     targetDate.setDate(now.getDate() + diff);
//     targetDate.setHours(0, 0, 0, 0);

//     return targetDate.toISOString().split("T")[0]; // YYYY-MM-DD
//   }

//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Trash Tracker</h1>

//       <h3>Mark Trash Taken for a Day:</h3>
//       <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//         {daysOfWeek.map((day, index) => (
//           <div key={day} style={{ display: "flex", gap: "4px" }}>
//             <button onClick={() => addTrashForDate(index)}>{day}</button>
//             <button
//               onClick={() => deleteTrashForDate(index)}
//               disabled={
//                 !data.daily[getISODateForDayIndex(index)] ||
//                 data.daily[getISODateForDayIndex(index)] === 0
//               }
//             >
//               Undo
//             </button>
//           </div>
//         ))}
//       </div>

//       <h2>This Week: {data.weeklyTotal}</h2>
//       <h2>This Month: {data.monthlyTotal}</h2>

//       <h3>Daily Totals</h3>
//       <ul>
//         {Object.entries(data.daily)
//           .sort(
//             ([dateA], [dateB]) =>
//               new Date(dateB).getTime() - new Date(dateA).getTime()
//           )
//           .map(([day, count]) => (
//             <li key={day}>
//               {day}: {count}
//             </li>
//           ))}
//       </ul>
//     </main>
//   );
// }
