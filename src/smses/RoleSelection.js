"use client";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase, Landmark, Users, Building2, GraduationCap, CheckCircle2,
} from "lucide-react";
import { savePreSignupRoleSelection } from "../utils/roleSelection";

// Step 1: which account type
const ROLES = [
  { id: "sme", title: "Business / SME", description: "I run a business and want funding, growth tools or compliance support.", icon: <Briefcase size={22} /> },
  { id: "funder", title: "Funder / Investor", description: "I deploy capital and want to source and evaluate deal flow.", icon: <Landmark size={22} /> },
  { id: "advisor", title: "Advisor", description: "I want to offer expert advisory services to businesses.", icon: <Users size={22} /> },
  { id: "corporate", title: "Corporate / Buyer", description: "I'm sourcing suppliers or vendors through procurement.", icon: <Building2 size={22} /> },
  { id: "intern", title: "Intern / Graduate", description: "I'm looking for placement opportunities with growing businesses.", icon: <GraduationCap size={22} /> },
];

// Step 2: role-specific priorities — what matters most right now.
// Tracked per role so the platform can weight what it shows first.
const PRIORITIES_BY_ROLE = {
  sme: [
    { id: "funding", label: "Get funding" },
    { id: "compliance", label: "Get compliance-ready" },
    { id: "growth", label: "Improve business performance" },
    { id: "procurement", label: "Find customers or suppliers" },
    { id: "advice", label: "Get expert advice" },
    { id: "talent", label: "Build my team" },
  ],
  funder: [
    { id: "sourceDeals", label: "Source new deal flow" },
    { id: "evaluateRisk", label: "Evaluate business risk faster" },
    { id: "sectorFocus", label: "Focus on specific sectors" },
    { id: "impact", label: "Track inclusion / impact outcomes" },
  ],
  advisor: [
    { id: "newClients", label: "Find new clients" },
    { id: "specialisation", label: "Work within my specialisation" },
    { id: "visibility", label: "Build my advisory profile" },
  ],
  corporate: [
    { id: "findSuppliers", label: "Find vetted suppliers" },
    { id: "diversitySourcing", label: "Meet enterprise & supplier development targets" },
    { id: "riskVetting", label: "Vet supplier compliance & risk" },
  ],
  intern: [
    { id: "placement", label: "Find a placement" },
    { id: "sector", label: "Work in a specific sector" },
    { id: "skills", label: "Build specific skills" },
  ],
};

export default function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetRoute = location.state?.targetRoute || "/auth";

  const [step, setStep] = useState("role"); // "role" | "priorities"
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPriorities, setSelectedPriorities] = useState([]);

  const pickRole = (id) => {
    setSelectedRole(id);
    setSelectedPriorities([]);
    setStep("priorities");
  };

  const togglePriority = (id) => {
    setSelectedPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const finish = () => {
    savePreSignupRoleSelection({ role: selectedRole, priorities: selectedPriorities });
    navigate(targetRoute, { state: { role: selectedRole } });
  };

  const priorityOptions = selectedRole ? PRIORITIES_BY_ROLE[selectedRole] : [];

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        {step === "role" && (
          <>
            <h2>What brings you to BIG?</h2>
            <p className="onboarding-subtitle">Pick the option that best describes you.</p>
            <div className="onboarding-grid">
              {ROLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="onboarding-card"
                  onClick={() => pickRole(item.id)}
                >
                  <div className="onboarding-card-icon">{item.icon}</div>
                  <div className="onboarding-card-title">{item.title}</div>
                  <div className="onboarding-card-desc">{item.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "priorities" && (
          <>
            <h2>What's your priority right now?</h2>
            <p className="onboarding-subtitle">Pick everything that applies — this helps us tailor what you see first.</p>
            <div className="onboarding-grid">
              {priorityOptions.map((item) => {
                const isSelected = selectedPriorities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`onboarding-card onboarding-card-compact ${isSelected ? "selected" : ""}`}
                    onClick={() => togglePriority(item.id)}
                  >
                    {isSelected && <CheckCircle2 className="onboarding-check" size={16} />}
                    <div className="onboarding-card-title">{item.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-link" onClick={() => setStep("role")}>
                Back
              </button>
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={selectedPriorities.length === 0}
                onClick={finish}
              >
                Continue to sign up
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
          .onboarding-card { position: relative; text-align: left; border: 1.5px solid #e5ddd4; border-radius: 14px; padding: 16px; background: #fff; cursor: pointer; transition: border-color .15s, background .15s; }
          .onboarding-card:hover { border-color: #c8b6a6; }
          .onboarding-card.selected { border-color: #4a352f; background: #fdf8f4; }
          .onboarding-card-compact { display: flex; align-items: center; text-align: left; gap: 8px; padding: 14px 16px; }
          .onboarding-check { position: absolute; top: 10px; right: 10px; color: #4a352f; }
          .onboarding-card-icon { color: #4a352f; margin-bottom: 8px; }
          .onboarding-card-title { font-weight: 600; font-size: 0.92rem; color: #2b2320; margin-bottom: 4px; }
          .onboarding-card-desc { font-size: 0.8rem; color: #8a7b6f; }
          .onboarding-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }
          .onboarding-link { background: none; border: none; color: #8a7b6f; cursor: pointer; font-size: 0.85rem; text-decoration: underline; }
          .onboarding-primary-btn { background: #4a352f; color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-size: 0.9rem; cursor: pointer; }
          .onboarding-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}