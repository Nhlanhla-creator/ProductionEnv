// services/peopleAnalysisCacheService.js

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
/**
 * Service for caching People Performance AI analyses in Firestore
 */
class PeopleAnalysisCacheService {
  
  static getCacheId(section, kpiKey, contextData = {}) {
    const relevantData = {
      section,
      kpiKey,
      kpiValue: contextData.kpiValue,
      timeRange: contextData.timeRange,
    };
    
    const contextString = JSON.stringify(relevantData);
    const hash = this.simpleHash(contextString);
    return `people_${section}_${kpiKey}_${hash}`;
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
  
  static async saveAnalysis(userId, section, kpiKey, analysisData, contextData = {}) {
    if (!userId) return false;
    
    try {
      const cacheId = this.getCacheId(section, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      const analysisRef = doc(db, `users/${userId}/peopleAnalyses`, cacheId);
      
      const sanitizedContextData = {
        kpiValue: contextData.kpiValue ?? null,
        timeRange: contextData.timeRange ?? null,
        benchmark: contextData.benchmark ?? null,
        currentValue: contextData.currentValue ?? null,
        budgetValue: contextData.budgetValue ?? null,
      };
      
      Object.keys(sanitizedContextData).forEach(key => {
        if (sanitizedContextData[key] === undefined) {
          delete sanitizedContextData[key];
        }
      });
      
      await setDoc(analysisRef, {
        section,
        kpiKey,
        kpiValue: contextData.kpiValue ?? null,
        contextData: sanitizedContextData,
        analysis: {
          overallAssessment: analysisData.overallAssessment ?? "",
          healthScore: analysisData.healthScore ?? 50,
          keyInsights: analysisData.keyInsights ?? [],
          recommendations: analysisData.recommendations ?? [],
          benchmarkComparison: analysisData.benchmarkComparison ?? {},
          fullResponse: analysisData.fullResponse || analysisData.analysisText || "",
        },
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        version: "1.0",
      });
      
      console.log(`✅ People analysis saved for ${section} - ${kpiKey}`);
      return true;
    } catch (error) {
      console.error("Error saving people analysis:", error);
      return false;
    }
  }
  
  static async loadAnalysis(userId, section, kpiKey, contextData = {}) {
    if (!userId) return null;
    
    try {
      const cacheId = this.getCacheId(section, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      const analysisRef = doc(db, `users/${userId}/peopleAnalyses`, cacheId);
      const docSnap = await getDoc(analysisRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (new Date(data.expiresAt) > new Date()) {
          await updateDoc(analysisRef, {
            lastAccessed: new Date().toISOString(),
          });
          
          console.log(`✅ People analysis loaded from cache for ${section} - ${kpiKey}`);
          return {
            ...data.analysis,
            cachedAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error loading people analysis:", error);
      return null;
    }
  }
}

export default PeopleAnalysisCacheService;