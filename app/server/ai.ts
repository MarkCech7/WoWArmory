const API_URL = "http://localhost:8000";

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
