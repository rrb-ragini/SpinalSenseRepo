"use client";
import AvatarMenu from "./AvatarMenu";

export default function NavBar() {
  return (
    <header className="w-full bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SpinalSense" className="h-10 w-auto" />
          <div>
            <div className="text-xl font-semibold text-slate-900">SpinalSense</div>
            <div className="text-sm text-slate-500">AI Cobb-angle & Spine Assistant</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex gap-4 text-slate-600">
            <a href="/app/home" className="px-3 py-1 rounded-md hover:bg-slate-50">Home</a>
            <a href="/auth/login" className="px-3 py-1 rounded-md hover:bg-slate-50">Login</a>
            <a href="/auth/logout" className="px-3 py-1 rounded-md hover:bg-slate-50">Logout</a>
          </nav>

          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
