"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Menu, Plus, MessageSquare, History, LogOut } from "lucide-react";

// --- MOCK ROUTER (Needed for Navbar navigation) ---
const useMockRouter = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const push = (href: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };
  return { push, pathname };
};

// --- NAVBAR COMPONENT (Internalized) ---
function Navbar() {
  const { push: routerPush, pathname } = useMockRouter();
  
  // State for Dropdowns and Sidebar
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock Chat History Data
  const chatHistory = [
    { id: 1, title: 'Project Brainstorming', date: 'Today' },
    { id: 2, title: 'React Component Help', date: 'Yesterday' },
    { id: 3, title: 'Database Schema Design', date: 'Previous 7 Days' },
    { id: 4, title: 'Debugging API Routes', date: 'Previous 7 Days' },
  ];

  // Hide navbar on login/signup
  if (pathname === '/login' || pathname === '/signup') return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    routerPush('/');
  };

  return (
    <>
      {/* --- Main Top Navbar --- */}
      <nav className="w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40 shadow-lg shadow-black/50 h-20">
        
        {/* Left: Hamburger Menu (Triggers Sidebar) */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Center: Logo (Absolutely Positioned) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Replaced next/image with standard img for compatibility */}
          <img
            src='/logo.png'
            alt='Logo'
            width={120}
            height={40}
            className="object-contain cursor-pointer h-10 w-auto"
            onClick={() => routerPush('/')}
            onError={(e) => {
              // Fallback if logo is missing
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerText = "OCP CHAT";
              e.currentTarget.parentElement!.className = "text-white font-bold text-xl cursor-pointer absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2";
            }}
          />
        </div>

        {/* Right: Account Dropdown */}
        <div className="relative">
          <div 
            className="w-10 h-10 bg-zinc-800 text-zinc-300 rounded-full flex items-center justify-center cursor-pointer font-semibold transition hover:bg-zinc-700 ring-2 ring-green-600/50"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <User size={20} className="text-green-500" />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-zinc-700 shadow-2xl shadow-black/70 rounded-xl z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2">
                <button
                  onClick={() => { routerPush('/account'); setIsProfileOpen(false); }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm transition-colors"
                >
                  <User size={16} className="text-zinc-500" /> Manage Account
                </button>
                <div className="border-t border-zinc-700 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-red-400 hover:bg-zinc-800 rounded-lg text-sm transition-colors"
                >
                  <LogOut size={16} className="text-red-500" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* --- Sidebar (Chat History Style) --- */}
      
      {/* 1. Backdrop Overlay (Click to close) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Sliding Drawer */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          
          {/* Sidebar Header: Close & New Chat */}
          <div className="flex justify-between items-center mb-6">
             <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            >
              <Menu size={24} />
            </button>
             <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full transition"
              title="New Chat"
             >
                <Plus size={20} />
             </button>
          </div>

          {/* New Chat Big Button */}
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 rounded-full mb-6 transition-all shadow-sm group">
            <Plus size={18} className="text-green-500 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">New Chat</span>
          </button>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Recent</h3>
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg text-sm transition-all group overflow-hidden"
                  >
                    <MessageSquare size={16} className="text-zinc-600 group-hover:text-green-500 shrink-0 transition-colors" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-zinc-800 mt-auto">
             <button className="flex items-center gap-3 w-full px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-sm transition-colors">
                <History size={16} /> 
                <span>View All History</span>
             </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// --- MAIN ACCOUNT PAGE COMPONENT ---

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AccountPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageContent = input;
    setInput("");
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageContent,
    };

    const botMsgId = (Date.now() + 1).toString();
    const botMsgPlaceholder: Message = {
      id: botMsgId,
      role: "assistant",
      content: "Thinking...",
    };

    setMessages((prev) => [...prev, userMsg, botMsgPlaceholder]);

    try {
      // Send request to backend
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");

      const res = await fetch("http://localhost:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          question: userMessageContent,
          conversationId,
        }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      // Update conversation ID if new
      if (data.conversationId) setConversationId(data.conversationId);

      // Update bot message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, content: data.aiMessage || "I am okay" }
            : msg
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                content:
                  "Sorry, I encountered an error connecting to the server.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white font-sans">
      <Navbar />
      <div className="h-20"></div>
      
      {/* Chat Area - Scrollbar Customized Here */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0f0f0f] [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
            <img
                    src="/phos.png" 
                    alt="assistant"
                    width={90} 
                    height={90} 
                    className="rounded-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // Fallback icon logic handled by parent div background if needed, 
                        // or could inject a Bot icon here.
                    }}
                  />
            <p className="text-green-800">Start a conversation...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                  msg.role === "user" ? "bg-zinc-700" : "bg-ocp-green"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={16} />
                ) : (
                  <img
                    src="/phos.png" 
                    alt="assistant"
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover w-8 h-8"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // Fallback icon logic handled by parent div background if needed, 
                        // or could inject a Bot icon here.
                    }}
                  />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-white rounded-tr-none border border-zinc-700"
                    : "bg-[#18181b] text-zinc-100 rounded-tl-none border border-zinc-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto relative group">
          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              className="w-full bg-green-800/30 border border-zinc-700 text-white rounded-xl py-4 pl-4 pr-14 focus:outline-none  focus:border-white transition-all shadow-lg placeholder:text-zinc-600"
              placeholder="Ask anything about OCP..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-ocp-green hover:bg-green-800 text-gray-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            CHAT OCP can make mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
}