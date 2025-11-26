"use client";

import { useState } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatPanel({ analysis }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! Upload an X-ray to begin." }
  ]);
  const [input, setInput] = useState("");

  // Add analysis message when it arrives
  if (analysis && !messages.some(m => m.role === "analysis")) {
    messages.push({
      role: "analysis",
      content: analysis.parsed
    });
  }

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input })
    });

    const json = await res.json();
    setMessages(msgs => [...msgs, { role: "assistant", content: json.reply }]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Ask about posture, exercises…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={send} className="px-4 bg-primary text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
