"use client";
import { useRef, useState } from "react";

export default function UploadZone({ onFiles }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);

  const handleFiles = (list) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/") || f.name.match(/\.(dcm|dicom)$/i));
    if (arr.length) onFiles(arr);
  };

  return (
    <div
      ref={ref}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => ref.current.querySelector("input[type=file]").click()}
      className={`dropzone card ${hover ? "ring-2 ring-primary-300" : ""}`}
      style={{ cursor: "pointer" }}
    >
      <input className="hidden" type="file" multiple accept="image/*,.dcm" onChange={(e) => handleFiles(e.target.files)} />
      <div style={{ padding: "28px 8px" }}>
        <div style={{ fontSize: 24 }}>📷</div>
        <div className="text-lg font-medium mt-2">Click to upload X-ray</div>
        <div className="text-sm text-slate-500 mt-1">PNG, JPG, or DICOM</div>
      </div>
    </div>
  );
}
