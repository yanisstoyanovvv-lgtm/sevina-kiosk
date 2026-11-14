// ===== THIS WEEK'S RESERVATIONS – EDIT THIS FILE ONLY (once per voting week) =====
// Voting week = Wednesday 00:00 → Tuesday 23:59 (Sofia). Put the week's quiz nights (Fri, Sat) in `nights`.
// Each night's `teams` list (name + number of people) is used for:
//   1) the seating map ("Къде седи отборът ти?") – the kiosk shows tonight's night (or the next one this week),
//   2) the team dropdown on the vote screen – ALL teams of the week's nights (a team on both nights appears once),
//   3) the vote cap – a team can cast at most `size` votes per voting week (one per person), enforced by the server.
// Per week: replace the `nights` block (date yyyy-mm-dd, label, teams). Set example:false once the real reservations are in.
// Seats: if a team has `seats`, exactly those seats are shown (fixed plan); teams without `seats` are allocated automatically
// (2-row blocks, biggest first, around the fixed seats). seats = [[row, fromSeat, toSeat], ...]. Seat 1 is on the right (as on the cinema plan).
// To RENAME a team: change only the text in name:"…" on its line (seats and size stay). Votes are counted per team name.
window.SEATING = {
  // Cinema layout (exact plan). rows[i] = seats in row i+1 (row 1 = closest to the stage). blocked = unavailable seats.
  sections: [
    {id: "p", name: "ПАРТЕР", rows: [11,12,11,12,11,12,11,12,11,12,9,8,9,8,9]}
  ],
  // 2026-11-14: FIXED plan approved by Yanis (blocks 1–14 = rows 1+2 … 13+14, odd = left, even = right; 7 seats each,
  // Masters 9; row 15 and middle seats empty). Go Go's Girls removed. size = real headcount = vote cap.
  example: false,
  // ---- NIGHTS THIS WEEK (team name exactly as on the reservation; size = number of people) ----
  nights: [
    {date: "2026-11-14", label: "Събота 14.11 – MEGA 1st", teams: [
      {name: "Masters", size: 8, seats: [[1,8,11],[2,8,12]]},   // блок 1 (ляво)
      {name: "The Sunshines", size: 7, seats: [[2,1,4],[1,1,3]]},   // блок 2 (дясно)
      {name: "Бжижек", size: 6, seats: [[4,9,12],[3,9,11]]},   // блок 3 (ляво)
      {name: "Антракс", size: 6, seats: [[4,1,4],[3,1,3]]},   // блок 4 (дясно)
      {name: "Съквартирантите", size: 4, seats: [[6,9,12],[5,9,11]]},   // блок 5 (ляво)
      {name: "Домакините", size: 6, seats: [[6,1,4],[5,1,3]]},   // блок 6 (дясно)
      {name: "Леля ти", size: 7, seats: [[8,9,12],[7,9,11]]},   // блок 7 (ляво)
      {name: "Черно и Бяло", size: 6, seats: [[8,1,4],[7,1,3]]},   // блок 8 (дясно)
      {name: "Наглите", size: 6, seats: [[10,9,12],[9,9,11]]},   // блок 9 (ляво)
      {name: "сРали сме в читалището", size: 6, seats: [[10,1,4],[9,1,3]]},   // блок 10 (дясно)
      {name: "Стефан?", size: 5, seats: [[11,6,9],[12,6,8]]},   // блок 11 (ляво)
      {name: "Ойт", size: 7, seats: [[11,1,4],[12,1,3]]},   // блок 12 (дясно)
      {name: "F.R.I.E.N.D.S.", size: 6, seats: [[13,6,9],[14,6,8]]},   // блок 13 (ляво)
      {name: "Стрелата", size: 6, seats: [[13,1,4],[14,1,3]]}    // блок 14 (дясно)
    ]}
  ]
  // ---- end of nights ----
};
