// services/esgAnalysisCacheService.js

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Service for caching ESG AI analyses in Firestore
 */
class ESGAnalysisCacheService {
  
  /**
   * Generate a unique cache key for an analysis
   */
  static getCacheId(section, subSection, kpiKey, contextData = {}) {
    const relevantData = {
      section,
      subSection,
      kpiKey,
      kpiValue: contextData.kpiValue,
      timeRange: contextData.timeRange,
    };
    
    const contextString = JSON.stringify(relevantData);
    const hash = this.simpleHash(contextString);
    return `${section}_${subSection}_${kpiKey}_${hash}`;
  }
  
  /**
   * Simple hash function for cache keys
   */
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Save ESG analysis to Firestore
   */
  static async saveAnalysis(userId, section, subSection, kpiKey, analysisData, contextData = {}) {
    if (!userId) return false;
    
    try {
      const cacheId = this.getCacheId(section, subSection, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      const analysisRef = doc(db, `users/${userId}/esgAnalyses`, cacheId);
      
      const sanitizedContextData = {
        kpiValue: contextData.kpiValue ?? null,
        timeRange: contextData.timeRange ?? null,
        benchmark: contextData.benchmark ?? null,
      };
      
      Object.keys(sanitizedContextData).forEach(key => {
        if (sanitizedContextData[key] === undefined) {
          delete sanitizedContextData[key];
        }
      });
      
      await setDoc(analysisRef, {
        section,
        subSection,
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
      
      console.log(`✅ ESG analysis saved for ${section}/${subSection} - ${kpiKey}`);
      return true;
    } catch (error) {
      console.error("Error saving ESG analysis:", error);
      return false;
    }
  }
  
  /**
   * Load ESG analysis from Firestore
   */
  static async loadAnalysis(userId, section, subSection, kpiKey, contextData = {}) {
    if (!userId) return null;
    
    try {
      const cacheId = this.getCacheId(section, subSection, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      const analysisRef = doc(db, `users/${userId}/esgAnalyses`, cacheId);
      const docSnap = await getDoc(analysisRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (new Date(data.expiresAt) > new Date()) {
          await updateDoc(analysisRef, {
            lastAccessed: new Date().toISOString(),
          });
          
          console.log(`✅ ESG analysis loaded from cache for ${section}/${subSection} - ${kpiKey}`);
          return {
            ...data.analysis,
            cachedAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error loading ESG analysis:", error);
      return null;
    }
  }
  
  /**
   * Delete an analysis from cache
   */
  static async deleteAnalysis(userId, cacheId) {
    if (!userId) return;
    
    try {
      const analysisRef = doc(db, `users/${userId}/esgAnalyses`, cacheId);
      await deleteDoc(analysisRef);
      console.log(`✅ ESG analysis deleted: ${cacheId}`);
    } catch (error) {
      console.error("Error deleting ESG analysis:", error);
    }
  }
}

export default ESGAnalysisCacheService;