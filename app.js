const LS_KEY = "wedding-rsvp-guests-v4";
const WEDDING_DATE = new Date("2026-12-19T16:00:00+08:00").getTime();

function loadGuests() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = structuredClone(window.SEED_GUESTS);
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}
function saveGuests(g) { localStorage.setItem(LS_KEY, JSON.stringify(g)); }
// case-insensitive name match: ignore case, extra spaces
function normName(s){ return (s||"").toLowerCase().trim().replace(/\s+/g," "); }
function findByName(list, name){ const n = normName(name); return list.findIndex(x=>normName(x.name)===n); }

let guests = loadGuests();
let current = null;

// countdown (inside locked site — ticks when visible)
function tick(){
  const d = WEDDING_DATE - Date.now();
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  if (d < 0) { set("cd-d","0"); set("cd-h","0"); set("cd-m","0"); set("cd-s","0"); return; }
  const days = Math.floor(d/86400000), h = Math.floor(d%86400000/3600000),
        m = Math.floor(d%3600000/60000), s = Math.floor(d%60000/1000);
  set("cd-d",days); set("cd-h",String(h).padStart(2,"0"));
  set("cd-m",String(m).padStart(2,"0")); set("cd-s",String(s).padStart(2,"0"));
}
setInterval(tick, 1000); tick();

document.getElementById("lookupBtn").addEventListener("click", lookup);
document.getElementById("guestName").addEventListener("keydown", e=>{ if(e.key==="Enter") lookup(); });

async function lookup(){
  const raw = document.getElementById("guestName").value;
  const q = normName(raw);
  const msg = document.getElementById("nameMsg");
  const box = document.getElementById("suggest");
  box.style.display = "none"; box.innerHTML = "";
  if(!q){ msg.innerHTML = `<div class="error">Please type your name.</div>`; return; }

  // Live mode: query Google Sheet via GAS (source of truth when deployed)
  if(window.usingGas && window.usingGas()){
    msg.innerHTML = `<div class="notice">Finding your invitation…</div>`;
    try{
      const res = await window.gasGet({ action: "lookup", name: raw.trim() });
      if(res && res.ok && res.match === "exact" && res.guest){ msg.innerHTML=""; unlock(res.guest); return; }
      if(res && res.ok && res.match === "close" && res.guests && res.guests.length){
        if(res.guests.length === 1){ msg.innerHTML=""; unlock(res.guests[0]); return; }
        msg.innerHTML = `<div class="notice">We found similar names — tap yours:</div>`;
        res.guests.forEach(g=>{
          const b=document.createElement("button");
          b.className="suggest-btn"; b.textContent=g.name;
          b.onclick=()=>unlock(g);
          box.appendChild(b);
        });
        box.style.display="block";
        return;
      }
      msg.innerHTML = `<div class="error">Sorry, we can't find "<b>${raw.trim()}</b>" on the guest list. Check the spelling, or message Jess & Ara so they can add you.</div>`;
      return;
    }catch(err){
      console.warn("GAS lookup failed, falling back to local:", err);
      // fall through to local cache below
    }
  }

  guests = loadGuests();

  // 1) exact match (case-insensitive)
  const exact = guests.find(x=>normName(x.name)===q);
  if(exact){ msg.innerHTML=""; unlock(exact); return; }

  // 2) close matches — name contains what they typed, or vice versa
  const close = guests.filter(x=>{
    const n = normName(x.name);
    return q.length>=3 && (n.includes(q) || q.includes(n));
  }).slice(0,5);

  if(close.length===1){ msg.innerHTML=""; unlock(close[0]); return; }
  if(close.length>1){
    msg.innerHTML = `<div class="notice">We found similar names — tap yours:</div>`;
    close.forEach(g=>{
      const b=document.createElement("button");
      b.className="suggest-btn"; b.textContent=g.name;
      b.onclick=()=>unlock(g);
      box.appendChild(b);
    });
    box.style.display="block";
    return;
  }
  msg.innerHTML = `<div class="error">Sorry, we can't find "<b>${raw.trim()}</b>" on the guest list. Check the spelling, or message Jess & Ara so they can add you.</div>`;
}

