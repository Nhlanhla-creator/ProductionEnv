import { useState, useEffect } from "react";

export default function FullScreenLoader() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "Talking to the servers...",
    "Almost there...",
    "Just a moment...",
    "Getting things ready...",
  ];

  useEffect(() => {
    // Animate progress bar from 0 to 100 over 3 seconds
    const duration = 3000; // 3 seconds
    const interval = 20; // update every 20ms
    const steps = duration / interval;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const newProgress = (currentStep / steps) * 100;
      setProgress(Math.min(newProgress, 100));
      
      // Update message every ~25% progress
      const messageStep = Math.floor(newProgress / 25);
      if (messageStep !== messageIndex && messageStep < messages.length) {
        setMessageIndex(messageStep);
      }
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      
      {/* Optimistic Text */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-brown-900 mb-2">
          {messages[messageIndex]}
        </h2>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-80 bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
        {/* Progress Bar Fill */}
        <div 
          className="h-full rounded-full transition-all duration-75 ease-out"
          style={{ 
            width: `${progress}%`,
            background: "linear-gradient(90deg, #a1887f, #8d6e63, #795548)"
          }}
        >
          <div className="w-full h-full animate-pulse opacity-50" />
        </div>
      </div>
      
      {/* Progress Percentage */}
      <div className="mt-4 text-gray-400 text-sm font-mono">
        {Math.floor(progress)}%
      </div>
      
      {/* Loading dots animation */}
      <div className="mt-6 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}