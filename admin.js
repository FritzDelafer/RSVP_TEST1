const LS_KEY = "wedding-rsvp-guests-v3";
const ADMIN_PW = "admin123"; // change me
function loadGuests(){
  try{ const r=localStorage.getItem(LS_KEY); if(r) return JSON.parse(r);}catch{}
  const s=structuredClone(window.SEED_GUESTS);
  localStorage.setItem(LS_KEY, JSON.stringify(s)); return s;
}
function save(g){ localStorage.setItem(LS_KEY, JSON.stringify(g)); }
function normName(s){ return (s||"").toLowerCase().trim().replace(/\s+/g," "); }
function findByName(list, name){ const n=normName(name); return list.findIndex(x=>normName(x.name)===n); }

let authed = sessionStorage.getItem("rsvp-admin")==="1";
if(authed) showDash();

document.getElementById("loginBtn").onclick = ()=>{
  const v=document.getElementById("pw").value;
  if(v===ADMIN_PW){ sessionStorage.setItem("rsvp-admin","1"); showDash(); }
  else document.getElementById("loginMsg").innerHTML=`<div class="error">Wrong password.</div>`;
};

function showDash(){
  document.getElementById("loginCard").style.display="none";
  document.getElementById("dash").style.display="block";
  render();
}
document.getElementById("q").oninput=render;
document.getElementById("f").onchange=render;

function statusPill(s){
  const n=(s||"").toLowerCase();
  if(n==="confirmed"||n==="attending") return "ok";
  if(n==="declined") return "no";
  return "wait";
}
function render(){
  const guests=loadGuests();
  const q=normName(document.getElementById("q").value||"");
  const f=document.getElementById("f").value;
  const confirmed=guests.filter(g=>["confirmed","attending"].includes(normName(g.status)));
  const declined=guests.filter(g=>normName(g.status)==="declined");
  const pending=guests.filter(g=>!["confirmed","attending","declined"].includes(normName(g.status)));
  const headcount=confirmed.reduce((a,g)=>a+(g.attending||0),0);
  const totalPax=guests.reduce((a,g)=>a+(g.pax||0),0);
  document.getElementById("stats").innerHTML=`
    <div class="stat"><b>${guests.length}</b><span class="muted">Guests</span></div>
    <div class="stat"><b>${totalPax}</b><span class="muted">Total seats</span></div>
    <div class="stat"><b style="color:var(--ok)">${headcount}</b><span class="muted">Confirmed headcount</span></div>
    <div class="stat"><b>${pending.length}</b><span class="muted">Pending</span></div>
    <div class="stat"><b>${declined.length}</b><span class="muted">Declined</span></div>`;

  const rows=document.getElementById("rows");
  rows.innerHTML="";
  guests.filter(g=>{
    if(f==="confirmed" && !["confirmed","attending"].includes(normName(g.status))) return false;
    if(f==="declined" && normName(g.status)!=="declined") return false;
    if(f==="pending" && ["confirmed","attending","declined"].includes(normName(g.status))) return false;
    if(q && !(normName(g.name).includes(q)||normName(g.table||"").includes(q))) return false;
    return true;
  }).forEach(g=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><b>${g.name}</b><br/><span class="muted" style="font-size:12px">${g.side} • ${g.contact||""}${g.message?" • “"+g.message+"”":""}</span></td>
      <td>${g.pax}</td><td>${g.attending||0}</td>
      <td><span class="pill ${statusPill(g.status)}">${g.status}</span></td>
      <td style="font-size:13px">${(g.companions||[]).join(", ")||"—"}</td>
      <td>${g.table||""}</td><td></td>`;
    const td=tr.lastChild;
    td.style.whiteSpace="nowrap";
    const mk=(label,fn)=>{
      const b=document.createElement("button");
      b.className="btn small ghost"; b.textContent=label; b.style.marginRight="6px";
      b.onclick=fn; td.appendChild(b);
    };
    mk("Edit",()=>openModal(g.name));
    mk("Reset",()=>{ const all=loadGuests(); const i=findByName(all,g.name);
      if(i<0) return;
      all[i]={...all[i],status:"pending",attending:0,companions:[],message:"",updatedAt:null}; save(all); render(); });
    mk("Delete",()=>{ if(!confirm(`Delete ${g.name}? They will no longer find their invitation.`)) return;
      save(loadGuests().filter(x=>normName(x.name)!==normName(g.name))); render(); });
  });
}
document.getElementById("exportBtn").onclick=()=>{
  const guests=loadGuests();
  const csv=["NAME,PAX,SIDE,TABLE,STATUS,ATTENDING,COMPANIONS,CONTACT,MESSAGE,UpdatedAt",
    ...guests.map(g=>[`"${(g.name||"").replace(/"/g,'""')}"`,g.pax,g.side,`"${(g.table||"").replace(/"/g,'""')}"`,g.status,g.attending||0,`"${(g.companions||[]).join("; ").replace(/"/g,'""')}"`,`"${(g.contact||"").replace(/"/g,'""')}"`,`"${(g.message||"").replace(/"/g,'""')}"`,g.updatedAt||""].join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="guest-list.csv"; a.click();
};
document.getElementById("resetBtn").onclick=()=>{
  if(!confirm("Reset demo data?")) return;
  localStorage.setItem(LS_KEY, JSON.stringify(structuredClone(window.SEED_GUESTS))); render();
};

