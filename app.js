const LS_KEY = "wedding-rsvp-guests-v2";
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

function lookup(){
  guests = loadGuests();
  const q = normName(document.getElementById("guestName").value);
  const msg = document.getElementById("nameMsg");
  const box = document.getElementById("suggest");
  box.style.display = "none"; box.innerHTML = "";
  if(!q){ msg.innerHTML = `<div class="error">Please type your name.</div>`; return; }

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
  msg.innerHTML = `<div class="error">Sorry, we can't find "<b>${document.getElementById("guestName").value.trim()}</b>" on the guest list. Check the spelling, or message Jess & Ara so they can add you.</div>`;
}

// ---- lock / unlock the whole site ----
function unlock(g){
  current = guests.find(x=>x.code===g.code) || g;
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
  for(let i=1;i<=current.pax;i++){ const o=document.createElement("option"); o.value=i; o.textContent=`${i} seat${i>1?"s":""}`; sel.appendChild(o); }
  sel.value = Math.min(current.attending||current.pax, current.pax);
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
document.getElementById("submitBtn").addEventListener("click", ()=>{
  const fmsg = document.getElementById("formMsg");
  const attend = document.querySelector('input[name="attend"]:checked').value;
  guests = loadGuests();
  const idx = guests.findIndex(x=>x.code===current.code);
  if(idx<0) return;
  if(attend==="no"){
    guests[idx] = {...guests[idx], status:"declined", attending:0, companions:[],
      contact:document.getElementById("contact").value.trim(),
      message:document.getElementById("message").value.trim(),
      updatedAt:new Date().toISOString()};
  } else {
    const count = parseInt(document.getElementById("count").value,10);
    const compInputs = [...document.querySelectorAll("[data-comp]")];
    const comps = compInputs.map(i=>i.value.trim()).filter(Boolean);
    if(comps.length !== count-1){
      fmsg.innerHTML = `<div class="error">Please name all ${count-1} companion(s) for your ${count} seats.</div>`;
      return;
    }
    guests[idx] = {...guests[idx], status:"confirmed", attending:count, companions:comps,
      contact:document.getElementById("contact").value.trim(),
      message:document.getElementById("message").value.trim(),
      updatedAt:new Date().toISOString()};
  }
  saveGuests(guests);
  current = guests[idx];
  document.getElementById("step-form").style.display="none";
  document.getElementById("step-done").style.display="block";
  document.getElementById("doneBox").innerHTML =
    current.status==="confirmed"
    ? `<b>Salamat, ${current.name}!</b><br/>You confirmed <b>${current.attending} / ${current.pax}</b> seat(s) for Jess & Ara's wedding (12.19.2026, East Bay Residences).<br/><span class="muted">Screenshot this and show it at the entrance.</span>`
    : `<b>Thank you, ${current.name}.</b><br/>You declined — your seats will be released. We'll miss you!`;
  fmsg.innerHTML="";
  document.getElementById("rsvp").scrollIntoView({behavior:"smooth"});
});
document.getElementById("againBtn").addEventListener("click", lock);
