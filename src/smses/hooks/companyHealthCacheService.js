// services/companyHealthCacheService.js

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

class CompanyHealthCacheService {
  static getCacheId(dataHash) {
    return `company_health_${dataHash}`;
  }

  /**
   * Generate a lightweight hash from the health data snapshot so we can detect
   * when underlying data has changed and the cached analysis is stale.
   */
  static generateDataHash(healthSnapshot) {
    // healthSnapshot is whatever summary the caller passes in (counts, statuses, etc.)
    return this.simpleHash(JSON.stringify(healthSnapshot));
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

  /**
   * Persist the generated analysis to Firestore under
   *   users/{userId}/companyHealthAnalyses/{cacheId}
   *
   * @param {string}  userId        – authenticated user UID
   * @param {string}  analysisText  – plain-text AI response
   * @param {object}  healthSnapshot – lightweight data summary used to build the hash
   * @returns {Promise<boolean>}
   */
  static async saveAnalysis(userId, analysisText, healthSnapshot) {
    if (!userId) return false;

    try {
      const dataHash = this.generateDataHash(healthSnapshot);
      const cacheId = this.getCacheId(dataHash);
      const ref = doc(db, `users/${userId}/companyHealthAnalyses`, cacheId);

      await setDoc(ref, {
        analysis: analysisText,
        dataHash,
        healthSnapshot,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        // 30-day expiry – same as riskAnalysisCacheService
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        version: "1.0",
      });

      console.log("✅ Company health analysis saved");
      return true;
    } catch (error) {
      console.error("Error saving company health analysis:", error);
      return false;
    }
  }

  /**
   * Try to load a non-expired cached analysis whose hash matches the current
   * health snapshot.  Returns null on cache miss or expiry.
   *
   * @param {string}  userId        – authenticated user UID
   * @param {object}  healthSnapshot – lightweight data summary used to build the hash
   * @returns {Promise<{analysis: string, cachedAt: string, expiresAt: string}|null>}
   */
  static async loadAnalysis(userId, healthSnapshot) {
    if (!userId) return null;

    try {
      const dataHash = this.generateDataHash(healthSnapshot);
      const cacheId = this.getCacheId(dataHash);
      const ref = doc(db, `users/${userId}/companyHealthAnalyses`, cacheId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        if (new Date(data.expiresAt) > new Date()) {
          // Bump lastAccessed without awaiting – fire-and-forget
          updateDoc(ref, { lastAccessed: new Date().toISOString() }).catch(() => {});

          console.log("✅ Company health analysis loaded from cache");
          return {
            analysis: data.analysis,
            cachedAt: data.createdAt,
            expiresAt: data.expiresAt,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error loading company health analysis:", error);
      return null;
    }
  }

  /**
   * Save a "pinned" copy of the analysis to a separate notes collection so the
   * user can retrieve it independently of the expiry-based cache.
   * Mirrors the handleSaveToNotes pattern in RiskManagement.
   */
  static async saveToNotes(userId, analysisText, healthSnapshot) {
    if (!userId || !analysisText) return false;

    try {
      const noteId = `company_health_note_${Date.now()}`;
      const ref = doc(db, `users/${userId}/savedCompanyHealthAnalyses`, noteId);

      await setDoc(ref, {
        type: "company_health_analysis",
        analysis: analysisText,
        healthSnapshot,
        generatedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        notes: "",
      });

      console.log("✅ Company health analysis saved to notes");
      return true;
    } catch (error) {
      console.error("Error saving company health analysis to notes:", error);
      return false;
    }
  }
}

export default CompanyHealthCacheService;