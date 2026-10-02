/**
 * Jess & Ara Wedding RSVP — Google Sheets backend.
 *
 * SETUP (one time, ~3 minutes):
 * 1. Open your "Guest List" spreadsheet → Extensions → Apps Script.
 * 2. Delete everything in Code.gs → paste this whole file → Save (Ctrl+S).
 * 3. (Optional) In the toolbar dropdown pick function "setup" → Run once →
 *    authorize with your Google account. This creates the "GuestList" tab
 *    with the right headers if missing.
 * 4. Deploy → New deployment → gear icon → Web app:
 *      Execute as: Me
 *      Who has access: Anyone
 *    → Deploy → Authorize → copy the URL ending in /exec
 * 5. Paste that URL to your developer (window.GAS_URL) to go live.
 *
 * Sheet tab: "GuestList"
 * Columns: NAME | PAX | SIDE | TABLE | STATUS | ATTENDING | COMPANIONS | CONTACT | MESSAGE | UpdatedAt
 * - Lookup is case-insensitive. STATUS accepts Attending/Confirmed/Declined/Pending (any case).
 * - COMPANIONS are stored joined with "; ".
 * - If ADMIN_KEY below is set, list/upsert/delete require ?key= or body.key to match.
 */

const TAB_NAME = "GuestList";
const HEADERS = ["NAME","PAX","SIDE","TABLE","STATUS","ATTENDING","COMPANIONS","CONTACT","MESSAGE","UpdatedAt"];
const ADMIN_KEY = ""; // optional: set e.g. "ja-secret-2026", then admin calls must send it

function norm_(s){ return String(s == null ? "" : s).toLowerCase().trim().replace(/\s+/g, " "); }

function sheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB_NAME);
  if(!sh) sh = ss.insertSheet(TAB_NAME);
  return sh;
}

function colMap_(sh){
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(h => norm_(h).toUpperCase().replace(/\s+/g,""));
  const map = {};
  HEADERS.forEach(h => { map[h] = head.indexOf(h); });
  // add any missing headers at the end
  let col = lastCol;
  HEADERS.forEach(h => {
    if(map[h] < 0){ col++; sh.getRange(1, col).setValue(h); map[h] = col - 1; }
  });
  return map;
}

function readStatus_(s){
  const n = norm_(s);
  if(n === "confirmed" || n === "attending" || n === "yes") return "confirmed";
  if(n === "declined" || n === "no") return "declined";
  return "pending";
}
function writeStatus_(s){
  const n = norm_(s);
  if(n === "confirmed" || n === "attending") return "Confirmed";
  if(n === "declined") return "Declined";
  return "Pending";
}

function rowToGuest_(map, vals){
  const at = h => (map[h] >= 0 ? vals[map[h]] : "");
  const comps = String(at("COMPANIONS") || "").split(";").map(c => c.trim()).filter(Boolean);
  return {
    name: String(at("NAME") || "").trim(),
    pax: Math.max(1, parseInt(at("PAX"), 10) || 1),
    side: String(at("SIDE") || "").trim() || "Both",
    table: String(at("TABLE") || "").trim(),
    status: readStatus_(at("STATUS")),
    attending: parseInt(at("ATTENDING"), 10) || 0,
    companions: comps,
    contact: String(at("CONTACT") || "").trim(),
    message: String(at("MESSAGE") || "").trim(),
    updatedAt: String(at("UpdatedAt") || "").trim() || null
  };
}

function listGuests_(){
  const sh = sheet_();
  const map = colMap_(sh);
  const lastRow = sh.getLastRow();
  if(lastRow < 2) return [];
  const width = Math.max(sh.getLastColumn(), HEADERS.length);
  const vals = sh.getRange(2, 1, lastRow - 1, width).getDisplayValues();
  return vals.map(v => rowToGuest_(map, v)).filter(g => g.name !== "");
}

function findRow_(sh, map, name){
  const n = norm_(name);
  const lastRow = sh.getLastRow();
  if(lastRow < 2) return -1;
  const names = sh.getRange(2, map.NAME + 1, lastRow - 1, 1).getDisplayValues().flat();
  for(let i = 0; i < names.length; i++){
    if(norm_(names[i]) === n) return i + 2; // 1-indexed row
  }
  return -1;
}

function out_(obj, callback){
  let t;
  if(callback){
    t = ContentService.createTextOutput(callback + "(" + JSON.stringify(obj) + ");");
    t.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    t = ContentService.createTextOutput(JSON.stringify(obj));
    t.setMimeType(ContentService.MimeType.JSON);
  }
  return t;
}

function checkAdmin_(key){
  if(!ADMIN_KEY) return true;
  return key === ADMIN_KEY;
}

