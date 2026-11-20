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
//
// example: true shows an "example teams" hint. Leave false; teams come from the sheet.

window.SEATING = {
  layout: {id: "v19", map: "map-v19.svg"},
  example: false,
  // ---- NIGHTS THIS WEEKEND ----
  // Fill `teams` after reservations come in. Add table:"T1" (or tables:["T1","T2"])
  // only after Yanis assigns a table. Leave table out if the team is not seated yet.
  nights: [
    {date: "2026-11-20", label: "Петък 20.11 – тематичен", type: "themed", teams: []},
    {date: "2026-11-21", label: "Събота 21.11 – общи знания", type: "gk", teams: []}
  ]
  // ---- end of nights ----
};
