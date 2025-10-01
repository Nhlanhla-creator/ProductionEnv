import React, { useState, useEffect, useRef } from "react";
import { API_KEYS } from "../API.js"
import { FaRobot } from "react-icons/fa";

const API_KEY = API_KEYS.OPENAI;

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const chatBoxRef = useRef(null);

  const systemMessageContent = `
You are a helpful assistant that only answers questions about BIG Marketplace based on the following information:

BIG Marketplace is Africa's trust layer for growth: One profile. One score. Many doors.
It connects SMEs, funders, support partners, corporates, and advisors to grow smarter and faster with less risk.

BIG Marketplace solves the problem of lack of trust among Africa's SMEs by combining data, partnerships, and technology for a transparent ecosystem where:
- SMEs prove credibility
- Funders find verified opportunities
- Corporates maximize impact

Who benefits:
- SMEs: Get matched to funders, service providers, and support with a universal profile and BIG Score.
- Investors: Access verified, investment-ready SMEs with compliance checks and insights.
- Corporates: Source verified SMEs to accelerate impact.
- Catalysts: Incubators, accelerators, donors who support SMEs and track outcomes via BIG Score.
- Advisors: Strategic advisors and board candidates matched to businesses that need expertise.

The BIG Score evaluates investment readiness based on:
- Financial health: revenue trends, profitability (with 4 components: compliance, legitimacy, fundability, PIS)
- Operational maturity: systems and processes
- Compliance status: legal and regulatory
- Growth potential: market opportunity

Only answer based on this information. If the question is outside this scope, politely say you can only answer questions about BIG Marketplace.
`;

  useEffect(() => {
    setMessages([
      { text: "Hi, welcome! I'm your BIG Marketplace assistant. How can I help you today?", user: false },
    ]);
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { text: userInput.trim(), user: true };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemMessageContent },
            { role: "user", content: userInput.trim() },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || "Unknown error");

      const botText = data.choices[0].message.content.trim();
      setMessages((prev) => [...prev, { text: botText, user: false }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setError(err.message || "Failed to get response from OpenAI.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div style={styles.iconContainer}>
      <div style={styles.floatingIcon} onClick={() => setIsOpen(!isOpen)}>
        <FaRobot size={30} color="white" />
      </div>

      {isOpen && (
        <div style={styles.chatContainer}>
          <div style={styles.header}>BIG Marketplace Chatbot</div>

          <div style={styles.chatBox} ref={chatBoxRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  alignSelf: msg.user ? "flex-end" : "flex-start",
                  backgroundColor: msg.user ? "#FFA500" : "#754A2D",
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && <div style={styles.loading}>Loading...</div>}
            {error && <div style={styles.error}>{error}</div>}
          </div>

          <div style={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask me anything about BIG Marketplace..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !userInput.trim()} style={styles.button}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  iconContainer: {
    position: "fixed",
    bottom: 30,
    right: 30,
    zIndex: 999,
  },
  floatingIcon: {
    backgroundColor: "#754A2D",
    borderRadius: "50%",
    padding: 15,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  chatContainer: {
    position: "fixed",
    bottom: 100,
    right: 30,
    width: 350,
    maxHeight: 500,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#754A2D",
    color: "white",
    padding: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
  chatBox: {
    padding: 10,
    height: 300,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backgroundColor: "#f4f4f4",
  },
  message: {
    padding: 10,
    borderRadius: 15,
    maxWidth: "80%",
    color: "white",
    wordWrap: "break-word",
  },
  loading: {
    textAlign: "center",
    color: "#666",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  inputArea: {
    padding: 10,
    display: "flex",
    gap: 10,
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 16px",
    fontSize: 14,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#754A2D",
    color: "white",
    cursor: "pointer",
  },
};