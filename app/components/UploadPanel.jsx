"use client";

import { useState } from "react";
import UploadZone from "./UploadZone";

export default function UploadPanel({ onFiles, files = [], onAnalysis }) {
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!files.length) {
      alert("Please upload an X-ray first.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", files[0]);   // MUST MATCH infer backend

      // IMPORTANT: call the correct infer route that exists
      const res = await fetch("/app/api/infer", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        alert("Error analyzing image: " + (json.error || "Unknown error"));
        setLoading(false);
        return;
      }

      // Send result to UI
      onAnalysis({
        raw_text: JSON.stringify(json, null, 2),
        parsed: json,
      });

    } catch (err) {
      alert("Upload failed: " + String(err));
    }

    setLoading(false);
  };

  return (
    <div>
      <UploadZone onFiles={onFiles} />

      <button
        onClick={analyze}
        disabled={loading}
        className="mt-4 bg-primary text-white px-5 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Analyze X-rays"}
      </button>

      <div className="mt-4 space-y-3">
        {files.map((file, i) => (
          <div key={i} className="flex gap-3 p-3 border rounded bg-white">
            <img
              src={URL.createObjectURL(file)}
              className="h-20 object-contain rounded"
            />
            <div>{file.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
