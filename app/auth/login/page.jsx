"use client";
import { useState } from "react";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [user, setUser] = useState({ email: "", password: "" });

  return (
    <div className="max-w-md mx-auto card p-8 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Welcome to SpinalSense</h2>
        <div className="text-sm text-slate-500">Enterprise portal</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("login")} className={`px-3 py-2 rounded ${tab==="login"?"bg-primary-500 text-white":"bg-slate-100"}`}>Login</button>
        <button onClick={() => setTab("signup")} className={`px-3 py-2 rounded ${tab==="signup"?"bg-primary-500 text-white":"bg-slate-100"}`}>Create account</button>
      </div>

      <div>
        <label className="block text-sm">Email</label>
        <input value={user.email} onChange={(e)=>setUser({...user,email:e.target.value})} className="w-full p-3 rounded border mb-3" />
        <label className="block text-sm">Password</label>
        <input type="password" value={user.password} onChange={(e)=>setUser({...user,password:e.target.value})} className="w-full p-3 rounded border mb-3" />
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-primary-500 text-white rounded">Continue</button>
          <button className="px-4 py-2 bg-slate-100 rounded">Cancel</button>
        </div>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        <strong>Spinal tips:</strong> Keep a healthy desk posture, break prolonged sitting every 40 minutes.
      </div>
    </div>
  );
}
