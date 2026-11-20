"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  source?: string;
}

const AI_NAME = "Gyaana Mitra";

function formatTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function VigyaanChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      sender: "bot",
      text: `Namaste! I'm ${AI_NAME}, your AI Academic Advisor at ViGYAAN Academy. Ask me anything about our Graduate Plus Civil Services Programme, syllabus, or admissions.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const apiUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";
  console.log("Using API Gateway URL:", apiUrl);
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    const sentAt = new Date().toISOString();

    setInput("");
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, timestamp: sentAt },
    ]);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) throw new Error("Backend gateway unavailable");
      const data = await res.json();
      console.log("AI Response:", data, apiUrl, res.status);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply || "No response received.",
          timestamp: data.timestamp || new Date().toISOString(),
          source: data.source,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Our AI Advisor backend is currently offline. Run `docker-compose up` locally or reach us directly at +91-7799077701!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const quickQuestions = [
    "What is Graduate Plus?",
    "Topics covered in CSE?",
    "How to contact admissions?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#c08137] px-6 py-4 text-sm font-black text-black shadow-2xl transition-transform hover:scale-105"
        >
          <span>💬 Ask {AI_NAME}</span>
        </button>
      ) : (
        <div className="flex h-[460px] w-80 flex-col overflow-hidden rounded-2xl border border-[#d5b07a] bg-white shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#111111] px-4 py-3.5 text-white">
            <div>
              <h3 className="text-sm font-bold text-[#c08137]">{AI_NAME}</h3>
              <p className="text-[11px] text-gray-300">
                ViGYAAN AI Academic Advisor
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-lg leading-none text-white hover:text-[#c08137]"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5efe7] p-4 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.sender === "user"
                    ? "ml-auto bg-[#c08137] font-medium text-black"
                    : "border border-[#e3c39d] bg-white text-slate-800 shadow-sm"
                }`}
              >
                {msg.sender === "bot" && (
                  <span className="mb-1 block text-[11px] font-bold text-[#9c631e]">
                    {AI_NAME}
                  </span>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-70">
                  <span>
                    {msg.source ? `via ${msg.source}` : "AI powered classes"}
                  </span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs italic text-gray-500">
                {AI_NAME} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          {messages.length <= 2 && (
            <div className="relative z-10 flex flex-wrap gap-1.5 border-t border-[#e3c39d]/60 bg-[#f5efe7] px-3 py-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "Quick chat clicked:",
                      q,
                      "loading:",
                      loading,
                      "apiUrl:",
                      apiUrl,
                    );
                    void sendMessage(q);
                  }}
                  className="cursor-pointer rounded-full border border-[#c08137] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1e1e1e] transition hover:bg-[#c08137] hover:text-black disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={handleFormSubmit}
            className="flex gap-2 border-t border-[#e3c39d] bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about UPSC, syllabus..."
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-[#c08137] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#c08137] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
