// Guest list — keyed by NAME (no codes). Case-insensitive everywhere.
// Mirrors Google Sheet tab "GuestList": NAME | PAX | SIDE | TABLE | STATUS | COMPANIONS | CONTACT | MESSAGE
// Seats used = 1 + companions.length when Attending, 0 when Declined.
window.GAS_URL = "https://script.google.com/macros/s/AKfycbzqwmcSZ1AspOcdxFRMsNK8bPhn9Jl6Q42k0lyqU2KYnACjbvkYbZzx92fFtzrkVZOI/exec";
window.SHEET_TAB = "GuestList";
window.GAS_KEY = ""; // must match ADMIN_KEY in Code.gs (empty = no key needed)

// Shared GAS helpers (used by app.js + admin.js). GET via fetch, POST as
// text/plain to avoid CORS preflight on Apps Script web apps.
window.gasGet = async function (params) {
  const qs = new URLSearchParams(params || {}).toString();
  const res = await fetch(window.GAS_URL + (qs ? "?" + qs : ""), { cache: "no-store" });
  if (!res.ok) throw new Error("GAS GET failed: " + res.status);
  return res.json();
};
window.gasPost = async function (body) {
  const payload = Object.assign({}, body || {});
  if (window.GAS_KEY) payload.key = window.GAS_KEY;
  const res = await fetch(window.GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("GAS POST failed: " + res.status);
  return res.json();
};
window.usingGas = function () { return !!(window.GAS_URL && window.GAS_URL.indexOf("/exec") > 0); };

window.SEED_GUESTS = [
  { name: "Canto Family", pax: 4, side: "Groom", table: "Table 1", status: "pending", companions: [], contact: "", message: "" },
  { name: "Adra Family", pax: 4, side: "Bride", table: "Table 2", status: "pending", companions: [], contact: "", message: "" },
  { name: "Jaira Ondoy", pax: 1, side: "Bride", table: "Table 3", status: "pending", companions: [], contact: "", message: "" },
  { name: "Samuel Paul Canto", pax: 2, side: "Groom", table: "Table 4", status: "pending", companions: [], contact: "", message: "" },
  { name: "Ma. Pauline Canto", pax: 2, side: "Bride", table: "Table 1", status: "attending", companions: ["John Fritz Delafer"], contact: "9123123123", message: "yeahhh" },
  { name: "Joshua Arquiza", pax: 1, side: "Groom", table: "Table 5", status: "declined", companions: [], contact: "", message: "Sorry, can't make it!" },
  { name: "Ibeas Family", pax: 3, side: "Both", table: "Table 6", status: "pending", companions: [], contact: "", message: "" },
  { name: "Hannah Claire Hicks", pax: 2, side: "Both", table: "Table 7", status: "pending", companions: [], contact: "", message: "" }
];
// Seats used helper: shared by guest + admin views
window.seatsUsed = function (g) {
  if (!g) return 0;
  const s = String(g.status || "").toLowerCase();
  if (s === "declined") return 0;
  if (s === "attending" || s === "confirmed") return 1 + ((g.companions || []).length);
  return 0;
};
