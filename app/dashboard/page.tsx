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

const actionStyles: Record<TrashAction, { button: string; chip: string }> = {
  BIN_OUT: {
    button:
      "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
    chip: "bg-slate-100 text-slate-900 ring-slate-200",
  },
  NEW_BAG: {
    button:
      "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  },
  TRASH_TO_CURB: {
    button:
      "bg-amber-500 text-white hover:bg-amber-400 focus-visible:outline-amber-500",
    chip: "bg-amber-50 text-amber-800 ring-amber-100",
  },
  TRASH_FROM_CURB: {
    button:
      "bg-amber-700 text-white hover:bg-amber-600 focus-visible:outline-amber-700",
    chip: "bg-amber-100 text-amber-900 ring-amber-200",
  },
  RECYCLE_TO_CURB: {
    button:
      "bg-cyan-600 text-white hover:bg-cyan-500 focus-visible:outline-cyan-600",
    chip: "bg-cyan-50 text-cyan-800 ring-cyan-100",
  },
  RECYCLE_FROM_CURB: {
    button:
      "bg-cyan-800 text-white hover:bg-cyan-700 focus-visible:outline-cyan-800",
    chip: "bg-cyan-100 text-cyan-900 ring-cyan-200",
  },
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

  // Compute the start-of-day Date object for a given day in the current week
  function getDateForDayIndex(dayIndex: number) {
    const now = new Date();
    const diff = dayIndex - now.getDay();
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    target.setHours(0, 0, 0, 0);
    return target;
  }

  // Format a Date as YYYY-MM-DD in local time
  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Convert dayIndex (0=Sunday) to date string for API (YYYY-MM-DD format in local time)
  function getISODateForDayIndex(dayIndex: number) {
    const target = getDateForDayIndex(dayIndex);
    return formatLocalDate(target);
  }

  // User-facing label for a day in the current week
  function getDisplayDateForDayIndex(dayIndex: number) {
    const target = getDateForDayIndex(dayIndex);
    return formatLocalDate(target);
  }

  async function sendRequest(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    successMessage: string
  ) {
    try {
      const res = await fetch("/api/trash", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      await fetchData();
    } catch (err) {
      console.error("Trash request failed:", err);
    }
  }

  // Add one action for a specific day
  function addAction(dayIndex: number, type: TrashAction) {
    sendRequest(
      "POST",
      { date: getISODateForDayIndex(dayIndex), type },
      "Action logged"
    );
  }

  // Toggle approval of an action
  function toggleApproval(date: string, type: TrashAction) {
    sendRequest("PATCH", { date, type }, "Approval toggled");
  }

  // Undo one instance of an action
  function undoAction(date: string, type: TrashAction) {
    sendRequest("DELETE", { date, type }, "Action removed");
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (!data)
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
        <span className="mr-3 h-3 w-3 animate-pulse rounded-full bg-slate-400" />
        Loading dashboard…
      </div>
    );

  const totalActions =
    data.days.reduce(
      (sum, day) =>
        sum + day.actions.reduce((inner, action) => inner + action.count, 0),
      0
    ) || 0;

  const approvedActions =
    data.days.reduce(
      (sum, day) =>
        sum +
        day.actions.reduce(
          (inner, action) => inner + (action.approved ? action.count : 0),
          0
        ),
      0
    ) || 0;

  const pendingApprovals = Math.max(totalActions - approvedActions, 0);

  const actionTotals = data.days.reduce<Record<TrashAction, number>>(
    (acc, day) => {
      day.actions.forEach((action) => {
        acc[action.type] = (acc[action.type] ?? 0) + action.count;
      });
      return acc;
    },
    {
      BIN_OUT: 0,
      NEW_BAG: 0,
      TRASH_TO_CURB: 0,
      TRASH_FROM_CURB: 0,
      RECYCLE_TO_CURB: 0,
      RECYCLE_FROM_CURB: 0,
    }
  );

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
    <main className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Overview
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Trash Tracker</h1>
            <p className="max-w-2xl text-sm text-white/80">
              Log household trash and recycling actions, keep approvals visible, and
              maintain a clear weekly cadence.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-inner backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Total</p>
              <p className="text-2xl font-semibold">{totalActions}</p>
              <p className="text-xs text-white/70">All recorded actions</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-inner backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Approved</p>
              <p className="text-2xl font-semibold">{approvedActions}</p>
              <p className="text-xs text-white/70">Marked complete</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-inner backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-white/70">Pending</p>
              <p className="text-2xl font-semibold">{pendingApprovals}</p>
              <p className="text-xs text-white/70">Need approval</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current week
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Log trash & recycling actions
            </h2>
            <p className="text-sm text-slate-600">
              Choose a day this week and log the action. Auto-refreshes after every action.
            </p>
          </div>

          <div className="space-y-3 px-6 py-6">
            {daysOfWeek.map((day, dayIndex) => (
              <div
                key={day}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {day}
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {getDisplayDateForDayIndex(dayIndex)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(actionLabels).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => addAction(dayIndex, type as TrashAction)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${actionStyles[type as TrashAction].button}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
            Tip: actions are saved with midnight timestamps in local time for the selected
            weekday.
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  History
                </p>
                <h2 className="text-xl font-semibold text-slate-900">Monthly timeline</h2>
                <p className="text-sm text-slate-600">
                  Review every action, toggle approvals, or undo accidental logs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                {Object.entries(actionLabels).map(([type, label]) => (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1 ${actionStyles[type as TrashAction].chip}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {label}: {actionTotals[type as TrashAction]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 400px)" }}>
            {sortedMonths.map((month) => (
              <div key={month} className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                  <span className="rounded-lg bg-slate-100 px-3 py-1">{month}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-3">
                  {groupedByMonth[month]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((day) => {
                      const dateObj = new Date(day.date);
                      const weekday = daysOfWeek[dateObj.getDay()];

                      return (
                        <div
                          key={day.date}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {weekday}
                              </p>
                              <p className="text-base font-semibold text-slate-900">
                                {day.date.split("T")[0]}
                              </p>
                              <p className="text-xs text-slate-500">
                                {day.actions.length} action{day.actions.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {day.actions.reduce((acc, a) => acc + a.count, 0)} total
                            </span>
                          </div>

                          <ul className="mt-3 space-y-2">
                            {day.actions.map((action) => (
                              <li
                                key={action.type}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={action.approved}
                                    onChange={() => toggleApproval(day.date, action.type)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    aria-label="Toggle approval"
                                  />
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {actionLabels[action.type]}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {action.approved ? "Approved" : "Needs approval"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                    {action.count}
                                  </span>
                                  <button
                                    onClick={() => undoAction(day.date, action.type)}
                                    disabled={action.count === 0}
                                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Undo
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
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
