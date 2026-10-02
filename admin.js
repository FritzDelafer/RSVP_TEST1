const LS_KEY = "wedding-rsvp-guests-v2";
const ADMIN_PW = "admin123"; // change me
function loadGuests(){
  try{ const r=localStorage.getItem(LS_KEY); if(r) return JSON.parse(r);}catch{}
  const s=structuredClone(window.SEED_GUESTS);
  localStorage.setItem(LS_KEY, JSON.stringify(s)); return s;
}
function save(g){ localStorage.setItem(LS_KEY, JSON.stringify(g)); }

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

function render(){
  const guests=loadGuests();
  const q=(document.getElementById("q").value||"").toLowerCase();
  const f=document.getElementById("f").value;
  const confirmed=guests.filter(g=>g.status==="confirmed");
  const declined=guests.filter(g=>g.status==="declined");
  const pending=guests.filter(g=>g.status==="pending");
  const headcount=confirmed.reduce((a,g)=>a+(g.attending||0),0);
  const totalPax=guests.reduce((a,g)=>a+g.pax,0);
  document.getElementById("stats").innerHTML=`
    <div class="stat"><b>${guests.length}</b><span class="muted">Invite codes</span></div>
    <div class="stat"><b>${totalPax}</b><span class="muted">Total seats</span></div>
    <div class="stat"><b style="color:var(--ok)">${headcount}</b><span class="muted">Confirmed headcount</span></div>
    <div class="stat"><b>${pending.length}</b><span class="muted">Pending</span></div>
    <div class="stat"><b>${declined.length}</b><span class="muted">Declined</span></div>`;

  const rows=document.getElementById("rows");
  rows.innerHTML="";
  guests.filter(g=>{
    if(f && g.status!==f) return false;
    if(q && !(g.name.toLowerCase().includes(q)||g.code.toLowerCase().includes(q)||(g.table||"").toLowerCase().includes(q))) return false;
    return true;
  }).forEach(g=>{
    const tr=document.createElement("tr");
    const pill=g.status==="confirmed"?"ok":g.status==="declined"?"no":"wait";
    tr.innerHTML=`<td><b>${g.code}</b></td><td>${g.name}<br/><span class="muted" style="font-size:12px">${g.side} • ${g.message||""}</span></td>
      <td>${g.pax}</td><td>${g.attending||0}</td>
      <td><span class="pill ${pill}">${g.status}</span></td>
      <td style="font-size:13px">${(g.companions||[]).join(", ")||"—"}</td>
      <td>${g.table||""}</td><td></td>`;
    const td=tr.lastChild;
    td.style.whiteSpace="nowrap";
    const mk=(label,fn)=>{
      const b=document.createElement("button");
      b.className="btn small ghost"; b.textContent=label; b.style.marginRight="6px";
      b.onclick=fn; td.appendChild(b);
    };
    mk("Edit",()=>openModal(g.code));
    mk("Reset",()=>{ const all=loadGuests(); const i=all.findIndex(x=>x.code===g.code);
      all[i]={...all[i],status:"pending",attending:0,companions:[],message:"",updatedAt:null}; save(all); render(); });
    mk("Delete",()=>{ if(!confirm(`Delete ${g.code} — ${g.name}? Guests with this code will no longer be able to RSVP.`)) return;
      save(loadGuests().filter(x=>x.code!==g.code)); render(); });
    rows.appendChild(tr);
  });
}
document.getElementById("exportBtn").onclick=()=>{
  const guests=loadGuests();
  const csv=["code,name,pax,attending,status,companions,table,contact,message,updatedAt",
    ...guests.map(g=>[g.code,`"${g.name}"`,g.pax,g.attending,g.status,`"${(g.companions||[]).join("; ")}"`,g.table,`"${g.contact||""}"`,`"${(g.message||"").replace(/"/g,'""')}"`,g.updatedAt||""].join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="guest-list.csv"; a.click();
};
document.getElementById("resetBtn").onclick=()=>{
  if(!confirm("Reset demo data?")) return;
  localStorage.setItem(LS_KEY, JSON.stringify(structuredClone(window.SEED_GUESTS))); render();
};

// ---- Add / Edit guest ----
let editingCode = null;
const modal = document.getElementById("modal");
function openModal(code){
  editingCode = code || null;
  const all = loadGuests();
  const g = code ? all.find(x=>x.code===code) : null;
  document.getElementById("mTitle").textContent = g ? `Edit ${g.code}` : "Add guest";
  const codeInput = document.getElementById("mCode");
  codeInput.value = g ? g.code : "";
  codeInput.disabled = !!g;
  document.getElementById("mName").value = g ? g.name : "";
  document.getElementById("mPax").value = g ? g.pax : 2;
  document.getElementById("mSide").value = g ? g.side : "Bride";
  document.getElementById("mTable").value = g ? (g.table||"") : "";
  document.getElementById("mMsg").innerHTML = "";
  modal.style.display = "flex";
}
function closeModal(){ modal.style.display = "none"; editingCode = null; }
document.getElementById("addBtn").onclick = ()=>openModal(null);
document.getElementById("mCancel").onclick = closeModal;
modal.addEventListener("click", e=>{ if(e.target===modal) closeModal(); });
document.getElementById("mSave").onclick = ()=>{
  const msg = document.getElementById("mMsg");
  const code = (document.getElementById("mCode").value||"").trim().toUpperCase().replace(/\s+/g,"");
  const name = (document.getElementById("mName").value||"").trim();
  const pax = Math.max(1, Math.min(20, parseInt(document.getElementById("mPax").value,10)||0));
  const side = document.getElementById("mSide").value;
  const table = (document.getElementById("mTable").value||"").trim();
  if(!code || !name){ msg.innerHTML = `<div class="error">Code and name are required.</div>`; return; }
  const all = loadGuests();
  if(editingCode){
    const i = all.findIndex(x=>x.code===editingCode);
    if(i<0) return;
    all[i] = {...all[i], name, pax, side, table,
      attending: Math.min(all[i].attending||0, pax),
      companions: (all[i].companions||[]).slice(0, Math.max(0, pax-1))};
  } else {
    if(all.some(x=>x.code===code)){ msg.innerHTML = `<div class="error">Code <b>${code}</b> already exists — pick another.</div>`; return; }
    all.push({ code, name, pax, side, table, status:"pending", attending:0, companions:[], contact:"", message:"", updatedAt:null });
  }
  save(all); closeModal(); render();
};
