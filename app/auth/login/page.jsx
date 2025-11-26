"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [user, setUser] = useState({ email: "", password: "" });
  const router = useRouter();

  const submit = () => {
    // TEMP: automatically log user in
    router.push("/app/home");
  };

  return (
    <div className="max-w-md mx-auto card bg-white p-8 mt-16 shadow-md rounded-xl">
      <h2 className="text-2xl font-semibold text-center">
        Welcome to SpinalSense
      </h2>
      <p className="text-center text-slate-500 mb-6">Enterprise portal</p>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 justify-center">
        <button 
          onClick={() => setTab("login")}
          className={`px-4 py-2 rounded-md font-medium 
            ${tab==="login" ? "bg-primary text-white" : "bg-slate-200 text-slate-700"}`}
        >
          Login
        </button>
        <button 
          onClick={() => setTab("signup")}
          className={`px-4 py-2 rounded-md font-medium 
            ${tab==="signup" ? "bg-primary text-white" : "bg-slate-200 text-slate-700"}`}
        >
          Create account
        </button>
      </div>

      {/* FORM */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input 
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          className="w-full p-3 border rounded-lg mt-1 mb-4"
        />

        <label className="block text-sm font-medium text-slate-700">Password</label>
        <input 
          type="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          className="w-full p-3 border rounded-lg mt-1 mb-6"
        />

        <div className="flex gap-3 justify-center mt-4">
          <button 
            onClick={submit}
            className="px-6 py-2 bg-primary text-white rounded-lg shadow hover:bg-blue-600"
          >
            Continue
          </button>

          <button 
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg"
            onClick={() => router.push("/")}
          >
            Cancel
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-600 text-center">
        <strong>Spinal tip:</strong> Keep a healthy desk posture, break prolonged sitting every 40 minutes.
      </p>
    </div>
  );
}
