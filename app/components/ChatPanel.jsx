// app/components/ChatPanel.jsx (update useEffect)
"use client";
import ChatMessage from "./ChatMessage";
import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ analysis }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! Upload an X-ray to begin." }
  ]);
  const [text, setText] = useState("");
  const chatRef = useRef();

  useEffect(() => {
    if (analysis) {
      // If parsed JSON is present, create a friendly assistant message summary
      const parsed = analysis.parsed ?? analysis; // depends on what onAnalysis sent
      let summary = analysis.raw_text || "";

      if (parsed && parsed.cobb_angle !== undefined) {
        summary = `Cobb angle: ${parsed.cobb_angle}° · Direction: ${parsed.direction ?? "N/A"} · Severity: ${parsed.severity ?? "N/A"}\n\nAdvice: ${parsed.advice ?? "(see full assistant message below)"}\n\nDisclaimer: I am an AI assistant, not a medical professional. For medical diagnosis or treatment, consult a clinician.`;
      }

      setMessages((m) => [...m, { role: "assistant", content: summary }]);
      // also append full raw text as a follow-up
      if (analysis.raw_text) {
        setMessages((m) => [...m, { role: "assistant", content: analysis.raw_text }]);
      }
    }
  }, [analysis]);

  const send = async () => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setText("");
    // send to /api/chat as before if you have chat backed by OpenAI
    // ...
  };

  return (
    <div className="card p-4 mt-4 chat-window">
      <div ref={chatRef} className="chat-history">
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
      </div>

      <div className="chat-input">
        <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 border p-3 rounded-md" placeholder="Ask about posture or your result..." />
        <button onClick={send} className="px-4 py-2 border rounded-md">Send</button>
      </div>
    </div>
  );
}
