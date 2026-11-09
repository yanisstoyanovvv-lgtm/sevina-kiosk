// ===== THIS WEEK'S RESERVATIONS – EDIT THIS FILE ONLY (once per voting week) =====
// Voting week = Wednesday 00:00 → Tuesday 23:59 (Sofia). Put the week's quiz nights (Fri, Sat) in `nights`.
// Each night's `teams` list (name + number of people) is used for:
//   1) the seating map ("Къде седи отборът ти?") – the kiosk shows tonight's night (or the next one this week),
//   2) the team dropdown on the vote screen – ALL teams of the week's nights (a team on both nights appears once),
//   3) the vote cap – a team can cast at most `size` votes per voting week (one per person), enforced by the server.
// Per week: replace the `nights` block (date yyyy-mm-dd, label, teams). Set example:false once the real reservations are in.
// Seats are allocated automatically at load: 2-row blocks (rows 1+2, 3+4, …), width = ceil(size/2), biggest teams first,
// 1 empty seat between teams, ПАРТЕР only. Seat 1 is on the right (as on the cinema plan).
window.SEATING = {
  // Cinema layout (exact plan). rows[i] = seats in row i+1 (row 1 = closest to the stage). blocked = unavailable seats.
  sections: [
    {id: "p", name: "ПАРТЕР", rows: [11,12,11,12,11,12,11,12,11,12,9,8,9,8,9]}
  ],
  example: true,
  // ---- NIGHTS THIS WEEK (team name exactly as on the reservation; size = number of people) ----
  nights: [
    {date: "2026-11-14", label: "Петък 14.11 – MEGA 1st", teams: [
      {name: "Мозъчна атака", size: 6},
      {name: "Гугъл не помага", size: 5},
      {name: "Вечните втори", size: 8},
      {name: "Пингвините", size: 4},
      {name: "Бургаски умници", size: 7},
      {name: "Шопска салата", size: 6},
      {name: "Знайковци", size: 4},
      {name: "Без жокер", size: 5},
      {name: "Морски вълци", size: 8},
      {name: "Пет и половина", size: 6},
      {name: "Котките на Шрьодингер", size: 4},
      {name: "Последен ред", size: 7}
    ]},
    {date: "2026-11-15", label: "Събота 15.11", teams: [
      // add Saturday's reservations here, e.g. {name: "Отбор", size: 6},
    ]}
  ]
  // ---- end of nights ----
};
