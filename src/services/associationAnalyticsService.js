// src/services/associationAnalyticsService.js
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

/**
 * Service to fetch and aggregate analytics data for an Association
 * Shows data ONLY from entities (SMEs, Investors, Catalysts, Advisors)
 * that have selected this association
 */
class AssociationAnalyticsService {
  
  /**
   * Get the association name from the logged-in association profile
   */
  async getAssociationName() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not logged in');
    
    const profileDoc = await getDoc(doc(db, "universalProfiles", currentUser.uid));
    if (!profileDoc.exists()) throw new Error('Association profile not found');
    
    const assocName = profileDoc.data()?.entityOverview?.industryAssociation;
    if (!assocName) throw new Error('No industry association selected in profile');
    
    return assocName;
  }

  /**
   * Fetch all entities (SMEs, Investors, Catalysts, Advisors) that belong to this association
   */
  async fetchAllMatchingEntities(associationName) {
    const results = {
      smes: [],
      investors: [],
      catalysts: [],
      advisors: []
    };

    // 1. Fetch SMEs from universalProfiles
    try {
      const smeQuery = query(
        collection(db, "universalProfiles"),
        where("entityOverview.memberOfAssociation", "==", "yes")
      );
      const smeSnapshot = await getDocs(smeQuery);
      
      for (const docSnap of smeSnapshot.docs) {
        const data = docSnap.data();
        const industryAssociations = data.entityOverview?.industryAssociations || [];
        
        if (industryAssociations.includes(associationName)) {
          results.smes.push({
            id: docSnap.id,
            type: 'sme',
            ...data
          });
        }
      }
    } catch (err) {
      console.error('Error fetching SMEs:', err);
    }

    // 2. Fetch Investors from MyuniversalProfiles
    try {
      const investorQuery = query(
        collection(db, "MyuniversalProfiles"),
        where("fundManageOverview.memberOfAssociation", "==", "yes")
      );
      const investorSnapshot = await getDocs(investorQuery);
      
      for (const docSnap of investorSnapshot.docs) {
        const data = docSnap.data();
        const formData = data.formData || {};
        const fundManageOverview = formData.fundManageOverview || {};
        const industryAssociations = fundManageOverview.industryAssociations || [];
        
        if (industryAssociations.includes(associationName)) {
          results.investors.push({
            id: docSnap.id,
            type: 'investor',
            ...formData
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Investors:', err);
    }

    // 3. Fetch Catalysts from catalystProfiles
    try {
      const catalystSnapshot = await getDocs(collection(db, "catalystProfiles"));
      
      for (const docSnap of catalystSnapshot.docs) {
        const data = docSnap.data();
        const formData = data.formData || {};
        const entityOverview = formData.entityOverview || {};
        const industryAssociations = entityOverview.industryAssociations || [];
        
        if (entityOverview.memberOfAssociation === "yes" && industryAssociations.includes(associationName)) {
          results.catalysts.push({
            id: docSnap.id,
            type: 'catalyst',
            ...formData
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Catalysts:', err);
    }

    // 4. Fetch Advisors from advisorProfiles
    try {
      const advisorSnapshot = await getDocs(collection(db, "advisorProfiles"));
      
      for (const docSnap of advisorSnapshot.docs) {
        const data = docSnap.data();
        const formData = data.formData || {};
        const personalOverview = formData.personalProfessionalOverview || {};
        const industryAssociations = personalOverview.industryAssociations || [];
        
        if (personalOverview.memberOfAssociation === "yes" && industryAssociations.includes(associationName)) {
          results.advisors.push({
            id: docSnap.id,
            type: 'advisor',
            ...formData
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Advisors:', err);
    }

    return results;
  }

  /**
   * Get Sector/Industry Distribution for Donut Chart
   * Returns: { "Technology": 32, "Finance": 18, ... }
   */
  async getSectorDistribution(associationName) {
    const entities = await this.fetchAllMatchingEntities(associationName);
    const sectorCounts = {};

    const processSectors = (sectors) => {
      if (!sectors || !Array.isArray(sectors)) return;
      sectors.forEach(sector => {
        if (sector && sector !== "Not specified" && sector !== "") {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
      });
    };

    // SMEs: economicSectors array
    entities.smes.forEach(sme => {
      processSectors(sme.entityOverview?.economicSectors);
    });

    // Investors: industrySector (string) - convert to array
    entities.investors.forEach(investor => {
      const sector = investor.fundManageOverview?.industrySector;
      if (sector && sector !== "Not specified") {
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      }
    });

    // Catalysts: sectorFocus array
    entities.catalysts.forEach(catalyst => {
      processSectors(catalyst.programBriefMatchingPreference?.sectorFocus);
    });

    // Advisors: industryExperience array
    entities.advisors.forEach(advisor => {
      processSectors(advisor.personalProfessionalOverview?.industryExperience);
    });

    return sectorCounts;
  }

  /**
   * Get Geographic Distribution for Donut Chart
   * Returns: { "Gauteng": 45, "Western Cape": 25, ... }
   */
  async getGeographicDistribution(associationName) {
    const entities = await this.fetchAllMatchingEntities(associationName);
    const geoCounts = {};

    const processLocations = (locations) => {
      if (!locations || !Array.isArray(locations)) return;
      locations.forEach(loc => {
        if (loc && loc !== "Not specified" && loc !== "") {
          geoCounts[loc] = (geoCounts[loc] || 0) + 1;
        }
      });
    };

    // SMEs: operatingCountries and operatingProvinces
    entities.smes.forEach(sme => {
      processLocations(sme.entityOverview?.operatingCountries);
      processLocations(sme.entityOverview?.operatingProvinces);
    });

    // Investors: geographicFocus and selectedCountries
    entities.investors.forEach(investor => {
      processLocations(investor.generalInvestmentPreference?.geographicFocus);
      processLocations(investor.generalInvestmentPreference?.selectedCountries);
    });

    // Catalysts: geographicFocus and selectedCountries
    entities.catalysts.forEach(catalyst => {
      processLocations(catalyst.programBriefMatchingPreference?.geographicFocus);
      processLocations(catalyst.programBriefMatchingPreference?.selectedCountries);
    });

    // Advisors: regionFamiliarity
    entities.advisors.forEach(advisor => {
      processLocations(advisor.personalProfessionalOverview?.regionFamiliarity);
    });

    return geoCounts;
  }

  /**
   * Get Business Stage Distribution for Donut Chart
   * Returns: { "Startup": 35, "Growth": 40, "Scaling": 15, ... }
   */
  async getStageDistribution(associationName) {
    const entities = await this.fetchAllMatchingEntities(associationName);
    const stageCounts = {};

    // SMEs: operationStage
    entities.smes.forEach(sme => {
      const stage = sme.entityOverview?.operationStage;
      if (stage && stage !== "") {
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }
    });

    // Investors: investmentStage array
    entities.investors.forEach(investor => {
      const stages = investor.generalInvestmentPreference?.investmentStage || [];
      stages.forEach(stage => {
        if (stage && stage !== "") {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });
    });

    // Catalysts: targetBusinessStage array
    entities.catalysts.forEach(catalyst => {
      const stages = catalyst.programBriefMatchingPreference?.targetBusinessStage || [];
      stages.forEach(stage => {
        if (stage && stage !== "") {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });
    });

    // Advisors: smeStageFit array
    entities.advisors.forEach(advisor => {
      const stages = advisor.selectionCriteria?.smeStageFit || [];
      stages.forEach(stage => {
        if (stage && stage !== "") {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });
    });

    return stageCounts;
  }

  /**
   * Get Entity Size Distribution for Donut Chart
   * Returns: { "Micro": 25, "Small": 45, "Medium": 20, "Large": 10 }
   */
  async getSizeDistribution(associationName) {
    const entities = await this.fetchAllMatchingEntities(associationName);
    const sizeCounts = {};

    // SMEs: entitySize
    entities.smes.forEach(sme => {
      const size = sme.entityOverview?.entitySize;
      if (size && size !== "") {
        sizeCounts[size] = (sizeCounts[size] || 0) + 1;
      }
    });

    // Investors: firmType
    entities.investors.forEach(investor => {
      const size = investor.fundManageOverview?.firmType;
      if (size && size !== "") {
        sizeCounts[size] = (sizeCounts[size] || 0) + 1;
      }
    });

    // Catalysts: companySize
    entities.catalysts.forEach(catalyst => {
      const size = catalyst.entityOverview?.companySize;
      if (size && size !== "") {
        sizeCounts[size] = (sizeCounts[size] || 0) + 1;
      }
    });

    return sizeCounts;
  }

  /**
   * Get Funding/Financial Status Distribution
   * Returns: { "Seeking Funding": 60, "Not Seeking": 40 }
   */
  async getFundingStatusDistribution(associationName) {
    const entities = await this.fetchAllMatchingEntities(associationName);
    let seeking = 0;
    let notSeeking = 0;

    // SMEs: seekingFunding
    entities.smes.forEach(sme => {
      if (sme.financialOverview?.seekingFunding === "yes") {
        seeking++;
      } else if (sme.financialOverview?.seekingFunding === "no") {
        notSeeking++;
      }
    });

    // Investors: always seeking (they are funders)
    entities.investors.forEach(() => {
      seeking++;
    });

    // Catalysts: have support tickets (they provide funding/support)
    entities.catalysts.forEach(catalyst => {
      const minTicket = catalyst.programBriefMatchingPreference?.minimumSupportTicket;
      if (minTicket && parseInt(minTicket) > 0) {
        seeking++;
      } else {
        notSeeking++;
      }
    });

    // Advisors: not applicable (they provide advice, not funding)
    // Advisors are not counted in funding status

    return { seeking, notSeeking };
  }

  /**
   * Get all analytics data in one call for the charts
   */
  async getAllAnalytics() {
    const associationName = await this.getAssociationName();
    
    const [
      sectorDistribution,
      geographicDistribution,
      stageDistribution,
      sizeDistribution,
      fundingStatus
    ] = await Promise.all([
      this.getSectorDistribution(associationName),
      this.getGeographicDistribution(associationName),
      this.getStageDistribution(associationName),
      this.getSizeDistribution(associationName),
      this.getFundingStatusDistribution(associationName)
    ]);

    return {
      associationName,
      sectorDistribution,
      geographicDistribution,
      stageDistribution,
      sizeDistribution,
      fundingStatus,
      // For Capital Flow charts (mock data structure - replace with real aggregations)
      capitalFlow: {
        fundraising: {
          avgFundSize: { current: 45, yoyGrowth: 12.5 },
          fundsVsDeployed: {
            years: ["2022", "2023", "2024", "2025"],
            raised: [240, 280, 320, 360],
            requested: [300, 350, 400, 450],
            deployed: [280, 310, 385, 410]
          },
          sources: {
            "Entities/Individuals": 35,
            Corporates: 28,
            DFIs: 22,
            "Fund of Funds": 15
          },
          purposes: {
            "Own ring-fenced": 40,
            "Own balance sheet": 25,
            "Deal by deal": 35
          },
          rejection: {
            totalReviewed: 520,
            totalRejected: 312,
            rejectionRate: 60,
            topReasons: {
              "Poor financials": 38,
              "Weak team": 25,
              "Market too small": 18,
              "No traction": 12,
              Other: 7
            }
          }
        },
        marketStructure: {
          whereCapitalGoes: {
            sector: {
              allocation: sectorDistribution,
              distribution: sectorDistribution
            },
            geo: {
              allocation: geographicDistribution,
              distribution: geographicDistribution
            },
            stage: {
              allocation: stageDistribution,
              distribution: stageDistribution
            }
          }
        }
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get raw entity data for custom filtering
   */
  async getRawEntities(associationName) {
    return await this.fetchAllMatchingEntities(associationName);
  }
}

export default new AssociationAnalyticsService();