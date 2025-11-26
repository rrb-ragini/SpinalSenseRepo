export default function ChatMessage({ msg }) {
  const user = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: user ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div className={`p-3 rounded-lg ${user ? "bg-primary-500 text-white" : "bg-white border"}`} style={{ maxWidth: "78%" }}>
        {msg.content}
      </div>
    </div>
  );
}
