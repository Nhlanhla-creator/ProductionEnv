// services/analysisCacheService.js

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Service for caching AI analyses in Firestore
 */
class AnalysisCacheService {
  
  /**
   * Generate a unique cache key for an analysis
   * @param {string} section - The dashboard section
   * @param {string} kpiKey - The specific KPI key
   * @param {Object} contextData - The context data that affects the analysis
   * @returns {string} Unique cache ID
   */
  static getCacheId(section, kpiKey, contextData = {}) {
    // Create a hash of relevant context data
    const relevantData = {
      section,
      kpiKey,
      kpiValue: contextData.kpiValue,
      budget: contextData.budget,
      target: contextData.target,
      timeRange: contextData.timeRange,
    };
    
    const contextString = JSON.stringify(relevantData);
    const hash = this.simpleHash(contextString);
    return `${section}_${kpiKey}_${hash}`;
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
   * Save analysis to Firestore
   */
  static async saveAnalysis(userId, section, kpiKey, analysisData, contextData = {}) {
    if (!userId) {
      console.error("No userId provided for saveAnalysis");
      return false;
    }
    
    try {
      const cacheId = this.getCacheId(section, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      // Fix: Use proper document reference
      const analysisRef = doc(db, `users/${userId}/cachedAnalyses`, cacheId);
      
      // Sanitize context data to remove undefined values
      const sanitizedContextData = {
        budget: contextData.budget ?? null,
        target: contextData.target ?? null,
        kpiValue: contextData.kpiValue ?? null,
        timeRange: contextData.timeRange ?? null,
        historicalValues: contextData.historicalValues ? JSON.parse(JSON.stringify(contextData.historicalValues)) : null,
        industryBenchmark: contextData.industryBenchmark ?? null,
      };
      
      // Remove any undefined values
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
      
      console.log(`✅ Analysis saved for ${section} - ${kpiKey}`);
      return true;
    } catch (error) {
      console.error("Error saving analysis to cache:", error);
      return false;
    }
  }
  
  /**
   * Load analysis from Firestore
   */
  static async loadAnalysis(userId, section, kpiKey, contextData = {}) {
    if (!userId) return null;
    
    try {
      const cacheId = this.getCacheId(section, kpiKey, { ...contextData, kpiValue: contextData.kpiValue });
      // Fix: Use proper document reference
      const analysisRef = doc(db, `users/${userId}/cachedAnalyses`, cacheId);
      const docSnap = await getDoc(analysisRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if analysis is expired
        if (new Date(data.expiresAt) > new Date()) {
          // Update last accessed timestamp
          await updateDoc(analysisRef, {
            lastAccessed: new Date().toISOString(),
          });
          
          console.log(`✅ Analysis loaded from cache for ${section} - ${kpiKey}`);
          return {
            ...data.analysis,
            cachedAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        } else {
          console.log(`⚠️ Cached analysis expired for ${section} - ${kpiKey}`);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error loading analysis from cache:", error);
      return null;
    }
  }
  
  /**
   * Load all analyses for a specific section
   */
  static async loadSectionAnalyses(userId, section) {
    if (!userId) return [];
    
    try {
      // Fix: Use proper collection reference
      const analysesRef = collection(db, `users/${userId}/cachedAnalyses`);
      const q = query(analysesRef, where("section", "==", section));
      const querySnapshot = await getDocs(q);
      
      const analyses = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (new Date(data.expiresAt) > new Date()) {
          analyses.push({
            id: doc.id,
            kpiKey: data.kpiKey,
            kpiValue: data.kpiValue,
            analysis: data.analysis,
            createdAt: data.createdAt,
          });
        }
      });
      
      console.log(`✅ Loaded ${analyses.length} analyses for section ${section}`);
      return analyses;
    } catch (error) {
      console.error("Error loading section analyses:", error);
      return [];
    }
  }
  
  /**
   * Delete an analysis from cache
   */
  static async deleteAnalysis(userId, cacheId) {
    if (!userId) return;
    
    try {
      const analysisRef = doc(db, `users/${userId}/cachedAnalyses`, cacheId);
      await deleteDoc(analysisRef);
      console.log(`✅ Analysis deleted: ${cacheId}`);
    } catch (error) {
      console.error("Error deleting analysis:", error);
    }
  }
  
  /**
   * Clear all expired analyses for a user
   */
  static async clearExpiredAnalyses(userId) {
    if (!userId) return;
    
    try {
      const analysesRef = collection(db, `users/${userId}/cachedAnalyses`);
      const querySnapshot = await getDocs(analysesRef);
      
      let deletedCount = 0;
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (new Date(data.expiresAt) <= new Date()) {
          await deleteDoc(doc.ref);
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleared ${deletedCount} expired analyses`);
    } catch (error) {
      console.error("Error clearing expired analyses:", error);
    }
  }
}

export default AnalysisCacheService;