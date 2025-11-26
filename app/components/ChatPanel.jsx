"use client";
import ChatMessage from "./ChatMessage";
import { useState, useEffect, useRef } from "react";

export default function ChatPanel({ analysis }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! Upload an X-ray to begin." }
  ]);

  const [text, setText] = useState("");
  const chatRef = useRef();

  // When Cobb angle result arrives, inject into chat
  useEffect(() => {
    if (analysis) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Cobb angle detected: ${analysis.cobb_angle}°.\n${analysis.explanation || ""}`
        }
      ]);
    }
  }, [analysis]);

  const send = async () => {
    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      const json = await res.json();

      // Guardrail: Off-topic or profanity
      if (json.error && json.assistant) {
        setMessages(prev => [...prev, json.assistant]);
        return;
      }

      // Guardrail: Moderation warning
      if (json.moderation?.flagged) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Your message could not be processed due to safety policies."
          }
        ]);
        return;
      }

      // Guardrail: No assistant message
      if (!json.assistant?.content) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "⚠️ I was unable to provide a response." }
        ]);
        return;
      }

      // SUCCESS: Append assistant response
      setMessages(prev => [...prev, json.assistant]);
    } catch (err) {
      // Network / unknown error fallback
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "⚠️ Network error. Please try again." }
      ]);
    }

    // Auto-scroll down after rendering
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 100);
  };

  return (
    <div className="card p-4 mt-4 chat-window">
      <div ref={chatRef} className="chat-history">
        {messages.map((m, i) => (
          <ChatMessage key={i} msg={m} />
        ))}
      </div>
      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-3 rounded-md"
          placeholder="Ask about posture, scoliosis, stretches..."
        />
        <button onClick={send} className="px-4 py-2 rounded border">
          Send
        </button>
      </div>
    </div>
  );
}
