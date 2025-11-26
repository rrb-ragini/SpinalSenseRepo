"use client";
import UploadPanel from "../../../components/UploadPanel";
import ChatPanel from "../../../components/ChatPanel";
import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6">
      {/* LEFT UPLOAD */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Upload X-rays</h2>
        <UploadPanel 
          onFiles={(f) => setFiles((prev) => [...prev, ...f])}
          files={files}
          onAnalysis={setAnalysis}
        />
      </div>

      {/* RIGHT CHAT */}
      <div>
        <div className="card p-6 bg-gradient-to-b from-accent to-purple-600 text-white mb-4">
          <h3 className="text-xl font-bold">Spine Assistant</h3>
          <p className="text-sm opacity-85">Get posture, exercise & lifestyle advice</p>
        </div>

        <ChatPanel analysis={analysis} />
      </div>
    </div>
  );
}
