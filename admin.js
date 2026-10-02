const LS_KEY = "wedding-rsvp-guests-v1";
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
    const btn=document.createElement("button");
    btn.className="btn small ghost"; btn.textContent="Reset to pending";
    btn.onclick=()=>{ const all=loadGuests(); const i=all.findIndex(x=>x.code===g.code);
      all[i]={...all[i],status:"pending",attending:0,companions:[],message:"",updatedAt:null}; save(all); render(); };
    td.appendChild(btn);
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
