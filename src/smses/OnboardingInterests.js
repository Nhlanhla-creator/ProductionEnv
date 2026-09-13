"use client";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Award, Lock, TrendingUp, Building2, Rocket, Users, GraduationCap,
  Briefcase, Landmark, Loader2, CheckCircle2,
} from "lucide-react";

const PRIMARY_INTERESTS = [
  { id: "businessScorecard", title: "Business Scorecard", description: "Get your business scored and benchmarked against industry standards.", icon: <Award size={20} /> },
  { id: "complianceVault", title: "Compliance Vault", description: "Store and manage all your compliance documents in one secure place.", icon: <Lock size={20} /> },
  { id: "fundingMatchmaking", title: "Funding Matchmaking", description: "Get matched with funders and investors looking for businesses like yours.", icon: <TrendingUp size={20} /> },
  { id: "procurementMatchmaking", title: "Procurement Matchmaking", description: "Connect with corporates looking for suppliers and vendors.", icon: <Building2 size={20} /> },
  { id: "growthSuite", title: "Growth Suite", description: "Track and improve your performance across strategy, finance, operations and ESG.", icon: <Rocket size={20} /> },
  { id: "advisorMarketplace", title: "Advisor Marketplace", description: "Connect with expert advisors who can help you grow your business.", icon: <Users size={20} /> },
  { id: "internshipMarketplace", title: "Internship Marketplace", description: "Recruit interns and graduates to build your talent pipeline.", icon: <GraduationCap size={20} /> },
];

const MATCH_TYPES = [
  { id: "customers", title: "Customers", icon: <Briefcase size={18} /> },
  { id: "suppliers", title: "Suppliers", icon: <Building2 size={18} /> },
  { id: "funders", title: "Funders", icon: <Landmark size={18} /> },
  { id: "catalysts", title: "Catalysts", icon: <Rocket size={18} /> },
  { id: "advisors", title: "Advisors", icon: <Users size={18} /> },
  { id: "interns", title: "Interns", icon: <GraduationCap size={18} /> },
];

// Which sidebar match-types each feature choice implies
const SUGGESTED_MATCHES = {
  fundingMatchmaking: ["funders"],
  procurementMatchmaking: ["customers", "suppliers"],
  growthSuite: ["catalysts"],
  advisorMarketplace: ["advisors"],
  internshipMarketplace: ["interns"],
  businessScorecard: [],
  complianceVault: [],
};

// Shown only if the user isn't sure and skips step 1
const FALLBACK_OPTIONS = [
  { id: "fund", label: "Get funding", primary: ["fundingMatchmaking"], matches: ["funders"] },
  { id: "sell", label: "Find customers or suppliers", primary: ["procurementMatchmaking"], matches: ["customers", "suppliers"] },
  { id: "ops", label: "Improve how my business runs", primary: ["growthSuite", "businessScorecard"], matches: ["catalysts"] },
  { id: "advice", label: "Get expert advice", primary: ["advisorMarketplace"], matches: ["advisors"] },
  { id: "team", label: "Build my team", primary: ["internshipMarketplace"], matches: ["interns"] },
];

