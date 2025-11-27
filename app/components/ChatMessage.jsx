"use client";

import { useState } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatPanel({ history, setHistory }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return;

    const userMsg = { role: "user", content: message };
    setHistory([...history, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      // IMPORTANT: Correct API route path for nested app folder
      const res = await fetch("/app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, userMsg] }),
      });

      const json = await res.json();

      if (!res.ok) {
        setHistory(prev => [...prev, { role: "assistant", content: "Chat error: " + json.error }]);
        setLoading(false);
        return;
      }

      setHistory(prev => [...prev, { role: "assistant", content: json.reply }]);

    } catch (err) {
      setHistory(prev => [...prev, { role: "assistant", content: "Chat failed: " + String(err) }]);
    }

    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="space-y-2 mb-4">
        {history.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask about posture, exercises..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
