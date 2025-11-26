export default function ChatMessage({ msg }) {
  if (msg.role === "analysis") {
    const a = msg.content;

    if (!a) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          Could not interpret this X-ray. Please upload a clearer one.
        </div>
      );
    }

    return (
      <div className="p-3 bg-purple-50 border rounded">
        <div><strong>Cobb Angle:</strong> {a.cobb_angle ?? "Not detected"}°</div>
        <div><strong>Severity:</strong> {a.severity}</div>
        <div><strong>Explanation:</strong> {a.explanation}</div>
        <div><strong>Recommendations:</strong> {a.recommendations}</div>
        <div className="text-xs italic mt-2">{a.disclaimer}</div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded ${
        msg.role === "assistant" ? "bg-gray-100" : "bg-blue-50"
      }`}
    >
      {msg.content}
    </div>
  );
}