export default function OnboardingInterests() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetRoute = location.state?.targetRoute || "/profile";

  const [step, setStep] = useState("primary"); // "primary" | "fallback" | "matches"
  const [selectedPrimary, setSelectedPrimary] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) navigate("/auth", { replace: true });
  }, [navigate]);

  const togglePrimary = (id) => {
    setSelectedPrimary((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleMatch = (id) => {
    setSelectedMatches((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const goToMatches = () => {
    const suggested = new Set();
    selectedPrimary.forEach((id) => (SUGGESTED_MATCHES[id] || []).forEach((m) => suggested.add(m)));
    setSelectedMatches([...suggested]);
    setStep("matches");
  };

  const pickFallback = (option) => {
    setSelectedPrimary(option.primary);
    setSelectedMatches(option.matches);
    finish(option.primary, option.matches);
  };

  const finish = async (primary = selectedPrimary, matches = selectedMatches) => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await setDoc(
          doc(db, "users", uid),
          {
            onboardingQuestionnaireSeen: true,
            onboardingInterests: { primary, matches, completedAt: serverTimestamp() },
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Failed to save onboarding interests:", err);
    } finally {
      setSaving(false);
      navigate(targetRoute, { replace: true });
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        {step === "primary" && (
          <>
            <h2>What are you here for?</h2>
            <p className="onboarding-subtitle">Pick everything that applies — you can change this later.</p>
            <div className="onboarding-grid">
              {PRIMARY_INTERESTS.map((item) => {
                const isSelected = selectedPrimary.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`onboarding-card ${isSelected ? "selected" : ""}`}
                    onClick={() => togglePrimary(item.id)}
                  >
                    {isSelected && <CheckCircle2 className="onboarding-check" size={18} />}
                    <div className="onboarding-card-icon">{item.icon}</div>
                    <div className="onboarding-card-title">{item.title}</div>
                    <div className="onboarding-card-desc">{item.description}</div>
                  </button>
                );
              })}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-link" onClick={() => setStep("fallback")}>
                Not sure yet
              </button>
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={selectedPrimary.length === 0}
                onClick={goToMatches}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "fallback" && (
          <>
            <h2>What's the biggest priority for your business right now?</h2>
            <div className="onboarding-fallback-list">
              {FALLBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="onboarding-fallback-option"
                  disabled={saving}
                  onClick={() => pickFallback(opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button type="button" className="onboarding-link" onClick={() => setStep("primary")}>
              Back to the full list
            </button>
          </>
        )}

        {step === "matches" && (
          <>
            <h2>Who are you most interested in matching with?</h2>
            <p className="onboarding-subtitle">We've pre-selected a few based on what you picked — adjust as needed.</p>
            <div className="onboarding-grid onboarding-grid-compact">
              {MATCH_TYPES.map((item) => {
                const isSelected = selectedMatches.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`onboarding-card onboarding-card-compact ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleMatch(item.id)}
                  >
                    {isSelected && <CheckCircle2 className="onboarding-check" size={16} />}
                    <div className="onboarding-card-icon">{item.icon}</div>
                    <div className="onboarding-card-title">{item.title}</div>
                  </button>
                );
              })}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-link" onClick={() => setStep("primary")}>
                Back
              </button>
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={saving}
                onClick={() => finish()}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : "Finish"}
              </button>
            </div>
          </>
        )}

        <style>{`
          .onboarding-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #faf7f4; }
          .onboarding-box { width: 100%; max-width: 720px; background: #fff; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
          .onboarding-box h2 { margin: 0 0 8px; font-size: 1.4rem; color: #2b2320; }
          .onboarding-subtitle { color: #8a7b6f; margin: 0 0 24px; font-size: 0.9rem; }
          .onboarding-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
          .onboarding-grid-compact { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
          .onboarding-card { position: relative; text-align: left; border: 1.5px solid #e5ddd4; border-radius: 14px; padding: 16px; background: #fff; cursor: pointer; transition: border-color .15s, background .15s; }
          .onboarding-card:hover { border-color: #c8b6a6; }
          .onboarding-card.selected { border-color: #4a352f; background: #fdf8f4; }
          .onboarding-card-compact { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 14px 8px; }
          .onboarding-check { position: absolute; top: 10px; right: 10px; color: #4a352f; }
          .onboarding-card-icon { color: #4a352f; margin-bottom: 8px; }
          .onboarding-card-title { font-weight: 600; font-size: 0.92rem; color: #2b2320; margin-bottom: 4px; }
          .onboarding-card-desc { font-size: 0.8rem; color: #8a7b6f; }
          .onboarding-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }
          .onboarding-link { background: none; border: none; color: #8a7b6f; cursor: pointer; font-size: 0.85rem; text-decoration: underline; }
          .onboarding-primary-btn { background: #4a352f; color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; }
          .onboarding-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .onboarding-fallback-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
          .onboarding-fallback-option { text-align: left; border: 1.5px solid #e5ddd4; border-radius: 12px; padding: 14px 16px; background: #fff; cursor: pointer; font-size: 0.9rem; }
          .onboarding-fallback-option:hover { border-color: #c8b6a6; background: #fdf8f4; }
        `}</style>
      </div>
    </div>
  );
}