"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          conversationId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setResponse(`Error: ${res.status} - ${errorText || "Unable to reach backend."}`);
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
      let metadataParsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Handle metadata if present
        if (!metadataParsed && chunk.includes("METADATA_START:")) {
          const metadataMatch = chunk.match(/METADATA_START:(.+?):METADATA_END/);
          if (metadataMatch) {
            // You can extract sources here if needed
            // const metadata = JSON.parse(metadataMatch[1]);
            metadataParsed = true;
            // Remove metadata from chunk before displaying
            const cleanChunk = chunk.replace(/METADATA_START:.+?:METADATA_END\n\n/, "");
            accumulated += cleanChunk;
          } else {
            accumulated += chunk;
          }
        } else {
          accumulated += chunk;
        }
        
        setResponse(accumulated);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setResponse(`Error: ${error instanceof Error ? error.message : "Network error. Check if server is running."}`);
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
      
      {/* Debug info - remove in production */}
      <div className="mb-4 text-xs text-gray-500">
        API URL: {API_URL}
        {conversationId && ` | Conversation ID: ${conversationId}`}
      </div>

      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          className="border p-2 flex-1"
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>

      <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded min-h-[200px]">
        {response || (isLoading ? "Thinking..." : "")}
      </div>
    </div>
  );
}