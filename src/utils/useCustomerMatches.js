import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const useCustomerMatches = (formData) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formData || !formData.requestOverview?.location) return;

    const fetchAndScore = async () => {
      const snapshot = await getDocs(collection(db, "productApplications"));
      const scored = [];

      snapshot.forEach(doc => {
        const customer = doc.data();
        const score = calculateMatchScore(customer, formData);

        console.log("Match score for", customer.contactSubmission?.businessName, score);
        scored.push({ id: doc.id, ...customer, matchPercentage: score });
      });

      scored.sort((a, b) => b.matchPercentage - a.matchPercentage);
      setMatches(scored);
      setLoading(false);
    };

    fetchAndScore();
  }, [formData]);

  return { matches, loading };
};

const calculateMatchScore = (customer, formData) => {
  let score = 0;

  const categoryMatch = customer.productsServices?.categories?.some(c =>
    formData.productsServices?.categories?.map(cat => cat.toLowerCase()).includes(c.toLowerCase())
  );

  const locationMatch = customer.requestOverview?.location?.toLowerCase().includes(
    formData.requestOverview?.location?.toLowerCase()
  );

  const customerBudgetMin = parseInt(customer.requestOverview?.minBudget || 0);
  const customerBudgetMax = parseInt(customer.requestOverview?.maxBudget || 0);
  const formMin = parseInt(formData.requestOverview?.minBudget || 0);
  const formMax = parseInt(formData.requestOverview?.maxBudget || 0);
  const budgetOverlap = formMax >= customerBudgetMin && formMin <= customerBudgetMax;

  const customerStartDate = new Date(customer.requestOverview?.startDate || "2000-01-01");
  const formStartDate = new Date(formData.requestOverview?.startDate || "2000-01-01");
  const startDateMatch = customerStartDate >= formStartDate;

  if (categoryMatch) score += 40;
  if (locationMatch) score += 20;
  if (budgetOverlap) score += 25;
  if (startDateMatch) score += 15;

  return score;
};