// ---- Add / Edit guest (name is the key) ----
let editingName = null;
const modal = document.getElementById("modal");
function openModal(name){
  editingName = name || null;
  const all = loadGuests();
  const i = name ? findByName(all, name) : -1;
  const g = i>=0 ? all[i] : null;
  document.getElementById("mTitle").textContent = g ? `Edit ${g.name}` : "Add guest";
  const nameInput = document.getElementById("mName");
  nameInput.value = g ? g.name : "";
  document.getElementById("mPax").value = g ? g.pax : 2;
  document.getElementById("mSide").value = g ? g.side : "Bride";
  document.getElementById("mTable").value = g ? (g.table||"") : "";
  document.getElementById("mMsg").innerHTML = "";
  modal.style.display = "flex";
}
function closeModal(){ modal.style.display = "none"; editingName = null; }
document.getElementById("addBtn").onclick = ()=>openModal(null);
document.getElementById("mCancel").onclick = closeModal;
modal.addEventListener("click", e=>{ if(e.target===modal) closeModal(); });
document.getElementById("mSave").onclick = ()=>{
  const msg = document.getElementById("mMsg");
  const name = (document.getElementById("mName").value||"").trim().replace(/\s+/g," ");
  const pax = Math.max(1, Math.min(20, parseInt(document.getElementById("mPax").value,10)||0));
  const side = document.getElementById("mSide").value;
  const table = (document.getElementById("mTable").value||"").trim();
  if(!name){ msg.innerHTML = `<div class="error">Name is required.</div>`; return; }
  const all = loadGuests();
  if(editingName){
    const i = findByName(all, editingName);
    if(i<0) return;
    if(normName(name)!==normName(editingName) && findByName(all,name)>=0){
      msg.innerHTML = `<div class="error">"<b>${name}</b>" is already on the list.</div>`; return;
    }
    all[i] = {...all[i], name, pax, side, table,
      attending: Math.min(all[i].attending||0, pax),
      companions: (all[i].companions||[]).slice(0, Math.max(0, pax-1))};
  } else {
    if(findByName(all,name)>=0){ msg.innerHTML = `<div class="error">"<b>${name}</b>" is already on the list.</div>`; return; }
    all.push({ name, pax, side, table, status:"pending", attending:0, companions:[], contact:"", message:"", updatedAt:null });
  }
  save(all); closeModal(); render();
};