// Run once from the editor to create tab + headers.
function setup(){
  const sh = sheet_();
  colMap_(sh);
}

function doGet(e){
  try{
    const p = (e && e.parameter) || {};
    const cb = p.callback || p.jsonp || null;
    if(p.action === "lookup" && p.name){
      const q = norm_(p.name);
      const all = listGuests_();
      const exact = all.find(g => norm_(g.name) === q);
      if(exact) return out_({ ok:true, match:"exact", guest:exact }, cb);
      const close = all.filter(g => {
        const n = norm_(g.name);
        return q.length >= 3 && (n.indexOf(q) >= 0 || q.indexOf(n) >= 0);
      }).slice(0, 5);
      return out_({ ok:true, match: close.length ? "close" : "none", guests:close }, cb);
    }
    if(p.action === "list"){
      if(!checkAdmin_(p.key)) return out_({ ok:false, error:"bad key" }, cb);
      return out_({ ok:true, guests:listGuests_() }, cb);
    }
    return out_({ ok:false, error:"unknown action. Use action=list|lookup" }, cb);
  } catch(err){
    return out_({ ok:false, error:String(err) }, (e && e.parameter && (e.parameter.callback || e.parameter.jsonp)) || null);
  }
}

function doPost(e){
  const lock = LockService.getScriptLock();
  try{ lock.waitLock(15000); } catch(_){}
  try{
    let body = {};
    try{ body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch(_){}
    const action = body.action || ((e && e.parameter && e.parameter.action) || "");

    if(action === "rsvp"){
      const sh = sheet_();
      const map = colMap_(sh);
      const r = findRow_(sh, map, body.name || "");
      if(r < 0) return out_({ ok:false, error:"name not on list" });
      const pax = Math.max(1, parseInt(sh.getRange(r, map.PAX + 1).getDisplayValue(), 10) || 1);
      const st = norm_(body.status);
      if(st === "declined"){
        sh.getRange(r, map.STATUS + 1).setValue("Declined");
        sh.getRange(r, map.ATTENDING + 1).setValue(0);
        sh.getRange(r, map.COMPANIONS + 1).setValue("");
      } else {
        const count = Math.max(1, Math.min(pax, parseInt(body.attending, 10) || pax));
        const comps = Array.isArray(body.companions) ? body.companions : [];
        sh.getRange(r, map.STATUS + 1).setValue("Confirmed");
        sh.getRange(r, map.ATTENDING + 1).setValue(count);
        sh.getRange(r, map.COMPANIONS + 1).setValue(comps.map(c=>String(c).trim()).filter(Boolean).join("; "));
      }
      sh.getRange(r, map.CONTACT + 1).setValue(String(body.contact || "").trim());
      sh.getRange(r, map.MESSAGE + 1).setValue(String(body.message || "").trim());
      sh.getRange(r, map.UpdatedAt + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      return out_({ ok:true });
    }

    if(action === "upsert" || action === "delete"){
      if(!checkAdmin_(body.key)) return out_({ ok:false, error:"bad key" });
      const sh = sheet_();
      const map = colMap_(sh);
      const r = findRow_(sh, map, (body.guest && body.guest.name) || body.name || "");
      if(action === "delete"){
        if(r > 0) sh.deleteRow(r);
        SpreadsheetApp.flush();
        return out_({ ok:true });
      }
      const g = body.guest || {};
      const row = HEADERS.map(h => {
        switch(h){
          case "NAME": return String(g.name || "").trim();
          case "PAX": return Math.max(1, parseInt(g.pax, 10) || 1);
          case "SIDE": return String(g.side || "Both");
          case "TABLE": return String(g.table || "");
          case "STATUS": return writeStatus_(g.status);
          case "ATTENDING": return parseInt(g.attending, 10) || 0;
          case "COMPANIONS": return (Array.isArray(g.companions) ? g.companions : String(g.companions||"").split(";")).map(c=>String(c).trim()).filter(Boolean).join("; ");
          case "CONTACT": return String(g.contact || "");
          case "MESSAGE": return String(g.message || "");
          case "UpdatedAt": return g.updatedAt || new Date().toISOString();
          default: return "";
        }
      });
      if(r > 0) sh.getRange(r, 1, 1, HEADERS.length).setValues([row]);
      else sh.appendRow(row);
      SpreadsheetApp.flush();
      return out_({ ok:true });
    }

    return out_({ ok:false, error:"unknown action. Use action=rsvp|upsert|delete" });
  } catch(err){
    return out_({ ok:false, error:String(err) });
  } finally {
    try{ lock.releaseLock(); } catch(_){}
  }
}
