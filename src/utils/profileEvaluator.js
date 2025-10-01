import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const WEIGHTS = {
  seed: {
    leadership: 0.15,
    financialReadiness: 0.10,
    financialStrength: 0.05,
    operationalStrength: 0.15,
    guarantees: 0.10,
    impact: 0.10,
    governance: 0.15,
  },
  growth: {
    leadership: 0.10,
    financialReadiness: 0.15,
    financialStrength: 0.10,
    operationalStrength: 0.15,
    guarantees: 0.15,
    impact: 0.10,
    governance: 0.10,
  },
  maturity: {
    leadership: 0.05,
    financialReadiness: 0.20,
    financialStrength: 0.15,
    operationalStrength: 0.10,
    guarantees: 0.20,
    impact: 0.10,
    governance: 0.10,
  },
};

const scoreOutOfFive = (condition) => (condition ? 5 : 0);

export const evaluateProfile = async (userId) => {
  try {
    const profileRef = doc(db, "universalProfiles", userId);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) throw new Error("Profile not found");

    const data = profileSnap.data();
    const stage = (data?.applicationOverview?.fundingStage || "seed").toLowerCase();
    const weights = WEIGHTS[stage] || WEIGHTS.seed;

    // Manual scoring logic
    const leadership = scoreOutOfFive(
      data?.ownershipManagement?.directors?.length > 0 &&
      data?.enterpriseReadiness?.hasMentor === "yes"
    );

    const financialReadiness = scoreOutOfFive(
      data?.financialOverview?.financialStatements?.length > 0 &&
      data?.legalCompliance?.taxNumber &&
      data?.legalCompliance?.vatNumber
    );

    const financialStrength = scoreOutOfFive(
      data?.financialOverview?.profitabilityStatus === "profitable" &&
      parseFloat(data?.financialOverview?.annualRevenue || 0) > 0
    );

    const operationalStrength = scoreOutOfFive(
      data?.enterpriseReadiness?.hasMvp === "yes" &&
      data?.enterpriseReadiness?.hasTraction === "yes"
    );

    const guarantees = scoreOutOfFive(
      data?.financialOverview?.loanAgreements?.length > 0 ||
      data?.growthPotential?.supportLetters?.length > 0
    );

    const impact = scoreOutOfFive(
      parseInt(data?.socialImpact?.jobsToCreate || 0) > 0 &&
      parseInt(data?.socialImpact?.blackOwnership || 0) >= 50
    );

    const governance = scoreOutOfFive(
      data?.ownershipManagement?.shareholders?.length > 0 &&
      data?.ownershipManagement?.shareRegister?.length > 0
    );

    // Weighted total calculation
    const weightedScore = (
      leadership * weights.leadership +
      financialReadiness * weights.financialReadiness +
      financialStrength * weights.financialStrength +
      operationalStrength * weights.operationalStrength +
      guarantees * weights.guarantees +
      impact * weights.impact +
      governance * weights.governance
    );

    const roundedScore = Math.round(weightedScore * 20); // Convert to percentage (/5 * 100)

    await setDoc(doc(db, "profileEvaluations", userId), {
      fundabilityScore: roundedScore,
      evaluatedAt: serverTimestamp(),
      breakdown: {
        leadership,
        financialReadiness,
        financialStrength,
        operationalStrength,
        guarantees,
        impact,
        governance,
      },
    });

    return { score: roundedScore };
  } catch (error) {
    console.error("Manual Profile Evaluation Error:", error);
    throw error;
  }
};
