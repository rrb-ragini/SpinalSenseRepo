"use client";

import { useState, useEffect } from "react";

export default function ChatPanel({ analysis }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // 🔥 When analysis result arrives, insert it into chat
  useEffect(() => {
    if (!analysis) return;

    const text = `📘 X-ray Analysis Result\n
Cobb Angle: ${analysis.cobb_angle ?? "N/A"}°
Severity: ${analysis.severity ?? "N/A"}
Explanation: ${analysis.explanation ?? "N/A"}`;

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: text }
    ]);
  }, [analysis]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [userMsg],
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert("Chat error: " + json.error);
        return;
      }

      const assistantMsg = {
        role: "assistant",
        content: json.message,
      };

      setMessages((prev) => [...prev, assistantMsg]);

    } catch (err) {
      alert("Request failed: " + err.message);
    }
  };

  return (
    <div>
      <div className="mb-4 space-y-2 h-64 overflow-y-auto bg-white p-4 rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className="block p-2 bg-gray-100 rounded whitespace-pre-wrap">
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 border p-2 rounded"
        />
        <button onClick={sendMessage} className="bg-primary text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
