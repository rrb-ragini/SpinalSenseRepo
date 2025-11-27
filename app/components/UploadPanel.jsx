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
      fd.append("file", files[0]);

      const res = await fetch("/api/infer", { method: "POST", body: fd });
      const json = await res.json();

      if (json.error) {
        alert("Error analyzing image: " + json.error);
        return;
      }

      onAnalysis({
        raw_text: json.assistant_text,
        parsed: json.parsed,
      });

    } catch (err) {
      alert("Upload failed: " + String(err));
    } finally {
      setLoading(false);
    }
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
