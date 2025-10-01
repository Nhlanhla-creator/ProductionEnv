"use client"

import { useState, useEffect } from "react"
import { Rocket, X, HelpCircle, Smile, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function ProcessGuidePopup({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [showButton, setShowButton] = useState(false);

  const steps = [
    {
      title: "Welcome to Your Universal Profile!",
      content: "This is your one-stop profile that helps us match you with the best opportunities. When you're done, you can move to the Application tab to explore programs.",
      emoji: "👋"
    },
    {
      title: "Step 1: Basic Information",
      content: "Tell us about your business - name, type, and location. This helps us understand who you are and match you with relevant opportunities.",
      emoji: "📝"
    },
    {
      title: "Step 2: Ownership Details",
      content: "Share your business structure and management team. We value diversity and inclusion in our network!",
      emoji: "👥"
    },
    {
      title: "Step 3: Products & Services",
      content: "What do you offer? Be descriptive - this helps potential partners understand your unique value proposition.",
      emoji: "🛍️"
    },
    {
      title: "Step 4: Legal & Compliance",
      content: "Upload necessary documents. Don't worry, we keep everything secure and confidential. You can save and come back later.",
      emoji: "🔒"
    },
    {
      title: "Step 5: Final Declaration",
      content: "Review and confirm your information is accurate. Once submitted, you'll be ready to apply for programs in the Application tab!",
      emoji: "✅"
    },
    {
      title: "Need Help?",
      content: "Click your profile icon anytime and select 'Help & Support' if you have questions. We're here to help you succeed!",
      emoji: "💡"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTyping(false);
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const nextStep = () => {
    setTyping(true);
    setShowButton(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleGotIt = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border-2 border-brown-200 relative"
      >
        <div className="bg-gradient-to-r from-brown-600 to-brown-800 p-6 text-brown-50">
          <div className="flex items-center gap-3">
            <Rocket size={24} className="shrink-0" />
            <h2 className="text-xl font-bold">Your Application Journey</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{steps[currentStep].emoji}</div>
            <div>
              <h3 className="text-lg font-semibold text-brown-800 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className={`text-brown-600 ${typing ? 'typing-animation' : ''}`}>
                {typing ? steps[currentStep].content.substring(0, Math.floor(steps[currentStep].content.length * 0.7)) : steps[currentStep].content}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-brown-600' : 'bg-brown-200'}`}
                />
              ))}
            </div>
            
            <AnimatePresence>
              {showButton && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={currentStep === steps.length - 1 ? handleGotIt : nextStep}
                  className="bg-brown-600 hover:bg-brown-700 text-brown-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Got it! <Smile size={16} />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}