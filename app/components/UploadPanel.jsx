"use client";
import UploadZone from "./UploadZone";
import { useState } from "react";

export default function UploadPanel({ onFiles, files, onAnalysis }) {
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
      alert("Analysis failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <UploadZone onFiles={onFiles} />

      <div className="mt-4 flex gap-3">
        <button 
          onClick={analyze} 
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          {loading ? "Analyzing..." : "Analyze X-rays"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {files.map((f,i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-md bg-white">
            <img 
              src={URL.createObjectURL(f)} 
              className="h-20 w-auto object-contain rounded-md" 
            />
            <div>
              <div className="font-medium">{f.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
