import { useState, useRef } from "react";

const API_URL = "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  tools_used: string[];
}

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!res.ok) throw new Error("Agent request failed");
  return res.json();
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/session/${sessionId}`, { method: "DELETE" });
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await sendMessage(userMsg, sessionId.current);
      sessionId.current = res.session_id;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          toolsUsed: res.tools_used,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error contacting agent." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (sessionId.current) clearSession(sessionId.current);
    sessionId.current = undefined;
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen max-w-xl mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Chat with Agent</h1>
        <button
          onClick={reset}
          className="text-sm text-red-grey hover:text-red-500"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
            }`}
          >
            <p>{msg.content}</p>
            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                🔧 Tools used: {msg.toolsUsed.join(", ")}
              </p>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 p-3 rounded-lg mr-8 animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything..."
        />
        <button
          onClick={send}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
