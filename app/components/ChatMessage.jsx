export default function ChatMessage({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`p-3 rounded-lg max-w-[75%] ${isUser ? "bg-primary text-white" : "bg-white border"}`}>
        {msg.content}
      </div>
    </div>
  );
}
