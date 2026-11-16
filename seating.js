// ===== SEVINA KIOSK – layout + weekly nights =====
// Edit this file once per weekend (after Yanis seats the teams).
// Do NOT invent table assignments — leave `table` empty until a table is assigned.
//
// layout: v19 restaurant floor (stable). SVG map: map-v19.svg
//   Table ids T1–T16 match the key in restaurant-plan/plan-v16.md (updated in plan-v19.md):
//     Hall:     T1/T3 left column (T3 above T1), T2/T4 right column (T4 above T2)
//     Upper:    T5 T6 T7 T8 (left → right). T7 above T1/T3, T8 above T2/T4
//     Lower:    T9–T12 inner row (left → right), T13–T15 outer row, T16 corner
//
// nights: this weekend's quiz nights. type is "themed" (Friday) or "gk" (Saturday).
//   themed nights need `theme` (shown on the info page).
//   teams: [{name, size, table:"T1"}]   size = headcount = vote cap
//          or  [{name, size, tables:["T7","T8"]}] if a team has more than one table
//   The vote dropdown lists ALL teams of the weekend (Fri+Sat). The map shows tonight's night.
//
// example: true shows an "example teams" hint; set false once real reservations are in.

window.SEATING = {
  layout: {id: "v19", map: "map-v19.svg"},
  example: false,
  // ---- NIGHTS THIS WEEKEND ----
  // Fill `teams` after reservations come in. Add table:"T1" (or tables:["T1","T2"])
  // only after Yanis assigns a table. Leave table out if the team is not seated yet.
  nights: [
    {date: "2026-11-20", label: "Петък 20.11 – тематичен", type: "themed", theme: "🌍 Около света", teams: [
      // {name: "Име на отбора", size: 6, table: "T1"}
    ]},
    {date: "2026-11-21", label: "Събота 21.11 – общи знания", type: "gk", teams: [
      // {name: "Име на отбора", size: 6, table: "T2"}
    ]}
  ]
  // ---- end of nights ----
};
