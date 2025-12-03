"use client";

import { useState } from "react";

export default function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(e: any) {
    e.preventDefault();
    setIsLoading(true);
    setResponse("");

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        question,
        conversationId, // <-- IMPORTANT
      }),
    });

    if (!res.ok) {
      setResponse("Error: Unable to reach backend.");
      setIsLoading(false);
      return;
    }

    // Extract conversation id from header
    const convHeader = res.headers.get("X-Conversation-Id");
    if (convHeader) {
      setConversationId(Number(convHeader));
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      setResponse(accumulated);
    }

    setIsLoading(false);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          className="border p-2 flex-1"
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Send
        </button>
      </form>

      <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded min-h-[200px]">
        {response || (isLoading ? "Thinking..." : "")}
      </div>
    </div>
  );
}
