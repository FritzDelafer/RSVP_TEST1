const LS_KEY = "wedding-rsvp-guests-v1";
const WEDDING_DATE = new Date("2026-12-12T15:30:00+08:00").getTime();

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
function normCode(s){ return (s||"").trim().toUpperCase().replace(/\s+/g,""); }

let guests = loadGuests();
let current = null;

// countdown
function tick(){
  const d = WEDDING_DATE - Date.now();
  if (d < 0) return;
  const days = Math.floor(d/86400000), h = Math.floor(d%86400000/3600000),
        m = Math.floor(d%3600000/60000), s = Math.floor(d%60000/1000);
  document.getElementById("cd-d").textContent = days;
  document.getElementById("cd-h").textContent = h;
  document.getElementById("cd-m").textContent = m;
  document.getElementById("cd-s").textContent = s;
}
setInterval(tick, 1000); tick();

document.querySelectorAll("[data-code]").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.getElementById("code").value = b.dataset.code;
    lookup();
  });
});
document.getElementById("lookupBtn").addEventListener("click", lookup);
document.getElementById("code").addEventListener("keydown", e=>{ if(e.key==="Enter") lookup(); });

function lookup(){
  guests = loadGuests();
  const code = normCode(document.getElementById("code").value);
  const msg = document.getElementById("codeMsg");
  if(!code){ msg.innerHTML = `<div class="error">Please enter your invite code.</div>`; return; }
  const g = guests.find(x=>x.code===code);
  if(!g){
    msg.innerHTML = `<div class="error">Code <b>${code}</b> not found. Only invited guests can RSVP — please check your invitation. (Demo: try MA-ART-001)</div>`;
    return;
  }
  current = g;
  msg.innerHTML = "";
  document.getElementById("step-code").style.display="none";
  document.getElementById("step-form").style.display="block";
  document.getElementById("guestInfo").innerHTML =
    `Hello, <b>${g.name}</b>! Code <b>${g.code}</b> • Reserved seats: <b>${g.pax}</b> • Side: ${g.side} • Table: ${g.table}` +
    (g.status!=="pending" ? ` • Current: <b>${g.status}</b>` : ``);
  document.getElementById("maxPax").textContent = g.pax;
  const sel = document.getElementById("count");
  sel.innerHTML = "";
  for(let i=1;i<=g.pax;i++){ const o=document.createElement("option"); o.value=i; o.textContent=`${i} seat${i>1?"s":""}`; sel.appendChild(o); }
  sel.value = Math.min(g.attending||g.pax, g.pax);
  renderCompanions();
  sel.onchange = renderCompanions;
  document.querySelectorAll('input[name="attend"]').forEach(r=>{
    r.onchange = ()=>{ document.getElementById("attendFields").style.display =
      document.querySelector('input[name="attend"]:checked').value==="yes" ? "block":"none"; };
  });
  document.getElementById("contact").value = g.contact||"";
  document.getElementById("message").value = g.message||"";
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

document.getElementById("backBtn").addEventListener("click", ()=>{
  current=null;
  document.getElementById("step-form").style.display="none";
  document.getElementById("step-code").style.display="block";
});
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
    ? `<b>Salamat, ${current.name}!</b><br/>You confirmed <b>${current.attending} / ${current.pax}</b> seat(s). Table ${current.table}.<br/><span class="muted">Screenshot this + present your code <b>${current.code}</b> at entrance.</span>`
    : `<b>Thank you, ${current.name}.</b><br/>You declined — your seats will be released. We'll miss you!`;
  fmsg.innerHTML="";
});
document.getElementById("againBtn").addEventListener("click", ()=>{
  document.getElementById("step-done").style.display="none";
  document.getElementById("step-code").style.display="block";
  document.getElementById("code").value="";
});
