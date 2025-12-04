"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatbotPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    
    if (!question.trim()) {
      setResponse("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setResponse("");

    const token = localStorage.getItem("token");

    if (!token) {
      setResponse("❌ You must be logged in to use the chatbot.");
      setIsLoading(false);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {  // ✅ FIXED - parenthesis instead of backtick
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
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Server returned non-JSON response:", text);
          throw new Error("Invalid server response");
        }
        
        setResponse(`❌ Error: ${data.message || `${res.status} - ${res.statusText}`}`);
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
            metadataParsed = true;
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
      setQuestion(""); // Clear input after successful send
    } catch (error) {
      console.error("Network error:", error);
      setResponse(`❌ Network error. Check connection or server URL. ${error instanceof Error ? error.message : ""}`);
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 text-gray-800 font-sans p-4">
      {/* Title */}
      <div className="text-center mb-6 animate-fadeIn">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          AI Assistant
        </h1>
        <p className="text-lg text-gray-600">Ask me anything about your business</p>
      </div>

      {/* Chat Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-[90%] sm:w-[700px] max-w-4xl animate-fadeIn">
        
        {/* Debug info - can be removed in production */}
        {conversationId && (
          <div className="mb-4 text-xs text-gray-500 text-center">
            Conversation ID: {conversationId}
          </div>
        )}

        {/* Response Area */}
        <div className="mb-6 whitespace-pre-wrap bg-gray-50 p-6 rounded-xl min-h-[300px] max-h-[400px] overflow-y-auto border border-gray-200">
          {response || (isLoading ? "🤔 Thinking..." : "👋 Welcome! Ask me a question to get started.")}
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Type your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className={`px-6 py-3 text-white rounded-lg transition-all font-medium ${
                isLoading || !question.trim()
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>

        {/* Optional: New Conversation Button */}
        {conversationId && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setConversationId(null);
                setResponse("");
                setQuestion("");
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              Start New Conversation
            </button>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-sm text-gray-500 mt-6">
        © 2025 A2X CORP — All rights reserved
      </footer>
    </main>
  );
}