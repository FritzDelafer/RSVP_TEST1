// Seed guest list - like MaArtiste RSVP: only invited codes can confirm
// pax = max seats reserved for that code (includes main guest + companions)
window.SEED_GUESTS = [
  { code: "MA-ART-001", name: "Dela Cruz Family", pax: 4, side: "Bride", table: "T-01", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { code: "MA-ART-002", name: "Juan Santos + Guest", pax: 2, side: "Groom", table: "T-02", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { code: "MA-ART-003", name: "Maria Reyes", pax: 1, side: "Bride", table: "T-03", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { code: "MA-ART-004", name: "Santos Family", pax: 5, side: "Groom", table: "T-04", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { code: "MA-ART-005", name: "Katrina Uy", pax: 2, side: "Bride", table: "T-05", status: "confirmed", attending: 2, companions: ["Paolo Uy"], contact: "0917-xxx-xxxx", message: "So excited!", updatedAt: "2026-09-20T10:00:00.000Z" },
  { code: "MA-ART-006", name: "Jose Miguel", pax: 1, side: "Groom", table: "T-06", status: "declined", attending: 0, companions: [], contact: "", message: "Sorry, out of town!", updatedAt: "2026-09-18T10:00:00.000Z" },
  { code: "MA-ART-007", name: "Aquino Family", pax: 3, side: "Both", table: "T-07", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null },
  { code: "MA-ART-008", name: "Bea Lim", pax: 2, side: "Bride", table: "T-08", status: "pending", attending: 0, companions: [], contact: "", message: "", updatedAt: null }
];
