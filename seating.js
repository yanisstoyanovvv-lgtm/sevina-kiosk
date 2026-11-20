// ===== SEVINA KIOSK – layout + weekly nights =====
// Edit this file once per weekend (after Yanis seats the teams).
// Do NOT invent table assignments — leave `table` empty until a table is assigned.
//
// layout: v19 restaurant floor (stable). SVG map: map-v19.svg
//   Table ids T1–T16 run left → right, top → bottom:
//     Outer:    T1 T2 T3 (left → right), T4 corner
//     Inner:    T5–T8 (left → right)
//     Middle:   T9–T12 (left → right)
//     Hall:     T13/T15 left column (T13 above T15), T14/T16 right column (T14 above T16)
//
// nights: this weekend's quiz nights. type is "themed" (Friday) or "gk" (Saturday).
//   themed nights need `theme` (shown on the info page).
//   teams: [{name, size, table:"T1"}]   size = headcount = vote cap
//          or  [{name, size, tables:["T1","T2"]}] if a team has more than one table
//   The vote dropdown lists ALL teams of the weekend (Fri+Sat). The map shows tonight's night.
//   Example teams below are ordered by table id, so the courtyard buttons follow T1 → T16.
//
// example: true shows an "example teams" hint; set false once real reservations are in.

window.SEATING = {
  layout: {id: "v19", map: "map-v19.svg"},
  example: true,
  // ---- NIGHTS THIS WEEKEND ----
  // Fill `teams` after reservations come in. Add table:"T1" (or tables:["T1","T2"])
  // only after Yanis assigns a table. Leave table out if the team is not seated yet.
  nights: [
    {date: "2026-11-20", label: "Петък 20.11 – тематичен", type: "themed", theme: "🌍 Около света", teams: [
      {name: "Примерен отбор М", size: 8, tables: ["T1","T2"]},
      {name: "Примерен отбор Н", size: 6, table: "T3"},
      {name: "Примерен отбор О", size: 6, table: "T4"},
      {name: "Примерен отбор И", size: 6, table: "T5"},
      {name: "Примерен отбор Й", size: 6, table: "T6"},
      {name: "Примерен отбор К", size: 6, table: "T7"},
      {name: "Примерен отбор Л", size: 6, table: "T8"},
      {name: "Примерен отбор Д", size: 6, table: "T9"},
      {name: "Примерен отбор Е", size: 6, table: "T10"},
      {name: "Примерен отбор Ж", size: 6, table: "T11"},
      {name: "Примерен отбор З", size: 6, table: "T12"},
      {name: "Примерен отбор В", size: 6, table: "T13"},
      {name: "Примерен отбор Г", size: 6, table: "T14"},
      {name: "Примерен отбор А", size: 6, table: "T15"},
      {name: "Примерен отбор Б", size: 6, table: "T16"}
    ]},
    {date: "2026-11-21", label: "Събота 21.11 – общи знания", type: "gk", teams: [
      {name: "Примерен отбор М", size: 8, tables: ["T1","T2"]},
      {name: "Примерен отбор Н", size: 6, table: "T3"},
      {name: "Примерен отбор О", size: 6, table: "T4"},
      {name: "Примерен отбор И", size: 6, table: "T5"},
      {name: "Примерен отбор Й", size: 6, table: "T6"},
      {name: "Примерен отбор К", size: 6, table: "T7"},
      {name: "Примерен отбор Л", size: 6, table: "T8"},
      {name: "Примерен отбор Д", size: 6, table: "T9"},
      {name: "Примерен отбор Е", size: 6, table: "T10"},
      {name: "Примерен отбор Ж", size: 6, table: "T11"},
      {name: "Примерен отбор З", size: 6, table: "T12"},
      {name: "Примерен отбор В", size: 6, table: "T13"},
      {name: "Примерен отбор Г", size: 6, table: "T14"},
      {name: "Примерен отбор А", size: 6, table: "T15"},
      {name: "Примерен отбор Б", size: 6, table: "T16"}
    ]}
  ]
  // ---- end of nights ----
};
