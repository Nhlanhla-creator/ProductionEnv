// services/riskAnalysisCacheService.js

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

class RiskAnalysisCacheService {
  
  static getCacheId(section, riskDataHash) {
    return `risk_${section}_${riskDataHash}`;
  }
  
  static generateRiskDataHash(riskData) {
    // Create a hash of the current risk data to detect changes
    const riskSummary = {
      totalRisks: Object.values(riskData).flat().length,
      categories: Object.keys(riskData).filter(cat => riskData[cat].length > 0),
      highRiskCount: this.countHighRisks(riskData),
    };
    return this.simpleHash(JSON.stringify(riskSummary));
  }
  
  static countHighRisks(riskData) {
    let count = 0;
    Object.values(riskData).forEach(risks => {
      risks.forEach(risk => {
        const riskScore = (risk.severity || 1) * (risk.likelihood || 1);
        if (riskScore >= 16) count++;
      });
    });
    return count;
  }
  
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  static async saveAnalysis(userId, section, analysisData, riskData) {
    if (!userId) return false;
    
    try {
      const riskDataHash = this.generateRiskDataHash(riskData);
      const cacheId = this.getCacheId(section, riskDataHash);
      const analysisRef = doc(db, `users/${userId}/riskAnalyses`, cacheId);
      
      await setDoc(analysisRef, {
        section,
        analysis: analysisData,
        riskDataHash,
        totalRisks: Object.values(riskData).flat().length,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        version: "1.0",
      });
      
      console.log(`✅ Risk analysis saved for ${section}`);
      return true;
    } catch (error) {
      console.error("Error saving risk analysis:", error);
      return false;
    }
  }
  
  static async loadAnalysis(userId, section, riskData) {
    if (!userId) return null;
    
    try {
      const riskDataHash = this.generateRiskDataHash(riskData);
      const cacheId = this.getCacheId(section, riskDataHash);
      const analysisRef = doc(db, `users/${userId}/riskAnalyses`, cacheId);
      const docSnap = await getDoc(analysisRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (new Date(data.expiresAt) > new Date()) {
          await updateDoc(analysisRef, {
            lastAccessed: new Date().toISOString(),
          });
          
          console.log(`✅ Risk analysis loaded from cache for ${section}`);
          return {
            analysis: data.analysis,
            cachedAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error loading risk analysis:", error);
      return null;
    }
  }
}

export default RiskAnalysisCacheService;