// app/components/UploadPanel.jsx  (excerpt or replace analyze() function)
"use client";
import UploadZone from "./UploadZone";
import { useState } from "react";

export default function UploadPanel({ onFiles, files = [], onAnalysis }) {
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!files || files.length === 0) {
      alert("Upload at least one image");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      // Send the first image for now (or loop if you support multi)
      fd.append("file", files[0]);

      const res = await fetch("/api/vision", { method: "POST", body: fd });
      const json = await res.json();

      if (json.error) {
        alert("Analysis error: " + (json.error || JSON.stringify(json)));
        setLoading(false);
        return;
      }

      // json.assistant_text is the raw text reply; json.parsed is parsed JSON if model returned one
      const analysis = json.parsed ?? { raw: json.assistant_text };
      // call parent's callback
      onAnalysis({ raw_text: json.assistant_text, parsed: analysis });
    } catch (err) {
      console.error(err);
      alert("Failed to analyze image: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <UploadZone onFiles={(arr) => onFiles(arr)} />
      <div className="mt-4 flex gap-3">
        <button onClick={analyze} className={`px-4 py-2 rounded ${loading ? "bg-slate-300" : "bg-primary text-white"}`}>
          {loading ? "Analyzing..." : "Analyze X-rays"}
        </button>
      </div>

      {/* thumbnails */}
      <div className="mt-4 space-y-3">
        {files.map((f,i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-md bg-white">
            <img src={URL.createObjectURL(f)} className="h-20 w-auto object-contain rounded-md" />
            <div>
              <div className="font-medium">{f.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
