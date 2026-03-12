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

async function sendMessage(
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

async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/session/${sessionId}`, { method: "DELETE" });
}

export default function Chat() {
  const [open, setOpen] = useState(false);
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
        { role: "assistant", content: res.reply, toolsUsed: res.tools_used },
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
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gray-950 text-black font-bold shadow-lg flex items-center justify-center text-2xl hover:brightness-110"
        title="Chat with WoW Assistant"
      >
        💬
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] flex flex-col rounded-xl shadow-2xl bg-chat-bg border border-chat-border overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-chat-border">
            <span className="text-wow-stagger font-bold">
              Chat with WoW Assistant
            </span>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-chat-user-msg text-white ml-6"
                    : "bg-chat-agent-response text-gray-200 mr-6"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-800 text-gray-400 p-2 rounded-lg mr-6 text-sm animate-pulse">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-chat-border">
            <input
              className="flex-1 bg-white/5 text-article-name rounded-lg px-3 py-2 text-sm outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything..."
            />
            <button
              onClick={send}
              className="bg-wow-stagger text-black px-3 py-2 rounded-lg text-sm font-bold hover:brightness-110"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
