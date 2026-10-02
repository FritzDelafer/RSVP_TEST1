// Guest list — keyed by NAME (no codes). Case-insensitive everywhere.
// Mirrors Google Sheet tab "GuestList": NAME | PAX | SIDE | TABLE | STATUS | ATTENDING | COMPANIONS | CONTACT | MESSAGE | UpdatedAt
// Paste the Apps Script web-app URL here to go live (shared data). Empty = local demo mode.
window.GAS_URL = "";
window.SHEET_TAB = "GuestList";

window.SEED_GUESTS = [
  { name: "Canto Family", pax: 4, side: "Groom", table: "Table 1", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { name: "Adra Family", pax: 4, side: "Bride", table: "Table 2", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { name: "Jaira Ondoy", pax: 1, side: "Bride", table: "Table 3", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { name: "Samuel Paul Canto", pax: 2, side: "Groom", table: "Table 4", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { name: "Ma. Pauline Canto", pax: 2, side: "Bride", table: "Table 1", status: "confirmed", attending: 2, companions: ["John Fritz Delafer"], contact: "9123123123", message: "yeahhh", updatedAt: "2026-09-20T10:00:00.000Z" },
  { name: "Joshua Arquiza", pax: 1, side: "Groom", table: "Table 5", status: "declined", attending: 0, companions: [], contact: "", message: "Sorry, can't make it!", updatedAt: "2026-09-18T10:00:00.000Z" },
  { name: "Ibeas Family", pax: 3, side: "Both", table: "Table 6", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { name: "Hannah Claire Hicks", pax: 2, side: "Both", table: "Table 7", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null }
];
