"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        setMessage("Account request submitted. If email confirmation is enabled, check your inbox before signing in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Authentication failed."); }
    finally { setBusy(false); }
  }
  return <main><div className="auth-wrap card"><span className="eyebrow" style={{color:"var(--brand)"}}>Secure access</span><h1 style={{fontSize:32,color:"var(--ink)"}}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1><p className="muted">Use your business email. Access to records is controlled by database permissions.</p>
  <form className="form" onSubmit={submit}>
    {mode === "signup" && <div className="field"><label>Full name</label><input required value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" /></div>}
    <div className="field"><label>Email</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></div>
    <div className="field"><label>Password (at least 8 characters)</label><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"} /></div>
    <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode==="signin" ? "Sign in" : "Create account"}</button>
  </form>
  {message && <p className="notice" role="status">{message}</p>}
  <p className="muted small">{mode==="signin" ? "New here?" : "Already registered?"} <button className="btn secondary" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("");}}>{mode==="signin"?"Create account":"Sign in instead"}</button></p>
  <p className="muted small">Production: configure Supabase email confirmation, SMTP, password policies, and account recovery before onboarding customers.</p></div></main>;
}
