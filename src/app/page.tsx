"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Xin chào! Em là trợ lý AI của cửa hàng Thời Trang Việt. Hôm nay anh/chị muốn tìm kiếm váy áo, quần, hay cần em tư vấn phong cách mặc đồ ạ? ✨",
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom smoothly when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Convert string to HTML preserving lines (br)
  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {/* Header */}
        <div className={styles.header}>Fashion AI Assistant 👗</div>

        {/* Message List */}
        <div className={styles.messageArea}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.messageRow} ${
                m.role === "user" ? styles.userRow : styles.botRow
              }`}
            >
              {/* Message Content */}
              {m.content && (
                <div
                  className={`${styles.message} ${
                    m.role === "user" ? styles.userMsg : styles.botMsg
                  }`}
                >
                  {renderText(m.content)}
                </div>
              )}

              {/* Tool invocation state (checking db, finding items...) */}
              {m.toolInvocations?.map((tool) => (
                <div key={tool.toolCallId} className={styles.toolMsg}>
                  <div className={styles.toolBadge}>
                    {tool.state !== "result" ? (
                      <span className={styles.loader}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                      </span>
                    ) : (
                      <span>✅</span>
                    )}
                    Thực thi công cụ: {tool.toolName}...
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className={`${styles.messageRow} ${styles.botRow}`}>
              <div className={`${styles.message} ${styles.botMsg}`}>
                <span className={styles.loader}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              className={styles.input}
              value={input}
              placeholder="Nhập yêu cầu của bạn (VD: tìm áo sơ mi nam màu đen)..."
              onChange={handleInputChange}
            />
            <button
              disabled={isLoading || !input.trim()}
              type="submit"
              className={styles.sendBtn}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
