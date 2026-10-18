"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
type Vehicle = { id:string; plate_number:string; make:string|null; model:string|null; status:string; tracker_code:string|null; tracker_initialized_at:string|null; };
type Delivery = { id:string; reference:string; recipient_name:string; destination:string; status:string; scheduled_at:string|null; vehicles?:{plate_number:string}|null; };
export default function Home() {
  const [user,setUser] = useState<string|null>(null);
  const [role,setRole] = useState("user");
  const [vehicles,setVehicles] = useState<Vehicle[]>([]);
  const [deliveries,setDeliveries] = useState<Delivery[]>([]);
  const [message,setMessage] = useState("");
  const [plate,setPlate] = useState("");
  const [make,setMake] = useState("");
  const [model,setModel] = useState("");
  const [trackerCode,setTrackerCode] = useState("");
  const [trackerPhone,setTrackerPhone] = useState("");
  const [trackerPin,setTrackerPin] = useState("");
  const [recipient,setRecipient] = useState("");
  const [destination,setDestination] = useState("");
  const [reference,setReference] = useState("");
  const [busy,setBusy] = useState(false);
  const supabase = createClient();
  async function load() {
    const {data:{user}} = await supabase.auth.getUser();
    setUser(user?.email ?? null);
    if (!user) return;
    const {data:profile} = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    setRole(profile?.role ?? "user");
    const {data:v,error:ve} = await supabase.from("vehicles").select("id,plate_number,make,model,status,tracker_code,tracker_initialized_at").order("created_at",{ascending:false}).limit(50);
    if (ve) setMessage(ve.message); else setVehicles((v??[]) as Vehicle[]);
    const {data:d,error:de} = await supabase.from("deliveries").select("id,reference,recipient_name,destination,status,scheduled_at,vehicles(plate_number)").order("created_at",{ascending:false}).limit(50);
    if (de) setMessage(de.message); else setDeliveries((d??[]) as unknown as Delivery[]);
  }
  useEffect(()=>{ load(); const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>load()); return ()=>subscription.unsubscribe(); },[]);
  async function addVehicle(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const {error}=await supabase.from("vehicles").insert({plate_number:plate.trim().toUpperCase(),make:make||null,model:model||null,tracker_code:trackerCode.trim()||null,tracker_phone:trackerPhone.trim()||null});
    setBusy(false); if(error) setMessage(error.message); else {setMessage("Vehicle saved. If a tracker code and phone are set, securely configure the SMS initialization workflow before field use."); setPlate("");setMake("");setModel("");setTrackerCode("");setTrackerPhone("");load();}
  }
  async function addDelivery(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const {error}=await supabase.from("deliveries").insert({reference:reference.trim(),recipient_name:recipient.trim(),destination:destination.trim(),status:"pending"});
    setBusy(false); if(error) setMessage(error.message); else {setMessage("Delivery created.");setReference("");setRecipient("");setDestination("");load();}
  }
  async function updateStatus(id:string,status:string) {
    const {error}=await supabase.from("deliveries").update({status}).eq("id",id);
    setMessage(error?error.message:"Delivery status updated."); load();
  }
  async function signOut(){await supabase.auth.signOut();setUser(null);setVehicles([]);setDeliveries([]);}
  return <main>
    <section className="hero"><div><div className="eyebrow">Fleet operations platform</div><h1>Every delivery.<br/>One clear view.</h1><p>Manage vehicles, drivers and deliveries with an operational dashboard built for growing delivery businesses.</p><div className="actions" style={{marginTop:22}}>{user?<button className="btn secondary" onClick={signOut}>Sign out · {user}</button>:<a className="btn" href="/login">Sign in to manage</a>}</div></div><div className="hero-bubble"><strong>{vehicles.length}</strong><span>Vehicles in your accessible fleet</span><hr style={{borderColor:"#ffffff30"}}/><strong>{deliveries.length}</strong><span>Recent deliveries</span></div></section>
    {message && <p className="notice" role="status">{message}</p>}
    {!user ? <section className="card" style={{marginTop:20}}><h2>Start with secure access</h2><p className="muted">Sign in to add vehicles and manage delivery records. Configure Supabase and database migrations first.</p><a className="btn" href="/login">Open sign in</a></section> : <>
    <div className="grid"><div className="card stat">Vehicles<strong>{vehicles.length}</strong><span className="muted small">Registered fleet</span></div><div className="card stat">Active deliveries<strong>{deliveries.filter(d=>d.status==="in_transit").length}</strong><span className="muted small">Currently in transit</span></div><div className="card stat">Delivered<strong>{deliveries.filter(d=>d.status==="delivered").length}</strong><span className="muted small">Recent records</span></div></div>
    <div className="layout-two"><section className="card"><div className="section-head"><div><h2>Register a vehicle</h2><p className="muted small">Tracker fields are optional until SMS setup is complete.</p></div></div>
      <form className="form" onSubmit={addVehicle}><div className="field"><label>Registration / plate number *</label><input required value={plate} onChange={e=>setPlate(e.target.value)} placeholder="KDA 123A"/></div><div className="grid" style={{margin:0}}><div className="field"><label>Make</label><input value={make} onChange={e=>setMake(e.target.value)} placeholder="Toyota"/></div><div className="field"><label>Model</label><input value={model} onChange={e=>setModel(e.target.value)} placeholder="Hiace"/></div></div><div className="field"><label>Tracker code (optional)</label><input value={trackerCode} onChange={e=>setTrackerCode(e.target.value)} placeholder="TRK-001"/></div><div className="field"><label>Tracker SIM phone (E.164 recommended)</label><input value={trackerPhone} onChange={e=>setTrackerPhone(e.target.value)} placeholder="+2547…"/></div><p className="muted small">Set the one-time initialization-code hash using the trusted admin procedure in docs/AFRICAS_TALKING_SMS.md. Do not save a plaintext code in the app.</p><button className="btn" disabled={busy}>Save vehicle</button></form>
    </section><section className="card"><h2>Create a delivery</h2><form className="form" onSubmit={addDelivery}><div className="field"><label>Delivery reference *</label><input required value={reference} onChange={e=>setReference(e.target.value)} placeholder="DEL-2026-001"/></div><div className="field"><label>Recipient name *</label><input required value={recipient} onChange={e=>setRecipient(e.target.value)}/></div><div className="field"><label>Destination *</label><input required value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Town, area or address"/></div><button className="btn" disabled={busy}>Create delivery</button></form><div className="notice" style={{marginTop:18}}>SMS tracker initialization is handled by a server-side webhook. See the README and SMS route configuration before sending real commands.</div></section></div>
    <section className="card" style={{marginTop:18}}><div className="section-head"><div><h2>Fleet register</h2><p className="muted small">Records allowed by your database role.</p></div><button className="btn secondary" onClick={load}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>Vehicle</th><th>Make / model</th><th>Tracker</th><th>Status</th></tr></thead><tbody>{vehicles.map(v=><tr key={v.id}><td><strong>{v.plate_number}</strong></td><td>{[v.make,v.model].filter(Boolean).join(" ")||"—"}</td><td>{v.tracker_code||"Not configured"}<div className="muted small">{v.tracker_initialized_at?"Initialized":"Awaiting initialization"}</div></td><td><span className="pill">{v.status}</span></td></tr>)}{!vehicles.length&&<tr><td colSpan={4} className="empty">No vehicles yet.</td></tr>}</tbody></table></div></section>
    <section className="card" style={{marginTop:18}}><div className="section-head"><div><h2>Recent deliveries</h2><p className="muted small">Update status as dispatch and delivery milestones are confirmed.</p></div></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Recipient</th><th>Destination</th><th>Status</th><th>Update</th></tr></thead><tbody>{deliveries.map(d=><tr key={d.id}><td><strong>{d.reference}</strong></td><td>{d.recipient_name}</td><td>{d.destination}</td><td><span className={"pill "+(d.status==="delivered"?"green":d.status==="in_transit"?"orange":"")}>{d.status}</span></td><td><select value={d.status} onChange={e=>updateStatus(d.id,e.target.value)}><option value="pending">Pending</option><option value="assigned">Assigned</option><option value="in_transit">In transit</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select></td></tr>)}{!deliveries.length&&<tr><td colSpan={5} className="empty">No deliveries yet.</td></tr>}</tbody></table></div></section></>}
    <section className="card" style={{marginTop:18}}><h2>Tracker initialization via SMS</h2><p className="muted">Africa's Talking incoming SMS webhook route: <code>/api/at/sms</code>. After configuring the provider and server environment variables, send the command <code>INIT TRACKER_CODE PLATE ONE_TIME_CODE</code> from the registered tracker SIM phone. The code is one-use; the handler marks the tracker initialized and replies by SMS where provider credentials permit. Test with the AT sandbox first.</p></section>
  </main>;
}
