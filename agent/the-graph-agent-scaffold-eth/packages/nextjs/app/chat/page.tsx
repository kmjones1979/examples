"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { ChatInput } from "~~/components/chat/ChatInput";
import { MessageToolCalls } from "~~/components/chat/MessageToolCalls";
import { StatusIndicator } from "~~/components/chat/StatusIndicator";

// Avatar component for user and AI
const Avatar = ({ role, className = "" }: { role: string; className?: string }) => {
  const isUser = role === "user";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${className}`}
    >
      {isUser ? (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-full h-full rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-full h-full rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Timestamp component
const Timestamp = ({ timestamp }: { timestamp: Date }) => {
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
      {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
};

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status, stop, reload } = useChat({
    maxSteps: 10,
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    if (messages.length > lastMessageCount.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      lastMessageCount.current = messages.length;
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const renderMessage = (m: any) => {
    if (!m.parts) {
      return <ReactMarkdown>{m.content}</ReactMarkdown>;
    }

    const textParts = m.parts.filter((p: any) => p.type === "text");
    const toolParts = m.parts.filter((p: any) => p.type === "tool-invocation");

    return (
      <>
        {textParts.map((part: any, index: number) => (
          <div key={`text-${index}`} className="break-words whitespace-pre-wrap">
            <ReactMarkdown
              components={{
                code: ({ ...props }) => (
                  <code
                    className="break-all font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded"
                    {...props}
                  />
                ),
                p: ({ ...props }) => <p className="break-words mb-2 last:mb-0" {...props} />,
                pre: ({ ...props }) => (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-2" {...props} />
                ),
                ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                li: ({ ...props }) => <li className="ml-2" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2" {...props} />
                ),
              }}
            >
              {part.text}
            </ReactMarkdown>
          </div>
        ))}
        <MessageToolCalls toolParts={toolParts} messageId={m.id} />
      </>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Powered by The Graph & x402</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear the chat history?")) {
                    reload();
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                         bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 
                         dark:border-red-800 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                Clear Chat
              </button>
            )}
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to AI Assistant</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              I can help you query blockchain data, analyze token transfers, and explore subgraphs. What would you like
              to know?
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-3 max-w-3xl ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <Avatar role={m.role} />
                  <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        m.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      {renderMessage(m)}
                    </div>
                    <div className={`mt-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
                      <Timestamp timestamp={new Date()} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <StatusIndicator status={status} onStop={stop} />

            {/* Warning for long conversations */}
            {messages.length > 10 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Long conversation detected ({messages.length} messages)
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Consider clearing the chat to improve performance and avoid context limits.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <ChatInput input={input} status={status} onSubmit={handleSubmit} onChange={handleInputChange} />
      </div>
    </div>
  );
}