// ---- lock / unlock the whole site ----
function seatsUsed(g){
  if(window.seatsUsed) return window.seatsUsed(g);
  if(!g) return 0;
  const s=(g.status||"").toLowerCase();
  if(s==="declined") return 0;
  if(s==="attending"||s==="confirmed") return 1+((g.companions||[]).length);
  return 0;
}
function unlock(g){
  const i = findByName(guests, g.name);
  current = i>=0 ? guests[i] : g;
  document.getElementById("gateWrap").style.display="none";
  document.getElementById("siteWrap").style.display="block";
  document.getElementById("sitelinks").style.display="inline";
  document.getElementById("step-done").style.display="none";
  document.getElementById("step-form").style.display="block";
  document.getElementById("formMsg").innerHTML="";
  document.getElementById("guestInfo").innerHTML =
    `Hello, <b>${current.name}</b>! Reserved seats: <b>${current.pax}</b> • Table: ${current.table}` +
    (current.status!=="pending" ? ` • Current: <b>${current.status}</b>` : ``);
  document.getElementById("maxPax").textContent = current.pax;
  const sel = document.getElementById("count");
  sel.innerHTML = "";
  for(let i2=1;i2<=current.pax;i2++){ const o=document.createElement("option"); o.value=i2; o.textContent=`${i2} seat${i2>1?"s":""}`; sel.appendChild(o); }
  const used = seatsUsed(current);
  sel.value = Math.min(used > 0 ? used : current.pax, current.pax);
  renderCompanions();
  sel.onchange = renderCompanions;
  document.querySelectorAll('input[name="attend"]').forEach(r=>{
    r.onchange = ()=>{ document.getElementById("attendFields").style.display =
      document.querySelector('input[name="attend"]:checked').value==="yes" ? "block":"none"; };
  });
  document.querySelector('input[name="attend"][value="yes"]').checked = true;
  document.getElementById("attendFields").style.display = "block";
  document.getElementById("contact").value = current.contact||"";
  document.getElementById("message").value = current.message||"";
  window.scrollTo({top:0, behavior:"smooth"});
  tick();
}
function lock(){
  current = null;
  document.getElementById("siteWrap").style.display="none";
  document.getElementById("sitelinks").style.display="none";
  document.getElementById("gateWrap").style.display="block";
  document.getElementById("guestName").value="";
  document.getElementById("nameMsg").innerHTML="";
  const box=document.getElementById("suggest"); box.style.display="none"; box.innerHTML="";
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderCompanions(){
  const n = parseInt(document.getElementById("count").value||"1",10);
  const box = document.getElementById("companions");
  box.innerHTML = "";
  if(n<=1){ box.innerHTML = `<p class="muted" style="font-size:13px">Solo seat — no companions needed.</p>`; return; }
  box.innerHTML = `<label>Companion names (${n-1} needed)</label>`;
  for(let i=0;i<n-1;i++){
    const inp = document.createElement("input");
    inp.placeholder = `Companion ${i+1} full name`;
    inp.dataset.comp = i;
    inp.style.marginBottom = "8px";
    if(current.companions && current.companions[i]) inp.value = current.companions[i];
    box.appendChild(inp);
  }
}

document.getElementById("backBtn").addEventListener("click", lock);
function showDone(){
  document.getElementById("step-form").style.display="none";
  document.getElementById("step-done").style.display="block";
  const st = (current.status||"").toLowerCase();
  const isAtt = (st==="attending"||st==="confirmed");
  const used = seatsUsed(current);
  document.getElementById("doneBox").innerHTML =
    isAtt
    ? `<b>Salamat, ${current.name}!</b><br/>You confirmed <b>${used} / ${current.pax}</b> seat(s) for Jess & Ara's wedding (12.19.2026, East Bay Residences).<br/><span class="muted">Screenshot this and show it at the entrance.</span>`
    : `<b>Thank you, ${current.name}.</b><br/>You declined — your seats will be released. We'll miss you!`;
  document.getElementById("formMsg").innerHTML="";
  document.getElementById("rsvp").scrollIntoView({behavior:"smooth"});
}
document.getElementById("submitBtn").addEventListener("click", async ()=>{
  const fmsg = document.getElementById("formMsg");
  const attend = document.querySelector('input[name="attend"]:checked').value;
  const contact = document.getElementById("contact").value.trim();
  const message = document.getElementById("message").value.trim();
  let count = parseInt(document.getElementById("count").value,10) || 1;
  let comps = [];
  if(attend==="no"){
    count = 0;
  } else {
    const compInputs = [...document.querySelectorAll("[data-comp]")];
    comps = compInputs.map(i=>i.value.trim()).filter(Boolean);
    if(comps.length !== count-1){
      fmsg.innerHTML = `<div class="error">Please name all ${count-1} companion(s) for your ${count} seats.</div>`;
      return;
    }
  }

  // Live mode: write to Google Sheet (8 cols: NAME|PAX|SIDE|TABLE|STATUS|COMPANIONS|CONTACT|MESSAGE)
  if(window.usingGas && window.usingGas()){
    const btn = document.getElementById("submitBtn");
    btn.disabled = true; btn.textContent = "Sending…";
    try{
      const res = await window.gasPost({
        action: "rsvp",
        name: current.name,
        status: attend === "no" ? "declined" : "attending",
        companions: comps,
        contact, message
      });
      if(!res || !res.ok) throw new Error((res && res.error) || "RSVP failed");
      current = {...current,
        status: attend === "no" ? "declined" : "attending",
        companions: attend === "no" ? [] : comps,
        contact, message};
      showDone();
    }catch(err){
      console.warn("GAS rsvp failed:", err);
      fmsg.innerHTML = `<div class="error">Couldn't send RSVP (${String(err.message||err)}). Check connection and try again.</div>`;
    }finally{
      btn.disabled = false; btn.textContent = "Submit RSVP";
    }
    return;
  }

  guests = loadGuests();
  const idx = findByName(guests, current.name);
  if(idx<0) return;
  if(attend==="no"){
    guests[idx] = {...guests[idx], status:"declined", companions:[],
      contact,
      message};
  } else {
    guests[idx] = {...guests[idx], status:"attending", companions:comps,
      contact,
      message};
  }
  saveGuests(guests);
  current = guests[idx];
  showDone();
});
document.getElementById("againBtn").addEventListener("click", lock);
