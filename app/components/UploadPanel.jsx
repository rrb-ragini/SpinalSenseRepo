"use client";
import UploadZone from "./UploadZone";
import { useState } from "react";

export default function UploadPanel({ onFiles = () => {}, files = [], onAnalysis = () => {} }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!files.length) return alert("Upload at least one image");
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("xray", f));
      const res = await fetch("/api/infer", { method: "POST", body: fd });
      const json = await res.json();
      onAnalysis(json);
    } catch (e) {
      console.error(e);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <UploadZone onFiles={(arr) => { onFiles(arr); }} />

      <div className="mt-4">
        <div className="flex gap-3">
          <button onClick={analyze} className={`px-4 py-2 rounded ${loading ? "bg-slate-300" : "bg-primary-500 text-white"}`}>
            {loading ? "Analyzing..." : "Analyze X-rays"}
          </button>

          <button onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }} className="px-4 py-2 rounded bg-slate-100">
            Open Chat
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded">
            <img src={URL.createObjectURL(f)} alt="thumb" className="h-20 w-auto object-contain" />
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-sm text-slate-500">{(f.size/1024).toFixed(1)} KB</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
