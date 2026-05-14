import React, { useState, useEffect, useRef } from "react";
import { API_KEYS } from "../API.js"
import { FaRobot } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

const API_KEY = API_KEYS.OPENAI;

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [globalLimit, setGlobalLimit] = useState(5000); // Default, will update from backend
  const [usageStats, setUsageStats] = useState(() => {
    const saved = localStorage.getItem('chatbot_usage_stats');
    return saved ? JSON.parse(saved) : {
      today: 0,
      lastResetDate: new Date().toDateString(),
      remainingToday: 5000
    };
  });
  const chatBoxRef = useRef(null);

  // Reset daily counter if needed
  useEffect(() => {
    const today = new Date().toDateString();
    if (usageStats.lastResetDate !== today) {
      setUsageStats({
        today: 0,
        lastResetDate: today,
        remainingToday: globalLimit
      });
    }
  }, [usageStats.lastResetDate, globalLimit]);

  // Save usage stats
  useEffect(() => {
    localStorage.setItem('chatbot_usage_stats', JSON.stringify(usageStats));
  }, [usageStats]);

  // Clear rate limit info after 8 seconds
  useEffect(() => {
    if (rateLimitInfo) {
      const timer = setTimeout(() => {
        setRateLimitInfo(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitInfo]);

  useEffect(() => {
    setMessages([
      { text: "Hi, welcome! I'm your BIG Marketplace assistant. How can I help you today?", user: false },
    ]);
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
  }, [messages, loading]);

  // Simulate rate limit for testing
  const simulateRateLimit = () => {
    setRateLimitInfo({
      isLimit: true,
      message: `⚠️ RATE LIMIT REACHED! You've used all ${globalLimit} messages for today.`,
      remaining: 0,
      limit: globalLimit,
      resetIn: 86400,
      retryAfter: 86400
    });
    setError(`Daily limit reached (${globalLimit}/${globalLimit}). Please try again tomorrow.`);
  };

  // Reset stats for testing
  const resetLocalStats = () => {
    const today = new Date().toDateString();
    setUsageStats({
      today: 0,
      lastResetDate: today,
      remainingToday: globalLimit
    });
    localStorage.setItem('chatbot_usage_stats', JSON.stringify({
      today: 0,
      lastResetDate: today,
      remainingToday: globalLimit
    }));
    setRateLimitInfo(null);
    setError(null);
    setMessages(prev => [...prev, { 
      text: `🔄 Usage stats have been reset. You have ${globalLimit} messages available today.`, 
      user: false 
    }]);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Check local daily limit
    if (usageStats.today >= globalLimit) {
      setRateLimitInfo({
        isLimit: true,
        message: `⚠️ DAILY LIMIT REACHED! You've used all ${globalLimit} messages for today.`,
        remaining: 0,
        limit: globalLimit,
        resetIn: 86400 - (Date.now() % 86400000) / 1000,
        retryAfter: 86400 - (Date.now() % 86400000) / 1000
      });
      setError(`Daily limit reached (${globalLimit}/${globalLimit}). Please try again tomorrow.`);
      return;
    }

    const newUserMessage = { text: userInput.trim(), user: true };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setLoading(true);
    setError(null);
    setRateLimitInfo(null);

    try {
      const call = httpsCallable(functions, "bigMarketplaceChat");
      const { data } = await call({
        prompt: newUserMessage.text,
        conversationHistory: messages.slice(-5)
      });
      
      const botText = data?.content || data?.answer || "I couldn't generate a response.";
      const rateLimit = data?.rateLimit;

      // Update global limit from backend response
      if (rateLimit && rateLimit.limit) {
        setGlobalLimit(rateLimit.limit);
      }
      
      // Update local stats based on server response
      if (rateLimit) {
        setUsageStats(prev => ({
          ...prev,
          today: rateLimit.used || prev.today + 1,
          remainingToday: rateLimit.remaining || 0
        }));
      } else {
        const newTodayCount = usageStats.today + 1;
        setUsageStats(prev => ({
          ...prev,
          today: newTodayCount,
          remainingToday: globalLimit - newTodayCount
        }));
      }
      
      // Show warning when approaching limit
      const remaining = rateLimit?.remaining || (globalLimit - (usageStats.today + 1));
      if (remaining <= 10 && remaining > 0) {
        setRateLimitInfo({
          isLimit: false,
          message: `⚠️ Low quota warning: Only ${remaining} messages remaining today!`,
          remaining: remaining,
          limit: globalLimit,
          resetIn: null,
          retryAfter: null
        });
      }

      setMessages((prev) => [...prev, { text: botText, user: false }]);
      
    } catch (err) {
      console.error("Chatbot error:", err);
      
      // Parse rate limit error
      if (err.code === 'resource-exhausted' || 
          err.message?.includes('RATE_LIMIT_EXCEEDED')) {
        
        let retryAfter = 60;
        const retryMatch = err.message?.match(/RATE_LIMIT_EXCEEDED:(\d+)/);
        if (retryMatch) {
          retryAfter = parseInt(retryMatch[1]);
        }
        
        const errorDetails = err.details || {};
        const remaining = errorDetails.remaining || 0;
        const limit = errorDetails.limit || globalLimit;
        const used = errorDetails.used || limit;

        // Update limit from error response
        setGlobalLimit(limit);
        
        setRateLimitInfo({
          isLimit: true,
          message: `🚫 GLOBAL RATE LIMIT REACHED! ${used}/${limit} messages used today.`,
          remaining: remaining,
          limit: limit,
          resetIn: retryAfter,
          retryAfter: retryAfter
        });
        
        setError(`Rate limit exceeded. ${remaining}/${limit} remaining. Please try again in ${Math.ceil(retryAfter / 3600)} hour${Math.ceil(retryAfter / 3600) > 1 ? 's' : ''}.`);
        
        // Sync local stats with server
        setUsageStats(prev => ({
          ...prev,
          today: used,
          remainingToday: remaining
        }));
      } else {
        setError(err.message || "Failed to get response. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && !rateLimitInfo?.isLimit) {
      sendMessage();
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const remainingMessages = usageStats.remainingToday;

  return (
    <div style={styles.iconContainer}>
      {/* Testing Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div style={styles.testingControls}>
          <button 
            onClick={simulateRateLimit} 
            style={styles.testButton}
            title="Simulate rate limit for testing"
          >
            🧪 Test Rate Limit
          </button>
          <button 
            onClick={resetLocalStats} 
            style={styles.testButton}
            title="Reset usage stats"
          >
            🔄 Reset Stats
          </button>
          <div style={styles.testInfo}>
            Remaining: {remainingMessages}/{globalLimit}
          </div>
        </div>
      )}

      <div style={styles.floatingIcon} onClick={() => setIsOpen(!isOpen)}>
        <FaRobot size={30} color="white" />
        {remainingMessages <= 10 && remainingMessages > 0 && (
          <div style={styles.warningBadge}>
            {remainingMessages}
          </div>
        )}
      </div>

      {isOpen && (
        <div style={styles.chatContainer}>
          <div style={styles.header}>
            <span>💬 BIG Marketplace Assistant</span>
           
          </div>

          {/* Rate Limit Status Bar */}
          {rateLimitInfo && (
            <div style={{
              ...styles.rateLimitBar,
              backgroundColor: rateLimitInfo.isLimit ? '#dc3545' : '#ffc107',
              color: rateLimitInfo.isLimit ? 'white' : '#333'
            }}>
              <span style={styles.rateLimitText}>
                {rateLimitInfo.isLimit ? '🚫' : '⚠️'} {rateLimitInfo.message}
              </span>
              {rateLimitInfo.retryAfter && (
                <span style={styles.countdownTimer}>
                  ⏱️ Try again in {formatTimeRemaining(rateLimitInfo.retryAfter)}
                </span>
              )}
            </div>
          )}

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
            {loading && (
              <div style={styles.loading}>
                <div className="dot-floating"></div>
                Thinking...
              </div>
            )}
            {error && (
              <div style={styles.error}>
                <strong>⚠️ {error.includes('limit') ? 'Rate Limit' : 'Error'}</strong><br/>
                {error}
              </div>
            )}
          </div>

          <div style={styles.inputArea}>
            <input
              type="text"
              placeholder={
                rateLimitInfo?.isLimit 
                  ? `Rate limited. Try again in ${formatTimeRemaining(rateLimitInfo.retryAfter)}`
                  : "Ask me about BIG Marketplace..."
              }
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                ...styles.input,
                backgroundColor: rateLimitInfo?.isLimit ? '#f8f9fa' : 'white',
                cursor: rateLimitInfo?.isLimit ? 'not-allowed' : 'text'
              }}
              disabled={loading || rateLimitInfo?.isLimit}
            />
            <button 
              onClick={sendMessage} 
              disabled={loading || rateLimitInfo?.isLimit || !userInput.trim()} 
              style={{
                ...styles.button,
                opacity: (loading || rateLimitInfo?.isLimit) ? 0.5 : 1,
                cursor: (loading || rateLimitInfo?.isLimit) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          {/* Warning when approaching limit */}
          {remainingMessages <= 20 && remainingMessages > 0 && (
            <div style={styles.warningFooter}>
              ⚠️ Low quota: Only {remainingMessages} messages remaining today
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dot-floating {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #754A2D;
          margin-right: 8px;
          animation: float 0.6s ease-in-out infinite;
        }
      `}</style>
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
  testingControls: {
    position: "absolute",
    bottom: 80,
    right: 0,
    display: "flex",
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    cursor: "pointer",
    opacity: 0.8,
    transition: "opacity 0.2s",
  },
  testInfo: {
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    color: "#495057",
    fontFamily: "monospace",
  },
  floatingIcon: {
    backgroundColor: "#754A2D",
    borderRadius: "50%",
    padding: 15,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    position: "relative",
    transition: "transform 0.2s",
  },
  warningBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#dc3545",
    color: "white",
    borderRadius: "50%",
    width: 22,
    height: 22,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    animation: "float 0.6s ease-in-out infinite",
  },
  chatContainer: {
    position: "fixed",
    bottom: 100,
    right: 30,
    width: 400,
    maxHeight: 600,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    animation: "slideDown 0.3s ease-out",
  },
  header: {
    backgroundColor: "#754A2D",
    color: "white",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
  },
  usageBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "4px 8px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "normal",
  },
  rateLimitBar: {
    padding: "10px 16px",
    fontSize: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    animation: "slideDown 0.3s ease-out",
    fontWeight: "500",
  },
  rateLimitText: {
    flex: 1,
  },
  countdownTimer: {
    fontFamily: "monospace",
    fontWeight: "bold",
    marginLeft: 12,
    fontSize: 11,
  },
  chatBox: {
    padding: 16,
    height: 350,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backgroundColor: "#f8f9fa",
  },
  message: {
    padding: "10px 14px",
    borderRadius: 18,
    maxWidth: "75%",
    color: "white",
    wordWrap: "break-word",
    fontSize: 14,
    lineHeight: 1.4,
  },
  loading: {
    textAlign: "center",
    color: "#6c757d",
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
  },
  error: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 12,
    margin: 5,
    textAlign: "center",
    border: "1px solid #f5c6cb",
  },
  inputArea: {
    padding: 12,
    display: "flex",
    gap: 10,
    borderTop: "1px solid #dee2e6",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 25,
    border: "1px solid #dee2e6",
    outline: "none",
    transition: "all 0.2s",
  },
  button: {
    padding: "10px 20px",
    fontSize: 14,
    borderRadius: 25,
    border: "none",
    backgroundColor: "#754A2D",
    color: "white",
    cursor: "pointer",
    transition: "background-color 0.2s",
    fontWeight: "500",
  },
  warningFooter: {
    padding: "8px 12px",
    backgroundColor: "#fff3cd",
    color: "#856404",
    fontSize: 11,
    textAlign: "center",
    borderTop: "1px solid #ffeeba",
  },
};