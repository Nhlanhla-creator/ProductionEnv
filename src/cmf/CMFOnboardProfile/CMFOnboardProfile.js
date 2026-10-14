"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import "../../smses/UniversalProfile/UniversalProfile.css"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ChevronLeft, ChevronRight, Save, Trash2, CheckCircle, Info,
  AlertCircle, ShieldCheck, Building2, User, Globe, FileText,
  MapPin, Check, Plus, Loader2, Settings, QrCode
} from "lucide-react"

// Firebase
import { firebaseConfig } from "../../firebaseConfig"
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword as createUserAuth, signInWithEmailAndPassword } from "firebase/auth"
import { initializeApp, deleteApp, getApp } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Business Subcomponents
import Instructions from "../../smses/UniversalProfile/instructions"
import EntityOverview from "../../smses/UniversalProfile/entity-overview"
import OwnershipManagement from "../../smses/UniversalProfile/ownership-management"
import ContactDetails from "../../smses/UniversalProfile/contact-details"
import LegalCompliance from "../../smses/UniversalProfile/legal-compliance"
import ProductsServices from "../../smses/UniversalProfile/products-services"
import FinancialOverview from "../../smses/UniversalProfile/FinancialOverview"
import OperationsOverview from "../../smses/UniversalProfile/OperationsOverview"
import Governance from "../../smses/UniversalProfile/governance"
import HowDidYouHear from "../../smses/UniversalProfile/how-did-you-hear"
import Documents from "../../smses/UniversalProfile/Documents"
import DeclarationConsent from "../../smses/UniversalProfile/declaration-consent"

// Funder Subcomponents
import FunderInstructions from "../../Investor/InvestorUniversalProfile/Instructions"
import FunderEntityOverview from "../../Investor/InvestorUniversalProfile/FundManageOverview"
import FunderContactDetails from "../../Investor/InvestorUniversalProfile/ContactDetails"
import FunderInvestmentRequirements from "../../Investor/InvestorUniversalProfile/InvestmentRequirements"
import FunderGeneralInvestmentPreference from "../../Investor/InvestorUniversalProfile/GeneralInvestmentPreference​"
import FunderFundDetails from "../../Investor/InvestorUniversalProfile/FundDetails​"
import FunderApplicationBrief from "../../Investor/InvestorUniversalProfile/ApplicationBrief​"
import FunderDocumentUpload from "../../Investor/InvestorUniversalProfile/DocumentUpload"
import FunderDeclarationConsent from "../../Investor/InvestorUniversalProfile/DeclarationConsent"

// Catalyst Subcomponents
import CatalystInstructions from "../../catalyst/CatalystUniversalProfile/catalyst-instructions"
import CatalystEntityOverview from "../../catalyst/CatalystUniversalProfile/catalyst-entity-overview"
import CatalystContactDetails from "../../catalyst/CatalystUniversalProfile/catalyst-contact-details"
import CatalystProgramBriefMatchingPreference from "../../catalyst/CatalystUniversalProfile/CatalystProgramBriefMatchingPreference"
import CatalystApplicationBrief from "../../catalyst/CatalystUniversalProfile/catalyst-application-brief"
import CatalystDocumentUpload from "../../catalyst/CatalystUniversalProfile/catalyst-document-upload"
import CatalystDeclarationConsent from "../../catalyst/CatalystUniversalProfile/catalyst-declaration-consent"

// CMF Subcomponents & Centralized Config
import {
  CMF_SECTIONS,
  sectionValidations as cmfSectionValidations,
  getDefaultCMFFormData
} from "../cmfProfileConfig"
import CmfInstructions from "../CMFUniversalProfile/sections/CMFInstructions"
import CmfEntityOverview from "../CMFUniversalProfile/sections/CMFEntityOverview"
import CmfServicesSupport from "../CMFUniversalProfile/sections/CMFServicesSupport"
import CmfSmeFocusMatching from "../CMFUniversalProfile/sections/CMFSMEFocusMatching"
import CmfExperienceNetworks from "../CMFUniversalProfile/sections/CMFExperienceNetworks"
import CmfFeesEngagement from "../CMFUniversalProfile/sections/CMFFeesEngagement"
import CmfLegalVerification from "../CMFUniversalProfile/sections/CMFLegalVerification"
import CmfContactDetails from "../CMFUniversalProfile/sections/CMFContactDetails"
import CmfDeclarationConsent from "../CMFUniversalProfile/sections/CMFDeclarationConsent"

// --- DEVELOPER EASTER EGG MOCK ACCOUNTS DATA ---
const mockBusinesses = [
  {
    entityOverview: {
      entityType: "SME",
      registeredName: "Apex Innovations Ltd",
      tradingName: "Apex Solutions",
      registrationNumber: "2023/123456/07",
      legalStructure: "(pty) Ltd",
      entitySize: "Medium",
      financialYearEnd: "2024-02",
      yearsInOperation: "3",
      operationStage: "Growth",
      economicSectors: ["Information Technology (IT)", "Consulting"],
      operatingCountries: ["South Africa"],
      operatingProvinces: ["Gauteng"],
      businessDescription: "Apex Innovations provides cloud-native solutions and IT consulting services to clients across Sub-Saharan Africa.",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      contactTitle: "mr",
      contactName: "Thabo Mokoena",
      position: "Director",
      businessPhone: "+27115551234",
      mobile: "+27825556789",
      email: "thabo.test.apex@mailinator.com",
      physicalAddress: "123 Main Road, Sandton, Johannesburg, 2196",
      sameAsPhysical: true,
      postalAddress: "123 Main Road, Sandton, Johannesburg, 2196"
    },
    ownershipManagement: {
      shareholders: [
        { name: "Thabo Mokoena", country: "South Africa", shareholding: "60", race: "African", gender: "Male", isYouth: true },
        { name: "Naledi Dlamini", country: "South Africa", shareholding: "40", race: "African", gender: "Female", isYouth: true }
      ],
      directors: [
        { name: "Thabo Mokoena", roles: ["Director"], nationality: "South African", execType: "Executive", race: "African", gender: "Male" }
      ],
      executives: [
        { name: "Thabo Mokoena", position: "CEO", department: "Executive", nationality: "South African", race: "African", gender: "Male" }
      ],
      employees: [
        { name: "John Doe", qualification: "BSc Computer Science", role: "Software Engineer" }
      ],
      totalAuthorisedShares: "1000",
      totalIssuedShares: "100",
      permanentEmployees: "12",
      contractEmployees: "4",
      internshipEmployees: "2",
      temporaryEmployees: "1",
      businessLeadership: { ownerLed: "yes", primaryMotivation: "Growth", growthAmbition: "High", founderFullTime: "yes" }
    },
    legalCompliance: {
      taxNumber: "9876543210",
      taxClearancePin: "0000000000000",
      vatNumber: "4012345678",
      bbbeeLevel: "1",
      payeNumber: "123456789",
      uifStatus: "Registered",
      uifNumber: "U12345678",
      coidaNumber: "C1234567",
      pendingLegalJudgments: "no"
    },
    operationsOverview: {
      multipleSuppliers: "yes",
      contingencyPlan: "yes",
      trackPerformanceMetrics: "yes",
      threeSuccessfulDeliveries: "yes",
      hasCapacityToIncrease: "yes",
      hasFormalProcedures: "yes",
      hasMajorIncidents: "no"
    },
    financialOverview: {
      annualRevenue: "R 5,000,000",
      profitable: "yes",
      fundingRequired: "yes",
      fundingAmount: "R 2,000,000"
    },
    governance: {
      boardOfDirectors: "yes",
      hasAuditCommittee: "yes",
      hasRiskCommittee: "yes"
    },
    productsServices: {
      offeringType: "services",
      productCategories: [],
      serviceCategories: ["Software Development", "IT Consulting"],
      deliveryModes: ["Remote", "On-site"],
      minLeadTime: "7",
      minLeadTimeUnit: "days",
      targetMarket: "Corporate Clients",
      keyClients: ["Standard Bank", "MTN"],
      offerings: [
        {
          id: "biz_offering_1",
          offeringType: "Service",
          taxonomyLeafId: "technical-maintenance-services__electrical-maintenance__0",
          breadcrumb: "Professional & Specialist Services > IT Consulting",
          customCategoryRequest: "Enterprise Cloud & Software Solutions",
          name: "Enterprise Cloud & Software Solutions",
          description: "Full-stack cloud application development, architecture design, and enterprise IT modernization services.",
          isPrimary: true,
          deliveryRole: ["Professional or specialist team"],
          commercialPattern: ["Custom or project-based", "Recurring service contract"],
          deliveryStandard: "Virtual",
          minLeadTime: "7",
          minLeadTimeUnit: "Business days",
          maxLeadTime: "30",
          maxLeadTimeUnit: "Business days",
          dependsOnScope: false,
          scopeExplanation: "",
          geographicCoverage: ["National"],
          industries: ["Information & communications technology", "Financial & insurance services"],
          industryApplications: [],
          collapsed: false
        }
      ]
    },
    howDidYouHear: {
      source: "Online search"
    },
    documentsPlaceholder: {
      cipcRegistration: [{ name: "cipc.pdf", type: "application/pdf" }],
      taxCompliancePin: [{ name: "tax.pdf", type: "application/pdf" }],
      companyProfile: [{ name: "profile.pdf", type: "application/pdf" }],
      logo: [{ name: "logo.png", type: "image/png" }],
      proofOfAddress: [{ name: "proof.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "cmf_agreement.pdf", type: "application/pdf" }
    }
  },
  {
    entityOverview: {
      entityType: "SME",
      registeredName: "Blue Ocean Logistics Pty Ltd",
      tradingName: "Blue Ocean Logistics",
      registrationNumber: "2019/654321/07",
      legalStructure: "(pty) Ltd",
      entitySize: "Large",
      financialYearEnd: "2024-02",
      yearsInOperation: "7",
      operationStage: "Growth",
      economicSectors: ["Transport", "Logistics / Supply Chain"],
      operatingCountries: ["South Africa"],
      operatingProvinces: ["Western Cape"],
      businessDescription: "Blue Ocean Logistics specializes in national freight transport and warehousing services.",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      contactTitle: "ms",
      contactName: "Sarah Jenkins",
      position: "Managing Director",
      businessPhone: "+27215559876",
      mobile: "+27715554321",
      email: "sarah.test.blueocean@mailinator.com",
      physicalAddress: "45 Harbour View Drive, Cape Town, 8001",
      sameAsPhysical: true,
      postalAddress: "45 Harbour View Drive, Cape Town, 8001"
    },
    ownershipManagement: {
      shareholders: [
        { name: "Sarah Jenkins", country: "South Africa", shareholding: "60", race: "Coloured", gender: "Female" },
        { name: "Global Transport Ltd", country: "United Kingdom", shareholding: "40", race: "N/A", gender: "N/A" }
      ],
      directors: [
        { name: "Sarah Jenkins", roles: ["Director"], nationality: "South African", execType: "Executive", race: "Coloured", gender: "Female" }
      ],
      executives: [
        { name: "Sarah Jenkins", position: "Managing Director", department: "Executive", nationality: "South African", race: "Coloured", gender: "Female" }
      ],
      employees: [
        { name: "Peter Parker", qualification: "Diploma in Logistics", role: "Fleet Manager" }
      ],
      totalAuthorisedShares: "5000",
      totalIssuedShares: "1000",
      permanentEmployees: "45",
      contractEmployees: "15",
      internshipEmployees: "0",
      temporaryEmployees: "5",
      businessLeadership: { ownerLed: "yes", primaryMotivation: "Growth", growthAmbition: "High", founderFullTime: "yes" }
    },
    legalCompliance: {
      taxNumber: "9123456780",
      taxClearancePin: "0000000000000",
      vatNumber: "4987654321",
      bbbeeLevel: "2",
      payeNumber: "987654321",
      uifStatus: "Registered",
      uifNumber: "U98765432",
      coidaNumber: "C9876543",
      pendingLegalJudgments: "no"
    },
    operationsOverview: {
      multipleSuppliers: "yes",
      contingencyPlan: "yes",
      trackPerformanceMetrics: "yes",
      threeSuccessfulDeliveries: "yes",
      hasCapacityToIncrease: "yes",
      hasFormalProcedures: "yes",
      hasMajorIncidents: "no"
    },
    financialOverview: {
      annualRevenue: "R 25,000,000",
      profitable: "yes",
      fundingRequired: "no"
    },
    governance: {
      boardOfDirectors: "yes",
      hasAuditCommittee: "no",
      hasRiskCommittee: "yes"
    },
    productsServices: {
      offeringType: "services",
      productCategories: [],
      serviceCategories: ["Road Freight", "Warehousing"],
      deliveryModes: ["Physical Delivery"],
      minLeadTime: "24",
      minLeadTimeUnit: "hours",
      targetMarket: "Manufacturers and Retailers",
      keyClients: ["Shoprite", "Woolworths"],
      offerings: [
        {
          id: "biz_offering_2",
          offeringType: "Service",
          taxonomyLeafId: "facilities-site-services__cleaning-services__0",
          breadcrumb: "Logistics & Transport > Freight Transport",
          customCategoryRequest: "National Freight Transport & Warehousing",
          name: "National Freight Transport & Warehousing",
          description: "Blue Ocean Logistics specializes in national temperature-controlled freight transport, distribution, and warehousing services.",
          isPrimary: true,
          deliveryRole: ["Mobile field-service team"],
          commercialPattern: ["Call-off / purchase order", "Recurring service contract"],
          deliveryStandard: "Customer site",
          minLeadTime: "24",
          minLeadTimeUnit: "Hours",
          maxLeadTime: "48",
          maxLeadTimeUnit: "Hours",
          dependsOnScope: false,
          scopeExplanation: "",
          geographicCoverage: ["National"],
          industries: ["Transport, logistics & warehousing", "Retail & wholesale"],
          industryApplications: [],
          collapsed: false
        }
      ]
    },
    howDidYouHear: {
      source: "Online search"
    },
    documentsPlaceholder: {
      cipcRegistration: [{ name: "cipc.pdf", type: "application/pdf" }],
      taxCompliancePin: [{ name: "tax.pdf", type: "application/pdf" }],
      companyProfile: [{ name: "profile.pdf", type: "application/pdf" }],
      logo: [{ name: "logo.png", type: "image/png" }],
      proofOfAddress: [{ name: "proof.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "cmf_agreement.pdf", type: "application/pdf" }
    }
  }
]

const mockFunders = [
  {
    fundManageOverview: {
      registeredName: "Vanguard Capital Partners",
      tradingName: "Vanguard Capital",
      registrationNumber: "2018/987654/07",
      financialYearStart: "March",
      regulatoryLicenseNumber: "FSP 998877",
      legalEntityType: "Private Company (Pty Ltd)",
      firmType: "Venture Capital (VC)",
      firmSubtype: ["Early Stage"],
      investorRole: "Lead Investor",
      yearsInOperation: "8",
      numberOfInvestmentExecutives: "5",
      taxNumber: "9000111222",
      vatRegistrationNumbers: "4000111222",
      briefDescription: "Vanguard Capital focuses on early stage technology startups in Southern Africa.",
      portfolioCompanies: "12",
      numberOfInvestments: "15",
      valueDeployed: "R 50,000,000",
      additionalSupport: ["Governance Support", "Network Access"],
      howDidYouHear: "Referral",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      businessTel: "+27112223333",
      businessEmail: "vanguard@mailinator.com",
      physicalAddress: "15 Melrose Boulevard, Melrose Arch, Johannesburg, 2076",
      postalAddress: "15 Melrose Boulevard, Melrose Arch, Johannesburg, 2076",
      primaryContactTitle: "mr",
      primaryContactName: "David",
      primaryContactSurname: "Kramer",
      primaryContactPosition: "Investment Director",
      primaryContactMobile: "+27821112222",
      primaryContactEmail: "david.kramer.vanguard@mailinator.com"
    },
    investmentRequirements: {
      selectedStage: "growth",
      scores: {
        registrationCertificate: 80,
        taxClearance: 90,
        bbbeeCertificate: 75,
        professionalWebsite: 85,
        businessEmail: 90,
        companyLogo: 80,
        boardGovernance: 70,
        financialStatements: 85,
        auditedAccounts: 80
      }
    },
    generalInvestmentPreference: {
      minimumSupportTicket: "R 1,000,000",
      maximumSupportTicket: "R 10,000,000",
      sectorFocus: ["Technology", "Fintech", "Logistics"],
      geographicFocus: ["South Africa"],
      selectedProvinces: ["Gauteng", "Western Cape"],
      legalEntity: ["Pty Ltd"],
      businessLifecycleStage: ["Early Stage", "Growth Stage"],
      ticketSize: "R 5,000,000"
    },
    fundDetails: {
      funds: [
        {
          name: "Vanguard Tech Growth Fund I",
          size: "R 250,000,000",
          targetInvestorType: "Institutional Limited Partner (LPs)",
          captiveFund: false,
          lpComposition: "DFIs and Private Foundations",
          fundStructure: "Closed-end",
          fundLegalStructure: "Corporate (Pty Ltd)",
          fundSizeCategory: "Small",
          averageDealSize: "R 5,000,000",
          minimumTicket: "R 1,000,000",
          maximumTicket: "R 10,000,000",
          reservesForFollowOn: true,
          followOnPercentage: "30%",
          proRataRights: true,
          revenueThreshold: "5m-20m"
        }
      ]
    },
    applicationBrief: {
      overviewObjectives: "We fund high-potential African startups and growth-stage technology ventures with proven market traction.",
      coreDocuments: ["pitch_deck", "financials", "business_plan", "compliance_cert"],
      conditionalDocuments: ["bank_statements", "cap_table"]
    },
    documentUploadPlaceholder: {
      registrationDocs: [{ name: "vanguard_registration.pdf", type: "application/pdf" }],
      idOffund: [{ name: "fund_director_id.pdf", type: "application/pdf" }],
      fundMandate: [{ name: "vanguard_investment_mandate.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "funder_agreement.pdf", type: "application/pdf" }
    }
  },
  {
    fundManageOverview: {
      registeredName: "Apex Horizon Impact Fund",
      tradingName: "Apex Horizon Capital",
      registrationNumber: "2020/432109/07",
      financialYearStart: "January",
      regulatoryLicenseNumber: "FSP 887766",
      legalEntityType: "Private Company (Pty Ltd)",
      firmType: "Corporate Venture Capital (CVC)",
      firmSubtype: ["Growth Stage"],
      investorRole: "Co-investor",
      yearsInOperation: "5",
      numberOfInvestmentExecutives: "4",
      taxNumber: "9111222333",
      vatRegistrationNumbers: "4111222333",
      briefDescription: "Apex Horizon Capital finances sustainable African enterprises across agriculture, green energy, and logistics.",
      portfolioCompanies: "18",
      numberOfInvestments: "22",
      valueDeployed: "R 75,000,000",
      additionalSupport: ["Governance Support", "Network Access"],
      howDidYouHear: "Referral",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      businessTel: "+27214445555",
      businessEmail: "apex@mailinator.com",
      physicalAddress: "100 Bree Street, Cape Town, 8001",
      postalAddress: "100 Bree Street, Cape Town, 8001",
      primaryContactTitle: "ms",
      primaryContactName: "Nomsa",
      primaryContactSurname: "Dlamini",
      primaryContactPosition: "Managing Partner",
      primaryContactMobile: "+27834445555",
      primaryContactEmail: "nomsa.dlamini.apex@mailinator.com"
    },
    investmentRequirements: {
      selectedStage: "scale-up",
      scores: {
        registrationCertificate: 90,
        taxClearance: 95,
        bbbeeCertificate: 85,
        professionalWebsite: 90,
        businessEmail: 95,
        companyLogo: 85,
        boardGovernance: 80,
        financialStatements: 90,
        auditedAccounts: 85
      }
    },
    generalInvestmentPreference: {
      minimumSupportTicket: "R 2,000,000",
      maximumSupportTicket: "R 15,000,000",
      sectorFocus: ["Agriculture", "Manufacturing", "Green Energy"],
      geographicFocus: ["South Africa"],
      selectedProvinces: ["Western Cape", "Gauteng", "KwaZulu-Natal"],
      legalEntity: ["Pty Ltd"],
      businessLifecycleStage: ["Growth Stage", "Scale-up"],
      ticketSize: "R 7,500,000"
    },
    fundDetails: {
      funds: [
        {
          name: "Apex Green Impact Fund II",
          size: "R 400,000,000",
          targetInvestorType: "Mixed",
          captiveFund: false,
          lpComposition: "Commercial Banks and Impact Investors",
          fundStructure: "Closed-end",
          fundLegalStructure: "Corporate (Pty Ltd)",
          fundSizeCategory: "Small",
          averageDealSize: "R 7,500,000",
          minimumTicket: "R 2,000,000",
          maximumTicket: "R 15,000,000",
          reservesForFollowOn: true,
          followOnPercentage: "25%",
          proRataRights: true,
          revenueThreshold: "20m-50m"
        }
      ]
    },
    applicationBrief: {
      overviewObjectives: "We accelerate revenue-generating African businesses delivering both strong commercial returns and social/environmental impact.",
      coreDocuments: ["pitch_deck", "financials", "business_plan", "compliance_cert"],
      conditionalDocuments: ["bank_statements", "cap_table"]
    },
    documentUploadPlaceholder: {
      registrationDocs: [{ name: "apex_registration.pdf", type: "application/pdf" }],
      idOffund: [{ name: "nomsa_dlamini_id.pdf", type: "application/pdf" }],
      fundMandate: [{ name: "apex_fund_mandate.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "apex_cmf_agreement.pdf", type: "application/pdf" }
    }
  }
]

const mockCatalysts = [
  {
    entityOverview: {
      registeredName: "Impact Hub Africa Pty Ltd",
      tradingName: "Impact Hub Africa",
      legalEntityType: "(pty) Ltd",
      registrationNumber: "2020/223344/07",
      industrySector: "Education & Training",
      companySize: "medium_enterprise",
      yearEstablished: "2020",
      briefDescription: "Impact Hub Africa provides incubator and accelerator programs to social entrepreneurs across Southern Africa.",
      referralSource: "referral",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      businessTel: "+27113334444",
      businessEmail: "info.catalyst@mailinator.com",
      physicalAddress: "88 Commissioner Street, Johannesburg, 2001",
      postalAddress: "88 Commissioner Street, Johannesburg, 2001",
      primaryContactTitle: "ms",
      primaryContactName: "Lerato",
      primaryContactSurname: "Molefe",
      primaryContactPosition: "Program Director",
      primaryContactMobile: "+27834445555",
      primaryContactEmail: "lerato.molefe.hub@mailinator.com"
    },
    programBriefMatchingPreference: {
      programName: "African Social Innovators Accelerator",
      programDuration: "6 Months",
      intangibleSupport: "Mentorship & Networking",
      geographicFocus: ["South Africa"],
      sectorFocus: ["Agriculture", "Education", "Digital Enterprise"],
      selectedProvinces: ["Gauteng", "Western Cape"],
      selectedCountries: ["South Africa"]
    },
    applicationBrief: {
      overviewObjectives: "Incubating early-stage social impact ventures to achieve investment readiness.",
      cohortCapacity: "12",
      targetLifecycle: "Early Stage"
    },
    documentUploadPlaceholder: {
      standardNda: [{ name: "hub_standard_nda.pdf", type: "application/pdf" }],
      standardContract: [{ name: "hub_catalyst_contract.pdf", type: "application/pdf" }],
      programBrochures: [{ name: "hub_program_brochure.pdf", type: "application/pdf" }],
      cipcRegistration: [{ name: "catalyst_cipc.pdf", type: "application/pdf" }],
      taxCompliancePin: [{ name: "catalyst_tax.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "catalyst_agreement.pdf", type: "application/pdf" }
    }
  },
  {
    entityOverview: {
      registeredName: "Genesis Enterprise Accelerator NPC",
      tradingName: "Genesis Accelerator",
      legalEntityType: "NPC",
      registrationNumber: "2017/556677/08",
      industrySector: "Energy",
      companySize: "large_enterprise",
      yearEstablished: "2017",
      briefDescription: "Genesis Enterprise Accelerator delivers high-impact commercialization programmes, technical readiness, and corporate supply chain integration for clean-tech and industrial ventures.",
      referralSource: "referral",
      sponsorName: "CMF Onboarded",
      sponsorType: "CMF",
      sponsorViewPermission: "yes"
    },
    contactDetails: {
      businessTel: "+27315559988",
      businessEmail: "genesis.programmes@mailinator.com",
      physicalAddress: "14 Umhlanga Rocks Drive, Durban, 4319",
      postalAddress: "14 Umhlanga Rocks Drive, Durban, 4319",
      primaryContactTitle: "mr",
      primaryContactName: "Sipho",
      primaryContactSurname: "Ndlovu",
      primaryContactPosition: "Managing Director",
      primaryContactMobile: "+27827773344",
      primaryContactEmail: "sipho.ndlovu.genesis@mailinator.com"
    },
    programBriefMatchingPreference: {
      programName: "CleanTech Scale & Industrial Acceleration 2026",
      programDuration: "12 Months",
      intangibleSupport: "Export Readiness, Technical Standards & Corporate Procurement Access",
      geographicFocus: ["South Africa"],
      sectorFocus: ["Manufacturing", "Renewable Energy", "Agri-Processing"],
      selectedProvinces: ["KwaZulu-Natal", "Gauteng", "Eastern Cape"],
      selectedCountries: ["South Africa"]
    },
    applicationBrief: {
      overviewObjectives: "Accelerating commercially viable energy and industrial technology enterprises to corporate supply chains.",
      cohortCapacity: "15",
      targetLifecycle: "Growth Stage"
    },
    documentUploadPlaceholder: {
      standardNda: [{ name: "genesis_standard_nda.pdf", type: "application/pdf" }],
      standardContract: [{ name: "genesis_programme_contract.pdf", type: "application/pdf" }],
      programBrochures: [{ name: "genesis_cohort_brochure.pdf", type: "application/pdf" }],
      cipcRegistration: [{ name: "genesis_npc_cert.pdf", type: "application/pdf" }],
      taxCompliancePin: [{ name: "genesis_tax_pin.pdf", type: "application/pdf" }]
    },
    declarationConsentPlaceholder: {
      accuracy: true,
      dataProcessing: true,
      termsConditions: true,
      cmfPermissionAgreement: { name: "genesis_cmf_mandate.pdf", type: "application/pdf" }
    }
  }
]

const mockCMFs = [
  {
    instructions: {},
    entityOverview: {
      profileType: "Organisation",
      organisationName: "Capital Access Facilitation Group (Pty) Ltd",
      headline: "Helping growing African SMEs prepare for funding and access suitable institutional funders.",
      about: "Capital Access Group is a premier advisory intermediary providing corporate transaction origination, debt readiness, and supply chain onboarding across Sub-Saharan Africa.",
      facilitationFocus: "Both",
      baseCountry: "South Africa",
      baseCity: "Johannesburg",
      website: "https://capitalaccessgroup.co.za",
      linkedin: "https://linkedin.com/company/capital-access-group"
    },
    servicesSupport: {
      servicesOffered: [
        "Funding readiness",
        "Funding route advice",
        "Application preparation",
        "Financial modelling",
        "Funder introductions",
        "Supplier readiness",
        "Opportunity sourcing",
        "Buyer introductions"
      ],
      otherServiceText: "",
      whatSmesReceive: "Audited financial model, institutional pitch memorandums, minimum 3 direct investor pitch opportunities, and commercial buyer off-take introductions.",
      deliveryMethod: "Hybrid",
      supportFormat: "Both",
      engagementType: "Ongoing",
      typicalDuration: "3 - 6 months"
    },
    smeFocusMatching: {
      sectorsSupported: [
        "Agriculture & Agribusiness",
        "Manufacturing & Industrial",
        "Information & Communication Technology (ICT)",
        "Logistics & Supply Chain",
        "Healthcare & Pharmaceuticals"
      ],
      geographicAreas: ["National (All South Africa)", "Gauteng", "Western Cape", "KwaZulu-Natal"],
      businessStages: ["Startup", "Growth", "Established"],
      eligibilityCriteria: [
        "Registered legal entity (Pty Ltd / close corp)",
        "Minimum operating track record (1+ years)",
        "SARS Tax compliance & PIN",
        "Audited or verified financial statements"
      ],
      eligibilityExplanation: "SMEs should have an operational track record of at least 12 months with proven revenue generation.",
      turnoverRange: "R 2,000,000 - R 50,000,000",
      allowNoTurnoverRestriction: false,
      programmeCriteria: ["Black-owned (B-BBEE Qualifying)", "Women-owned enterprise"],
      excludedSectorsText: "Tobacco, speculative financial assets, arms and weapons",
      acceptingNewSmes: "Yes",
      preferredNewEngagements: 12,
      fundingInstruments: [
        "Senior Debt / Term Loans",
        "Subordinated / Mezzanine Debt",
        "Growth Private Equity",
        "Working Capital Facilities"
      ],
      typicalFundingRange: "R 1,000,000 - R 20,000,000",
      fundingReadinessRequirements: "2 years management accounts, cash flow forecast, and valid CIPC tax pin.",
      opportunityTypes: ["Tenders & RFPs", "Supply contracts", "Offtake & Distribution"],
      buyerSectorsText: "FMCG Retail, Mining Supply Chains, Telecommunications",
      supplierReadinessRequirements: "Proof of supply capacity, BBBEE verification certificate"
    },
    experienceNetworks: {
      leadFacilitatorName: "Thabo Mokoena",
      leadFacilitatorRole: "Lead Facilitator & Managing Director",
      leadExperienceBio: "Over 12 years in corporate finance, project origination, and SME accelerator structuring across Southern Africa.",
      yearsExperience: 12,
      teamMembers: [
        { name: "Naledi Dlamini", role: "Head of Deal Origination", bio: "CA(SA) with extensive private equity and transaction experience." },
        { name: "John Doe", role: "Commercial Partnerships Lead", bio: "Former corporate procurement advisor." }
      ],
      qualifications: [
        { title: "CA(SA)", body: "SAICA", year: "2015" },
        { title: "FAIS Key Individual", body: "FSCA", year: "2018" }
      ],
      relationships: [
        { entityName: "Standard Bank Commercial Banking", relationshipType: "Formal partner", description: "Direct SME origination partner" },
        { entityName: "Nedbank Enterprise Development", relationshipType: "Appointed representative", description: "Designated credit pipeline intermediary" },
        { entityName: "Shoprite Checkers Enterprise Supply", relationshipType: "Network contact", description: "Buyer supplier readiness connector" }
      ],
      caseStudies: [
        { title: "R18M Debt Syndication for Agro-processing Facility", isConfidential: true, summary: "Secured asset finance and working capital facility enabling 40% export expansion." }
      ],
      testimonials: [
        { author: "Sipho Khumalo", company: "Zambezi Agro Ltd", quote: "Capital Access Group accelerated our transaction readiness and closed our debt round in record time.", hasPermissionToPublish: true }
      ]
    },
    feesEngagement: {
      payer: "SME",
      feeModel: "Fixed fee",
      indicativeFees: "R20,000 readiness package plus 2.5% success fee on capital disbursement",
      paymentTiming: "Milestones",
      successFeeBasis: "2.5% payable upon first fund disbursement",
      referralCommissions: "No",
      referralExplanation: "",
      exclusivityRequired: "No",
      exclusivityExplanation: "",
      howEngagementStarts: "Initial assessment",
      initialAssessmentInfo: [
        "CIPC company registration certificate",
        "Executive summary or company profile",
        "Pitch deck or funding proposition",
        "Last 6-12 months bank statements",
        "Tax compliance PIN / certificate"
      ],
      typicalResponseTime: "1 - 2 business days",
      engagementTermsUrl: "https://capitalaccessgroup.co.za/terms"
    },
    legalVerification: {
      legalEntityName: "Capital Access Facilitation Group (Pty) Ltd",
      registrationCountry: "South Africa",
      registrationNumber: "2015/334455/07",
      capacityInWhichActs: "Independent facilitator",
      professionalAuthorisationDetails: "FAIS Cat I FSP Licence #44991"
    },
    contactDetails: {
      smeContactName: "Naledi Dlamini",
      smeContactRole: "Client Engagements & Intake Director",
      preferredContactRoute: "BIG enquiry",
      publicEmail: "intake@capitalaccessgroup.co.za",
      publicTelephone: "+27 (0) 11 555 1234",
      languagesSupported: ["English", "isiZulu", "isiXhosa"],
      accountAdminName: "Thabo Mokoena",
      accountAdminEmail: "thabo.mokoena.cmf@mailinator.com",
      accountAdminPhone: "+27 (0) 82 555 6789"
    },
    declarationConsent: {
      accuracy: true,
      permissionRelationships: true,
      approvePublicProfile: true,
      acceptTermsPrivacy: true,
      marketingConsent: true
    },
    howDidYouHear: {
      source: "Industry Event"
    }
  }
]

// Utility helper to detect File or Blob objects reliably across environments
const isFileOrBlob = (val) => {
  if (!val || typeof val !== "object") return false
  if (typeof File !== "undefined" && val instanceof File) return true
  if (typeof Blob !== "undefined" && val instanceof Blob) return true
  const tag = Object.prototype.toString.call(val)
  return tag === "[object File]" || tag === "[object Blob]" || val.constructor?.name === "File" || val.constructor?.name === "Blob"
}

export default function CMFOnboardProfile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get("type") || "Business"
  const draftIdParam = searchParams.get("draftId") || ""

  // Modular Firebase instances
  const db = getFirestore()
  const storage = getStorage()
  const auth = getAuth()

  // Developer auto-fill egg state (default visible for seamless workflow)
  const [showEasterEgg, setShowEasterEgg] = useState(true)

  // Listen for Alt + T key listener to toggle visibility of developer auto-fill helper (explicitly supports AltRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isAltPressed = e.altKey || e.code === "AltRight" || e.key === "AltGraph" || e.code === "AltGraph"
      if (isAltPressed && e.code === "KeyT") {
        e.preventDefault()
        setShowEasterEgg(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const createMockFiles = (placeholderObj) => {
    const result = {}
    if (!placeholderObj) return result
    for (const key in placeholderObj) {
      const val = placeholderObj[key]
      if (Array.isArray(val)) {
        result[key] = val.map(item => new File([`mock_${key}`], item.name, { type: item.type }))
      } else if (val && typeof val === "object") {
        result[key] = new File([`mock_${key}`], val.name, { type: val.type })
      }
    }
    return result
  }

  const handleAutoFill = (targetIndex = null) => {
    let selected = null

    if (profileType === "Business") {
      const idx = (targetIndex !== null && targetIndex !== undefined)
        ? Math.abs(targetIndex) % mockBusinesses.length
        : Math.floor(Math.random() * mockBusinesses.length)
      selected = JSON.parse(JSON.stringify(mockBusinesses[idx]))
      selected.documents = createMockFiles(selected.documentsPlaceholder)
      selected.declarationConsent = {
        accuracy: true,
        dataProcessing: true,
        termsConditions: true,
        ...createMockFiles(selected.declarationConsentPlaceholder)
      }
      delete selected.documentsPlaceholder
      delete selected.declarationConsentPlaceholder

    } else if (profileType === "Funder") {
      const idx = (targetIndex !== null && targetIndex !== undefined)
        ? Math.abs(targetIndex) % mockFunders.length
        : Math.floor(Math.random() * mockFunders.length)
      selected = JSON.parse(JSON.stringify(mockFunders[idx]))
      selected.contactDetails.email = selected.contactDetails.businessEmail || selected.contactDetails.primaryContactEmail
      selected.documentUpload = createMockFiles(selected.documentUploadPlaceholder)
      selected.declarationConsent = {
        accuracy: true,
        dataProcessing: true,
        termsConditions: true,
        ...createMockFiles(selected.declarationConsentPlaceholder)
      }
      delete selected.documentUploadPlaceholder
      delete selected.declarationConsentPlaceholder

    } else if (profileType === "Catalyst") {
      const idx = (targetIndex !== null && targetIndex !== undefined)
        ? Math.abs(targetIndex) % mockCatalysts.length
        : Math.floor(Math.random() * mockCatalysts.length)
      selected = JSON.parse(JSON.stringify(mockCatalysts[idx]))
      selected.contactDetails.email = selected.contactDetails.businessEmail || selected.contactDetails.primaryContactEmail
      selected.documentUpload = createMockFiles(selected.documentUploadPlaceholder)
      selected.declarationConsent = {
        accuracy: true,
        dataProcessing: true,
        termsConditions: true,
        ...createMockFiles(selected.declarationConsentPlaceholder)
      }
      delete selected.documentUploadPlaceholder
      delete selected.declarationConsentPlaceholder

    } else if (profileType === "CMF") {
      const idx = (targetIndex !== null && targetIndex !== undefined)
        ? Math.abs(targetIndex) % mockCMFs.length
        : Math.floor(Math.random() * mockCMFs.length)
      selected = JSON.parse(JSON.stringify(mockCMFs[idx]))
      if (!selected.contactDetails?.businessEmail && selected.contactDetails?.accountAdminEmail) {
        selected.contactDetails.businessEmail = selected.contactDetails.accountAdminEmail
      }
    }

    if (selected) {
      setDuplicateEntity(null)
      setFormData(selected)
      const list = getSectionsList(profileType)
      const completed = {}
      list.forEach(s => {
        completed[s.id] = true
      })
      setCompletedSections(completed)

      const emailToCheck = selected.contactDetails?.email || selected.contactDetails?.businessEmail || selected.contactDetails?.primaryContactEmail
      if (emailToCheck) {
        checkEmailConflict(emailToCheck)
      } else {
        setEmailConflictWarning("")
        setExistingAccountConflict(null)
      }

      // If user is currently inspecting a specific section (> 1), remain on that section to inspect prefilled fields, otherwise navigate to final review step
      if (activeStep > 1) {
        // stay on current activeStep
      } else {
        setActiveStep(list.length)
      }
    }
  }

  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [profileType, setProfileType] = useState(typeParam)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // QR Code Popup State
  const [onboardResult, setOnboardResult] = useState(null)
  const [emailConflictWarning, setEmailConflictWarning] = useState("")
  const [existingAccountConflict, setExistingAccountConflict] = useState(null)
  const [duplicateEntity, setDuplicateEntity] = useState(null)

  // Initial Form Data nested per profile type
  const [formData, setFormData] = useState({})
  const [completedSections, setCompletedSections] = useState({})

  // Set Profile Type when route param changes
  useEffect(() => {
    if (typeParam && !draftIdParam) {
      setProfileType(typeParam)
      // Reset form states aligned with the profile type schema
      setFormData(getInitialFormData(typeParam))
      setCompletedSections(getInitialCompletedSections(typeParam))
      setActiveStep(1)
    }
  }, [typeParam, draftIdParam])

  // Resolve logged in CMF user
  useEffect(() => {
    sessionStorage.setItem("isOnboarding", "true")
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Fetch Draft if draftIdParam exists
        if (draftIdParam) {
          try {
            const draftDoc = await getDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
            if (draftDoc.exists()) {
              const draftData = draftDoc.data()
              if (draftData.profileType) {
                setProfileType(draftData.profileType)
              }
              if (draftData.formData) {
                setFormData(draftData.formData)
              }
              if (draftData.completedSections) {
                setCompletedSections(draftData.completedSections)
              }
              if (draftData.activeStep) {
                setActiveStep(draftData.activeStep)
              }
            }
          } catch (err) {
            console.error("Error loading draft:", err)
          }
        }
        setLoading(false)
      } else {
        navigate("/auth")
      }
    })
    return () => {
      unsubscribe()
      sessionStorage.removeItem("isOnboarding")
    }
  }, [draftIdParam, navigate])

  // Duplicate Entity Checker by Registration Number
  useEffect(() => {
    let regNum = ""
    let collectionName = ""
    if (profileType === "Funder") {
      regNum = formData.fundManageOverview?.registrationNumber || ""
      collectionName = "MyuniversalProfiles"
    } else if (profileType === "Catalyst") {
      regNum = formData.entityOverview?.registrationNumber || ""
      collectionName = "catalystProfiles"
    }

    regNum = regNum.trim()
    if (!regNum || regNum.length < 5 || !collectionName) {
      setDuplicateEntity(null)
      return
    }

    const checkDuplicate = async () => {
      try {
        const q = query(
          collection(db, collectionName),
          where("entityOverview.registrationNumber", "==", regNum)
        )
        const qSnap = await getDocs(q)
        
        let foundDoc = null
        qSnap.forEach(d => {
          foundDoc = { id: d.id, ...d.data() }
        })

        // For funders, check alternative path fundManageOverview
        if (!foundDoc && collectionName === "MyuniversalProfiles") {
          const q2 = query(
            collection(db, collectionName),
            where("fundManageOverview.registrationNumber", "==", regNum)
          )
          const qSnap2 = await getDocs(q2)
          qSnap2.forEach(d => {
            foundDoc = { id: d.id, ...d.data() }
          })
        }

        if (foundDoc) {
          setDuplicateEntity(foundDoc)
        } else {
          setDuplicateEntity(null)
        }
      } catch (err) {
        console.warn("Error checking duplicate registration number:", err)
      }
    }

    const delayDebounce = setTimeout(() => {
      checkDuplicate()
    }, 600)

    return () => clearTimeout(delayDebounce)
  }, [
    profileType, 
    formData.fundManageOverview?.registrationNumber, 
    formData.entityOverview?.registrationNumber,
    db
  ])

  // Auto prefill core fields from existing duplicate entity
  useEffect(() => {
    if (duplicateEntity) {
      const core = duplicateEntity.entityOverview || duplicateEntity.fundManageOverview || {}
      const sectionId = profileType === "Funder" ? "fundManageOverview" : "entityOverview"
      
      updateFormData(sectionId, {
        registeredName: core.registeredName || "",
        tradingName: core.tradingName || "",
        registrationNumber: core.registrationNumber || "",
        briefDescription: core.briefDescription || duplicateEntity.briefDescription || "",
        legalEntityType: core.legalEntityType || "",
        yearsInOperation: core.yearsInOperation || "",
        financialYearStart: core.financialYearStart || "",
        taxNumber: core.taxNumber || "",
        vatRegistrationNumbers: core.vatRegistrationNumbers || "",
        regulatoryLicenseNumber: core.regulatoryLicenseNumber || "",
        firmType: core.firmType || "",
        firmSubtype: core.firmSubtype || [],
        investorRole: core.investorRole || "",
        numberOfInvestmentExecutives: core.numberOfInvestmentExecutives || "",
      })
    }
  }, [duplicateEntity])

  function getInitialFormData(type) {
    if (type === "Business") {
      return {
        instructions: {},
        entityOverview: {
          entityType: "SME",
          registeredName: "",
          tradingName: "",
          registrationNumber: "",
          legalStructure: "(pty) Ltd",
          entitySize: "Medium",
          financialYearEnd: "2024-02",
          yearsInOperation: "",
          operationStage: "Growth",
          economicSectors: [],
          businessDescription: "",
          operatingCountries: ["South Africa"],
          sponsorName: auth.currentUser?.uid || "",
          sponsorType: "CMF",
          sponsorViewPermission: "yes"
        },
        contactDetails: {
          contactTitle: "mr",
          contactName: "",
          position: "Director",
          businessPhone: "",
          mobile: "",
          email: "",
          physicalAddress: "",
          sameAsPhysical: true,
          postalAddress: ""
        },
        ownershipManagement: {
          totalAuthorisedShares: "1000",
          totalIssuedShares: "100",
          permanentEmployees: "10"
        },
        legalCompliance: {
          taxNumber: "",
          taxClearancePin: "",
          vatNumber: "",
          bbbeeLevel: "1",
          uifStatus: "Registered"
        },
        operationsOverview: {},
        financialOverview: {},
        governance: {},
        productsServices: {
          offeringType: "services",
          offerings: []
        },
        howDidYouHear: {
          source: "Online search"
        },
        documents: {},
        declarationConsent: {}
      }
    } else if (type === "Funder") {
      return {
        instructions: {},
        fundManageOverview: {
          entityType: "Investor",
          registeredName: "",
          tradingName: "",
          registrationNumber: "",
          financialYearStart: "March",
          regulatoryLicenseNumber: "",
          legalEntityType: "Private Company (Pty Ltd)",
          firmType: "Venture Capital (VC)",
          firmSubtype: [],
          investorRole: "Lead Investor",
          yearsInOperation: "",
          numberOfInvestmentExecutives: "",
          taxNumber: "",
          vatRegistrationNumbers: "",
          briefDescription: "",
          portfolioCompanies: "",
          numberOfInvestments: "",
          valueDeployed: "",
          additionalSupport: [],
          howDidYouHear: "Referral",
          sponsorName: auth.currentUser?.uid || "",
          sponsorType: "CMF",
          sponsorViewPermission: "yes"
        },
        contactDetails: {
          businessTel: "",
          businessEmail: "",
          physicalAddress: "",
          postalAddress: "",
          primaryContactTitle: "mr",
          primaryContactName: "",
          primaryContactSurname: "",
          primaryContactPosition: "",
          primaryContactMobile: "",
          primaryContactEmail: ""
        },
        investmentRequirements: {},
        generalInvestmentPreference: {
          minimumSupportTicket: "",
          maximumSupportTicket: "",
          sectorFocus: [],
          geographicFocus: ["South Africa"],
          selectedProvinces: [],
          legalEntity: [],
          businessLifecycleStage: [],
          ticketSize: ""
        },
        fundDetails: {},
        applicationBrief: {},
        documentUpload: {},
        declarationConsent: {}
      }
    } else if (type === "Catalyst") {
      return {
        instructions: {},
        entityOverview: {
          entityType: "Catalyst",
          registeredName: "",
          tradingName: "",
          legalEntityType: "(pty) Ltd",
          registrationNumber: "",
          industrySector: "Education & Training",
          companySize: "medium_enterprise",
          yearEstablished: "",
          briefDescription: "",
          referralSource: "referral",
          sponsorName: auth.currentUser?.uid || "",
          sponsorType: "CMF",
          sponsorViewPermission: "yes"
        },
        contactDetails: {
          businessTel: "",
          businessEmail: "",
          physicalAddress: "",
          postalAddress: "",
          primaryContactTitle: "ms",
          primaryContactName: "",
          primaryContactSurname: "",
          primaryContactPosition: "",
          primaryContactMobile: "",
          primaryContactEmail: ""
        },
        programBriefMatchingPreference: {
          programName: "",
          programDuration: "",
          intangibleSupport: "",
          geographicFocus: ["South Africa"],
          sectorFocus: [],
          selectedProvinces: [],
          selectedCountries: ["South Africa"]
        },
        applicationBrief: {},
        documentUpload: {},
        declarationConsent: {}
      }
    } else if (type === "CMF") {
      return getDefaultCMFFormData()
    }
    return {}
  }

  function getInitialCompletedSections(type) {
    const completed = { instructions: true }
    const list = getSectionsList(type)
    list.forEach(s => {
      if (s.id !== "instructions") {
        completed[s.id] = false
      }
    })
    return completed
  }

  function getSectionsList(type) {
    if (type === "Business") {
      return [
        { id: "instructions", label: "Instructions" },
        { id: "entityOverview", label: "Entity Overview" },
        { id: "ownershipManagement", label: "Ownership & Management" },
        { id: "contactDetails", label: "Contact Details" },
        { id: "legalCompliance", label: "Legal & Compliance" },
        { id: "productsServices", label: "Products & Services" },
        { id: "operationsOverview", label: "Operations Overview" },
        { id: "financialOverview", label: "Financial Overview" },
        { id: "governance", label: "Governance" },
        { id: "howDidYouHear", label: "How Did You Hear" },
        { id: "documents", label: "Documents" },
        { id: "declarationConsent", label: "Declaration & Consent" }
      ]
    } else if (type === "Funder") {
      return [
        { id: "instructions", label: "Instructions" },
        { id: "fundManageOverview", label: "Fund Manage Overview" },
        { id: "contactDetails", label: "Contact Details" },
        { id: "investmentRequirements", label: "Investment Requirements" },
        { id: "generalInvestmentPreference", label: "Investment Preferences" },
        { id: "fundDetails", label: "Fund Details" },
        { id: "applicationBrief", label: "Application Brief" },
        { id: "documentUpload", label: "Document Upload" },
        { id: "declarationConsent", label: "Declaration & Consent" }
      ]
    } else if (type === "Catalyst") {
      return [
        { id: "instructions", label: "Instructions" },
        { id: "entityOverview", label: "Entity Overview" },
        { id: "contactDetails", label: "Contact Details" },
        { id: "programBriefMatchingPreference", label: "Program & Matching Preferences" },
        { id: "applicationBrief", label: "Application Brief" },
        { id: "documentUpload", label: "Document Upload" },
        { id: "declarationConsent", label: "Declaration & Consent" }
      ]
    } else if (type === "CMF") {
      return CMF_SECTIONS
    }
    return []
  }

  const sections = useMemo(() => getSectionsList(profileType), [profileType])
  const activeSection = useMemo(() => sections[activeStep - 1] || sections[0], [sections, activeStep])

  // Email Conflict Checker (checks existing registered accounts in Firestore users collection)
  const checkEmailConflict = async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      setEmailConflictWarning("")
      setExistingAccountConflict(null)
      return
    }
    const roleMap = {
      Business: "SMSE",
      Funder: "Investor",
      Catalyst: "Catalyst",
      CMF: "CMF"
    }
    const targetRole = roleMap[profileType] || profileType
    try {
      const cleanEmail = emailToCheck.trim()
      let qSnap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)))
      if (qSnap.empty) {
        qSnap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail.toLowerCase())))
      }

      if (qSnap.empty) {
        // Also check if they exist in profile collections
        for (const col of ["universalProfiles", "cmfProfiles", "MyuniversalProfiles", "catalystProfiles"]) {
          try {
            let pSnap = await getDocs(query(collection(db, col), where("contactDetails.email", "==", cleanEmail)))
            if (pSnap.empty) {
              pSnap = await getDocs(query(collection(db, col), where("contactDetails.businessEmail", "==", cleanEmail)))
            }
            if (pSnap.empty) {
              pSnap = await getDocs(query(collection(db, col), where("contactDetails.primaryContactEmail", "==", cleanEmail)))
            }
            if (!pSnap.empty) {
              const pDoc = pSnap.docs[0]
              const pData = pDoc.data() || {}
              const existingRole = pData.role || (col === "universalProfiles" ? "SMSE" : col === "cmfProfiles" ? "CMF" : col === "MyuniversalProfiles" ? "Investor" : "Catalyst")
              const hasSameRole = (targetRole === existingRole)
              const conflictInfo = {
                uid: pDoc.id,
                userData: pData,
                email: cleanEmail,
                hasSameRole,
                existingRoles: [existingRole],
                targetRole,
                message: hasSameRole
                  ? `Existing Account Found: A user with this email already has a ${profileType} profile. Saving and onboarding will merge/update their ${profileType} profile into your cohort.`
                  : `Existing Account Found: A user with this email already exists with role: ${existingRole}. Saving and onboarding will add the ${profileType} profile to their existing account (Multi-Role).`
              }
              setExistingAccountConflict(conflictInfo)
              setEmailConflictWarning(conflictInfo.message)
              return
            }
          } catch (err) {}
        }
      }

      if (!qSnap.empty) {
        const docSnap = qSnap.docs[0]
        const uData = docSnap.data() || {}
        const rolesArray = Array.isArray(uData.roleArray)
          ? uData.roleArray
          : (uData.role ? [uData.role] : [])

        const hasSameRole = rolesArray.some(
          r => String(r).toLowerCase() === targetRole.toLowerCase() ||
               (targetRole === "SMSE" && (String(r).toLowerCase().includes("smse") || String(r).toLowerCase().includes("business"))) ||
               (targetRole === "Investor" && (String(r).toLowerCase().includes("investor") || String(r).toLowerCase().includes("funder"))) ||
               (targetRole === "Catalyst" && String(r).toLowerCase().includes("catalyst")) ||
               (targetRole === "CMF" && String(r).toLowerCase().includes("cmf"))
        )

        const conflictInfo = {
          uid: docSnap.id,
          userData: uData,
          email: cleanEmail,
          hasSameRole,
          existingRoles: rolesArray,
          targetRole,
          message: hasSameRole
            ? `Existing Account Found: A user with this email already has a ${profileType} profile. Saving and onboarding will merge/update their ${profileType} profile into your cohort.`
            : `Existing Account Found: A user with this email already exists with role(s): ${rolesArray.join(", ") || "User"}. Saving and onboarding will add the ${profileType} profile to their existing account (Multi-Role).`
        }

        setExistingAccountConflict(conflictInfo)
        setEmailConflictWarning(conflictInfo.message)
      } else {
        setExistingAccountConflict(null)
        setEmailConflictWarning("")
      }
    } catch (e) {
      console.warn("Could not check email conflicts:", e)
    }
  }

  const updateFormData = (section, data) => {
    setFormData((prev) => {
      const updatedSection = { ...prev[section], ...data }
      
      // Hook up email check if updating contact details email
      if (section === "contactDetails") {
        const emailVal = data.email || data.businessEmail || data.primaryContactEmail
        if (emailVal) {
          checkEmailConflict(emailVal)
        }
      }
      
      return {
        ...prev,
        [section]: updatedSection
      }
    })
  }

  const validateSection = useCallback((type, sectionId, sectionData) => {
    if (!sectionData) return false;
    
    // Bypass instructions
    if (sectionId === "instructions") return true;

    const hasFile = (val) => {
      if (!val) return false;
      if (isFileOrBlob(val)) return true;
      if (Array.isArray(val)) {
        return val.length > 0 && val.some(item => hasFile(item));
      }
      if (typeof val === "object") {
        return !!(val.name || val.url || val.path || val.downloadURL);
      }
      return typeof val === "string" && val.trim().length > 0;
    };

    // Validate documents section
    // Requirement: documents should NOT block submission if not provided.
    // Users can submit without documents, except for the agreement form document (validated in declarationConsent).
    if (sectionId === "documents" || sectionId === "documentUpload") {
      return true;
    }

    // Validate declarationConsent section
    // Requirement: agreement form document is mandatory, but general documents are optional
    if (sectionId === "declarationConsent") {
      const baseValid = !!(sectionData.accuracy && sectionData.dataProcessing);
      const hasAgreement = hasFile(sectionData.cmfPermissionAgreement) || hasFile(sectionData.agreementForm) || hasFile(sectionData.cmfAgreement);
      return baseValid && hasAgreement;
    }

        if (type === "CMF") {
      if (cmfSectionValidations[sectionId]) {
        return cmfSectionValidations[sectionId](sectionData, formData)
      }
      return true
    }

    if (type === "Business") {
      if (sectionId === "entityOverview") {
        return !!(
          sectionData.registeredName &&
          sectionData.registrationNumber &&
          sectionData.legalStructure &&
          sectionData.entitySize &&
          sectionData.financialYearEnd &&
          sectionData.yearsInOperation !== undefined && sectionData.yearsInOperation !== "" &&
          sectionData.operationStage &&
          Array.isArray(sectionData.economicSectors) && sectionData.economicSectors.length > 0 &&
          Array.isArray(sectionData.operatingCountries) && sectionData.operatingCountries.length > 0 &&
          sectionData.businessDescription
        );
      }
      if (sectionId === "contactDetails") {
        const requiredFields = [
          sectionData.contactTitle, sectionData.contactName, sectionData.position,
          sectionData.businessPhone, sectionData.mobile, (sectionData.email || sectionData.businessEmail), sectionData.physicalAddress,
        ];
        const hasAllRequired = requiredFields.every((field) => typeof field === "string" && field.trim() !== "");
        const postalAddressValid = sectionData.sameAsPhysical || (typeof sectionData.postalAddress === "string" && sectionData.postalAddress.trim() !== "");
        return hasAllRequired && postalAddressValid;
      }
      if (sectionId === "productsServices") {
        return !!(sectionData.offeringType);
      }
      if (sectionId === "operationsOverview") {
        return (
          sectionData.multipleSuppliers !== undefined && sectionData.multipleSuppliers !== "" &&
          sectionData.contingencyPlan !== undefined && sectionData.contingencyPlan !== "" &&
          sectionData.trackPerformanceMetrics !== undefined && sectionData.trackPerformanceMetrics !== "" &&
          sectionData.threeSuccessfulDeliveries !== undefined && sectionData.threeSuccessfulDeliveries !== "" &&
          sectionData.hasCapacityToIncrease !== undefined && sectionData.hasCapacityToIncrease !== "" &&
          sectionData.hasFormalProcedures !== undefined && sectionData.hasFormalProcedures !== "" &&
          sectionData.hasMajorIncidents !== undefined && sectionData.hasMajorIncidents !== ""
        );
      }
    }
    
    // Generic fallback checker for other sections:
    const keys = Object.keys(sectionData).filter(k => k !== "updatedAt" && k !== "createdAt");
    if (keys.length === 0) return false;
    const hasValues = keys.some(k => {
      const val = sectionData[k];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object" && val !== null) return Object.keys(val).length > 0;
      return val !== undefined && val !== null && val !== "";
    });
    return hasValues;
  }, []);

  // Sticky Progress Bar Calc
  const completionPercentage = useMemo(() => {
    if (sections.length === 0) return 0
    const completedCount = Object.values(completedSections).filter(Boolean).length
    return Math.round((completedCount / sections.length) * 100)
  }, [completedSections, sections])

  // Sanitize and serialize form data for draft storage (uploading files to storage or preserving metadata)
  const sanitizeDraftData = async (data, draftId, pathPrefix = "") => {
    if (isFileOrBlob(data)) {
      try {
        const uid = currentUser?.uid || auth.currentUser?.uid || "cmf_facilitator"
        const safeName = (data.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")
        const storagePath = `cmfDraftFiles/${uid}/${draftId}/${pathPrefix}_${safeName}`
        const fileRef = ref(storage, storagePath)
        await uploadBytes(fileRef, data)
        const downloadURL = await getDownloadURL(fileRef)
        return {
          name: data.name || "uploaded_file",
          size: data.size || 0,
          type: data.type || "application/octet-stream",
          lastModified: data.lastModified || Date.now(),
          downloadURL,
          url: downloadURL,
          storagePath,
          isDraftFile: true
        }
      } catch (uploadErr) {
        console.warn("Storage upload failed for draft file, preserving metadata only:", uploadErr)
        return {
          name: data.name || "uploaded_file",
          size: data.size || 0,
          type: data.type || "application/octet-stream",
          lastModified: data.lastModified || Date.now(),
          isDraftFilePlaceholder: true
        }
      }
    } else if (Array.isArray(data)) {
      return await Promise.all(data.map((item, idx) => sanitizeDraftData(item, draftId, `${pathPrefix}_${idx}`)))
    } else if (data !== null && typeof data === "object") {
      const cleanedObj = {}
      for (const key of Object.keys(data)) {
        const val = data[key]
        if (val !== undefined) {
          cleanedObj[key] = await sanitizeDraftData(val, draftId, `${pathPrefix}_${key}`)
        }
      }
      return cleanedObj
    } else if (data === undefined) {
      return null
    }
    return data
  }

  // Save draft to DB
  const handleSaveDraft = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      const draftId = draftIdParam || `draft_${Date.now()}`
      const draftDocRef = doc(db, "cmfOnboardingDrafts", draftId)

      const draftTitle =
        formData.entityOverview?.registeredName ||
        formData.fundManageOverview?.registeredName ||
        formData.entityOverview?.tradingName ||
        formData.fundManageOverview?.tradingName ||
        formData.contactDetails?.contactName ||
        formData.contactDetails?.primaryContactName ||
        `${profileType} Partner Draft`

      const sanitizedFormData = await sanitizeDraftData(formData, draftId)
      setFormData(sanitizedFormData)

      const sanitizedCompletedSections = {}
      if (completedSections && typeof completedSections === "object") {
        for (const k of Object.keys(completedSections)) {
          if (completedSections[k] !== undefined) {
            sanitizedCompletedSections[k] = Boolean(completedSections[k])
          }
        }
      }

      await setDoc(draftDocRef, {
        id: draftId,
        title: draftTitle,
        facilitatorId: currentUser.uid,
        profileType: profileType || "Business",
        formData: sanitizedFormData,
        completedSections: sanitizedCompletedSections,
        activeStep: Number(activeStep) || 1,
        updatedAt: Date.now()
      })

      alert("Draft saved successfully!")
      navigate("/cmf-cohorts")
    } catch (err) {
      console.error("Error saving draft:", err)
      alert("Failed to save draft: " + (err?.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardDraft = async () => {
    if (draftIdParam) {
      setSaving(true)
      try {
        await deleteDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
      } catch (e) {
        console.warn("Could not delete discarded draft record:", e)
      }
    }
    navigate("/cmf-cohorts")
  }

  // Upload files and replace with URLs
  const uploadFilesAndReplaceWithURLs = async (data, sectionName, targetUserId) => {
    const facilitatorUid = currentUser?.uid || auth.currentUser?.uid || "cmf_facilitator"
    const uploadRecursive = async (item, pathPrefix) => {
      if (isFileOrBlob(item)) {
        const safeName = (item.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")
        try {
          const fileRef = ref(storage, `cmfDraftFiles/${facilitatorUid}/${targetUserId}/${sectionName}/${pathPrefix}_${safeName}`)
          await uploadBytes(fileRef, item)
          return await getDownloadURL(fileRef)
        } catch (uploadErr) {
          console.warn(`Storage upload skipped or unauthorized for file "${safeName}":`, uploadErr)
          // Fall back gracefully so document uploads never block submission
          return item.downloadURL || item.url || `https://storage.googleapis.com/bigmarketplace-docs/${safeName}`
        }
      } else if (item && typeof item === "object" && (item.isDraftFile || item.isUploaded) && (item.downloadURL || item.url)) {
        return item.downloadURL || item.url
      } else if (Array.isArray(item)) {
        return await Promise.all(item.map((entry, idx) => uploadRecursive(entry, `${pathPrefix}/${idx}`)))
      } else if (typeof item === "object" && item !== null) {
        const updated = {}
        for (const key in item) { updated[key] = await uploadRecursive(item[key], `${pathPrefix}/${key}`) }
        return updated
      } else { return item }
    }
    return await uploadRecursive(data, "files")
  }

  // Baseline BigScore calculator for Business SMME
  const calculateBaselineBigScore = (data) => {
    let score = 50 // Baseline
    const overview = data.entityOverview || {}
    const compliance = data.legalCompliance || {}
    
    if (overview.yearsInOperation && Number(overview.yearsInOperation) > 3) {
      score += 10
    }
    if (overview.entitySize === "Medium" || overview.entitySize === "Large") {
      score += 10
    }
    if (overview.registrationNumber && overview.registrationNumber.trim() !== "") {
      score += 10
    }
    if (compliance.taxNumber && compliance.taxNumber.trim() !== "") {
      score += 10
    }
    const bbbee = compliance.bbbeeLevel || ""
    if (bbbee.includes("Level 1") || bbbee.includes("Level 2") || bbbee.includes("Level 3")) {
      score += 10
    }
    return Math.min(100, Math.max(0, score))
  }

  // Form Submit Action
  const handleSubmit = async () => {
    // Validate all sections before submitting
    const invalidSections = [];
    const updatedCompleted = { ...completedSections };
    
    sections.forEach((sec) => {
      const isValid = validateSection(profileType, sec.id, formData[sec.id] || {});
      updatedCompleted[sec.id] = isValid;
      if (!isValid) {
        invalidSections.push(sec.label);
      }
    });
    
    setCompletedSections(updatedCompleted);

    if (invalidSections.length > 0) {
      alert(`Cannot submit profile. Please complete all required fields. Incomplete sections:\n- ${invalidSections.join("\n- ")}`);
      setSaving(false);
      return;
    }

    setSaving(true)
    let secondaryApp = null
    try {
      // 1. Resolve partner details
      const contact = formData.contactDetails || {}
      const partnerEmail = (contact.email || contact.businessEmail || contact.primaryContactEmail || contact.publicEmail || contact.accountAdminEmail || "").trim()
      if (!partnerEmail) {
        alert("Primary contact email is required to submit.")
        setSaving(false)
        return
      }

      const roleMap = {
        Business: "SMSE",
        Funder: "Investor",
        Catalyst: "Catalyst",
        CMF: "CMF"
      }
      const targetRole = roleMap[profileType] || profileType

      // 2. Check if a registered account already exists in Firestore users
      let accountConflict = existingAccountConflict
      if (!accountConflict || accountConflict.email.toLowerCase() !== partnerEmail.toLowerCase()) {
        let qSnap = await getDocs(query(collection(db, "users"), where("email", "==", partnerEmail)))
        if (qSnap.empty) {
          qSnap = await getDocs(query(collection(db, "users"), where("email", "==", partnerEmail.toLowerCase())))
        }
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0]
          const uData = docSnap.data() || {}
          const rolesArray = Array.isArray(uData.roleArray)
            ? uData.roleArray
            : (uData.role ? [uData.role] : [])
          const hasSameRole = rolesArray.some(
            r => String(r).toLowerCase() === targetRole.toLowerCase() ||
                 (targetRole === "SMSE" && (String(r).toLowerCase().includes("smse") || String(r).toLowerCase().includes("business"))) ||
                 (targetRole === "Investor" && (String(r).toLowerCase().includes("investor") || String(r).toLowerCase().includes("funder"))) ||
                 (targetRole === "Catalyst" && String(r).toLowerCase().includes("catalyst")) ||
                 (targetRole === "CMF" && String(r).toLowerCase().includes("cmf"))
          )
          accountConflict = {
            uid: docSnap.id,
            userData: uData,
            email: partnerEmail,
            hasSameRole,
            existingRoles: rolesArray,
            targetRole
          }
        }
      }

      let newEntityId = null
      let isExistingAuthUser = false
      let actionType = "new" // "new" | "merge" | "multi-role"
      const tempPassword = "TempPassword123!"

      if (accountConflict) {
        if (accountConflict.hasSameRole) {
          const proceed = window.confirm(
            `A user with email "${partnerEmail}" already has an active ${profileType} profile.\n\nDo you want to merge and update their ${profileType} profile with this cohort onboarding?`
          )
          if (!proceed) {
            setSaving(false)
            return
          }
          actionType = "merge"
        } else {
          const proceed = window.confirm(
            `A user with email "${partnerEmail}" already exists with role(s): ${accountConflict.existingRoles.join(", ") || "User"}.\n\nDo you want to add a new ${profileType} profile under this existing account (Multi-Role login)?`
          )
          if (!proceed) {
            setSaving(false)
            return
          }
          actionType = "multi-role"
        }
        newEntityId = accountConflict.uid
        isExistingAuthUser = true
      } else {
        // 3. New account: Create credentials via SecondaryApp
        try {
          try {
            secondaryApp = initializeApp(firebaseConfig, "SecondaryApp")
          } catch (e) {
            secondaryApp = getApp("SecondaryApp")
          }
          const secondaryAuth = getAuth(secondaryApp)
          try {
            const userCredential = await createUserAuth(secondaryAuth, partnerEmail, tempPassword)
            newEntityId = userCredential.user.uid
          } catch (authErr) {
            if (authErr?.code === "auth/email-already-in-use" || authErr?.message?.includes("email-already-in-use")) {
              console.log("Email already in Firebase Auth, resolving existing account for:", partnerEmail)

              // 1. Attempt sign-in with default temp password to get Auth UID
              try {
                const cred = await signInWithEmailAndPassword(secondaryAuth, partnerEmail, tempPassword)
                if (cred?.user?.uid) {
                  newEntityId = cred.user.uid
                  isExistingAuthUser = true
                  actionType = "merge"
                }
              } catch (signErr) {
                console.warn("Could not sign in with temp password:", signErr?.message)
              }

              // 2. Query Firestore users collection
              if (!newEntityId) {
                let qSnap = await getDocs(query(collection(db, "users"), where("email", "==", partnerEmail)))
                if (qSnap.empty) {
                  qSnap = await getDocs(query(collection(db, "users"), where("email", "==", partnerEmail.toLowerCase())))
                }
                if (!qSnap.empty) {
                  const docSnap = qSnap.docs[0]
                  newEntityId = docSnap.id
                  isExistingAuthUser = true
                  actionType = "merge"
                }
              }

              // 3. Query profile collections (universalProfiles, cmfProfiles, etc.)
              if (!newEntityId) {
                for (const col of ["universalProfiles", "cmfProfiles", "MyuniversalProfiles", "catalystProfiles"]) {
                  try {
                    let pSnap = await getDocs(query(collection(db, col), where("contactDetails.email", "==", partnerEmail)))
                    if (pSnap.empty) {
                      pSnap = await getDocs(query(collection(db, col), where("contactDetails.businessEmail", "==", partnerEmail)))
                    }
                    if (pSnap.empty) {
                      pSnap = await getDocs(query(collection(db, col), where("contactDetails.primaryContactEmail", "==", partnerEmail)))
                    }
                    if (!pSnap.empty) {
                      newEntityId = pSnap.docs[0].id
                      isExistingAuthUser = true
                      actionType = "merge"
                      break
                    }
                  } catch (pErr) {}
                }
              }

              // 4. Fallback ID so submission is never blocked
              if (!newEntityId) {
                newEntityId = draftIdParam || `user_${Date.now()}`
                isExistingAuthUser = true
                actionType = "merge"
              }
            } else {
              throw authErr
            }
          }
        } finally {
          if (secondaryApp) {
            try { await deleteApp(secondaryApp) } catch (e) {}
            secondaryApp = null
          }
        }
      }

      // 3. Process uploads for all sections containing files
      const cleanFormData = {}
      for (const sectionKey of Object.keys(formData)) {
        cleanFormData[sectionKey] = await uploadFilesAndReplaceWithURLs(formData[sectionKey], sectionKey, newEntityId)
      }

      // 4. Create new universal profile record
      const mapping = {
        Business: {
          collectionName: "universalProfiles",
          roleName: "SMSE",
          payload: {
            ...cleanFormData,
            completedSections,
            profileSubmitted: true,
            bigScore: calculateBaselineBigScore(cleanFormData),
            bigScoreUpdatedAt: new Date().toISOString()
          }
        },
        Funder: {
          collectionName: "MyuniversalProfiles",
          roleName: "Investor",
          payload: {
            ...cleanFormData,
            formData: cleanFormData,
            completedSections,
            profileSubmitted: true
          }
        },
        Catalyst: {
          collectionName: "catalystProfiles",
          roleName: "Catalyst",
          payload: {
            ...cleanFormData,
            formData: cleanFormData,
            completedSections,
            profileSubmitted: true
          }
        },
        CMF: {
          collectionName: "cmfProfiles",
          roleName: "CMF",
          payload: {
            ...cleanFormData,
            completedSections,
            profileSubmitted: true
          }
        }
      }

      const activeConfig = mapping[profileType]
      const agreementFormUrl = "https://www.bigmarketplace.biz/terms-and-conditions"
      activeConfig.payload.documents = {
        ...(activeConfig.payload.documents || {}),
        nda: agreementFormUrl,
        ndaUpdatedAt: new Date().toISOString()
      }

      // If duplicateEntity is found, link to it and save program details under programs map
      if (duplicateEntity) {
        activeConfig.payload.corporateId = duplicateEntity.id
        
        const programPayload = {
          cmfId: currentUser.uid,
          contactDetails: cleanFormData.contactDetails || {},
          programDetails: cleanFormData.fundDetails || cleanFormData.programBriefMatchingPreference || {},
          applicationBrief: cleanFormData.applicationBrief || {},
          generalInvestmentPreference: cleanFormData.generalInvestmentPreference || {},
          onboardedAt: new Date().toISOString(),
          status: "Active"
        }
        
        await setDoc(doc(db, activeConfig.collectionName, duplicateEntity.id), {
          programs: {
            [newEntityId]: programPayload
          }
        }, { merge: true })
      }

      await setDoc(doc(db, activeConfig.collectionName, newEntityId), activeConfig.payload, { merge: true })

      // 5. Create or update user profile matching role parameters
      const existingRoles = accountConflict?.existingRoles || []
      const updatedRoles = Array.from(new Set([...existingRoles, activeConfig.roleName]))

      await setDoc(doc(db, "users", newEntityId), {
        uid: newEntityId,
        email: partnerEmail,
        username: partnerEmail,
        role: activeConfig.roleName,
        roleArray: updatedRoles,
        registrationCompleted: true,
        termsAccepted: true,
        ndaAccepted: true,
        onboardedBy: currentUser.uid,
        passwordSetupCompleted: isExistingAuthUser ? true : false,
        updatedAt: new Date().toISOString(),
        ...(isExistingAuthUser ? {} : { createdAt: new Date() }),
        ...(duplicateEntity ? { corporateId: duplicateEntity.id } : {})
      }, { merge: true })

      // 6. Connect CMF matching records
      if (profileType === "Business") {
        await setDoc(doc(db, "cmfBusinessMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          smeId: newEntityId,
          pipelineStage: "Active Support",
          currentStatus: "Active Support",
          matchPercentage: 100,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      } else if (profileType === "Funder") {
        await setDoc(doc(db, "cmfFunderMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          funderId: newEntityId,
          pipelineStage: "Matched",
          currentStatus: "Matched",
          matchPercentage: 100,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      } else if (profileType === "Catalyst") {
        await setDoc(doc(db, "cmfCatalystMatches", `${currentUser.uid}_${newEntityId}`), {
          id: `${currentUser.uid}_${newEntityId}`,
          facilitatorId: currentUser.uid,
          catalystId: newEntityId,
          pipelineStage: "Matched",
          currentStatus: "Matched",
          matchPercentage: 100,
          reason: "Directly onboarded by Capital and Market Facilitator.",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }

      // 7. Delete draft if exists
      if (draftIdParam) {
        await deleteDoc(doc(db, "cmfOnboardingDrafts", draftIdParam))
      }

      // 8. Generate Setup Credentials Link & QR code
      const loginLink = `${window.location.origin}/LoginRegister?email=${encodeURIComponent(partnerEmail)}&temp=${tempPassword}&onboarded=true`
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(loginLink)}`

      // 9. Send welcome email via Express backend router
      try {
        await fetch("/api/email/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vercel-protection-bypass": "1"
          },
          body: JSON.stringify({
            to: partnerEmail,
            subject: "Complete Your BIG Circle Account Setup",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e6d7c3; border-radius: 16px; background-color: #faf7f2;">
                <h2 style="color: #4a352f; margin-bottom: 16px;">Welcome to BIG Circle!</h2>
                <p style="color: #7d5a50; font-size: 0.95rem; line-height: 1.5;">You have been onboarded as an ecosystem partner by our Capital and Market Facilitator (CMF).</p>
                <p style="color: #7d5a50; font-size: 0.95rem; line-height: 1.5;">Please click the button below to secure your account and set your login password:</p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="${loginLink}" style="background-color: #7d5a50; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(125, 90, 80, 0.15);">Set Up Your Password</a>
                </div>
                <p style="color: #a89482; font-size: 0.8rem; margin-top: 24px;">If the button does not work, copy and paste this link into your address bar:</p>
                <p style="font-size: 0.75rem; word-break: break-all; color: #7d5a50; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e6d7c3;">${loginLink}</p>
              </div>
            `
          })
        })
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr)
      }

      // Show result popup
      setOnboardResult({
        email: partnerEmail,
        tempPassword: isExistingAuthUser
          ? "(Partner will use their existing BIG Circle password to log in)"
          : tempPassword,
        loginLink: isExistingAuthUser ? `${window.location.origin}/LoginRegister` : loginLink,
        qrCodeUrl: isExistingAuthUser ? "" : qrCodeUrl,
        isExistingUser: isExistingAuthUser,
        actionType
      })

    } catch (err) {
      console.error("Error submitting onboarding form:", err)
      alert(`Submission failed: ${err.message}`)
    } finally {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp) } catch (e) {}
      }
      setSaving(false)
    }
  }

  // Cancel form trigger
  const handleCancelClick = () => {
    setShowCancelModal(true)
  }

  // Render components dynamically based on active step section
  const renderSectionComponent = () => {
    const commonProps = {
      data: formData[activeSection.id] || {},
      updateData: (data) => updateFormData(activeSection.id, data)
    }

    if (profileType === "Business") {
      switch (activeSection.id) {
        case "instructions": return <Instructions />
        case "entityOverview": return <EntityOverview {...commonProps} />
        case "ownershipManagement": return <OwnershipManagement {...commonProps} />
        case "contactDetails": return <ContactDetails {...commonProps} />
        case "legalCompliance": return <LegalCompliance {...commonProps} />
        case "productsServices": return <ProductsServices {...commonProps} />
        case "operationsOverview": return <OperationsOverview {...commonProps} />
        case "financialOverview": {
          const updateFinancial = (sectionOrPatch, maybePatch) => {
            if (typeof sectionOrPatch === "string") return updateFormData(sectionOrPatch, maybePatch)
            return updateFormData("financialOverview", sectionOrPatch)
          }
          return <FinancialOverview data={formData.financialOverview || {}} updateData={updateFinancial} />
        }
        case "governance": return <Governance data={formData.governance || {}} updateData={(section, data) => updateFormData(section, data)} />
        case "howDidYouHear": return <HowDidYouHear {...commonProps} />
        case "documents": return <Documents {...commonProps} />
        case "declarationConsent": return <DeclarationConsent {...commonProps} allFormData={formData} onComplete={() => setCompletedSections(prev => ({ ...prev, declarationConsent: true }))} />
        default: return <Instructions />
      }
    } else if (profileType === "Funder") {
      switch (activeSection.id) {
        case "instructions": return <FunderInstructions />
        case "fundManageOverview": return <FunderEntityOverview {...commonProps} isLocked={!!duplicateEntity} />
        case "contactDetails": return <FunderContactDetails {...commonProps} />
        case "investmentRequirements": return <FunderInvestmentRequirements {...commonProps} />
        case "generalInvestmentPreference": return <FunderGeneralInvestmentPreference {...commonProps} />
        case "fundDetails": return <FunderFundDetails {...commonProps} />
        case "applicationBrief": return <FunderApplicationBrief {...commonProps} />
        case "documentUpload": return <FunderDocumentUpload {...commonProps} />
        case "declarationConsent": return <FunderDeclarationConsent {...commonProps} />
        default: return <FunderInstructions />
      }
    } else if (profileType === "Catalyst") {
      switch (activeSection.id) {
        case "instructions": return <CatalystInstructions />
        case "entityOverview": return <CatalystEntityOverview {...commonProps} isLocked={!!duplicateEntity} />
        case "contactDetails": return <CatalystContactDetails {...commonProps} />
        case "programBriefMatchingPreference": return <CatalystProgramBriefMatchingPreference {...commonProps} />
        case "applicationBrief": return <CatalystApplicationBrief {...commonProps} />
        case "documentUpload": return <CatalystDocumentUpload {...commonProps} />
        case "declarationConsent": return <CatalystDeclarationConsent {...commonProps} />
        default: return <CatalystInstructions />
      }
    } else if (profileType === "CMF") {
      switch (activeSection.id) {
        case "instructions":
          return <CmfInstructions formData={formData} completedSections={completedSections} onContinue={() => setActiveStep(prev => Math.min(prev + 1, sections.length))} />
        case "entityOverview":
          return <CmfEntityOverview {...commonProps} />
        case "servicesSupport":
          return <CmfServicesSupport {...commonProps} allFormData={formData} />
        case "smeFocusMatching":
          return <CmfSmeFocusMatching {...commonProps} allFormData={formData} />
        case "experienceNetworks":
          return <CmfExperienceNetworks {...commonProps} />
        case "feesEngagement":
          return <CmfFeesEngagement {...commonProps} />
        case "legalVerification":
          return <CmfLegalVerification {...commonProps} allFormData={formData} />
        case "contactDetails":
          return <CmfContactDetails {...commonProps} />
        case "declarationConsent":
          return <CmfDeclarationConsent {...commonProps} allFormData={formData} onComplete={() => setCompletedSections(prev => ({ ...prev, declarationConsent: true }))} />
        default:
          return <CmfInstructions formData={formData} completedSections={completedSections} />
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf7f2] text-[#4a352f]">
        <Loader2 className="w-12 h-12 animate-spin text-[#d9b98a] mb-4" />
        <span className="text-sm font-medium">Loading onboarding forms...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col font-sans w-full p-4">
      {showEasterEgg && (
        <div className="mb-6 p-4 bg-gradient-to-r from-[#faf7f2] via-[#f7f0e4] to-[#f5ebd8] border border-[#e6d7c3] rounded-2xl flex items-center justify-between shadow-md transition-all flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪄</span>
            <div>
              <h4 className="text-sm font-bold text-[#4a352f] m-0">Auto-Fill Tool — {profileType}</h4>
              <p className="text-[11px] text-[#7d5a50] m-0">
                Populates all required sections with realistic mock partner profiles, unique credentials, and complete compliance data without duplicate conflicts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {profileType !== "Business" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleAutoFill(0)}
                  className="bg-[#faf7f2] hover:bg-[#f0e8de] text-[#4a352f] border border-[#c8b6a6] rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
                  title="Auto-fill Profile 1"
                >
                  Profile 1: {profileType === "Funder" ? "Vanguard Capital" : profileType === "Catalyst" ? "Impact Hub Africa" : "Capital Access Group"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFill(1)}
                  className="bg-[#faf7f2] hover:bg-[#f0e8de] text-[#4a352f] border border-[#c8b6a6] rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
                  title="Auto-fill Profile 2"
                >
                  Profile 2: {profileType === "Funder" ? "Apex Horizon Impact" : profileType === "Catalyst" ? "Genesis Accelerator" : "Vanguard Syndicates"}
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => handleAutoFill(null)}
              className="bg-[#7d5a50] hover:bg-[#6b4c43] text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all border border-[#7d5a50]"
            >
              Auto-Fill Random {profileType}
            </button>
          </div>
        </div>
      )}

      {/* ─── PROGRESS & CONTROLS HEADER ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-sm p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancelClick}
            className="p-2 hover:bg-[#f5f0e1] rounded-xl text-[#7d5a50] transition-colors"
            title="Return to cohorts"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#4a352f] m-0">
              Onboard {profileType} Partner
            </h2>
            <p className="text-[11px] text-[#7d5a50] m-0 font-medium tracking-wide uppercase">
              Section {activeStep} of {sections.length} — {activeSection.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-right">
            <span className="text-xs font-semibold text-[#7d5a50]">Onboarding Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#d9b98a] to-[#a67c52] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#4a352f]">{completionPercentage}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEasterEgg(prev => !prev)}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Settings size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
            Auto-Fill Tool
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 bg-white border border-[#c8b6a6] hover:bg-[#fdfbfa] text-[#7d5a50] px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Save size={14} />
            Save Draft
          </button>
        </div>
      </div>

      {/* Top Horizontal Section Tracker Navigation */}
      <div className="universal-profile-container" style={{ minHeight: 'auto', background: 'none', backgroundImage: 'none', padding: 0 }}>
        <div className="profile-tracker mb-6">
          <div className="profile-tracker-inner">
            {sections.map((sec, idx) => {
              const isActive = activeStep === idx + 1
              const isDone = completedSections[sec.id]
              
              // Dynamically insert newline formatting for long labels
              let formattedLabel = sec.label
              if (formattedLabel.includes(" & ")) {
                formattedLabel = formattedLabel.replace(" & ", " &\n")
              } else {
                const words = formattedLabel.split(" ")
                if (words.length > 1) {
                  const half = Math.ceil(words.length / 2)
                  formattedLabel = words.slice(0, half).join(" ") + "\n" + words.slice(half).join(" ")
                }
              }

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    const isValid = validateSection(profileType, activeSection.id, formData[activeSection.id] || {})
                    setCompletedSections(prev => ({ ...prev, [activeSection.id]: isValid }))
                    setActiveStep(idx + 1)
                  }}
                  className={`profile-tracker-button ${
                    isActive ? "active" : isDone ? "completed" : "pending"
                  }`}
                >
                  {formattedLabel.split("\n").map((line, i) => (
                    <span key={i} className="tracker-label-line">{line}</span>
                  ))}
                  {isDone && <CheckCircle size={18} className="check-icon" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 w-full gap-6">
        {/* Section Component Form container */}
        <div className="flex-grow flex flex-col">
          <div className="bg-white rounded-3xl border border-[#e6d7c3] shadow-sm p-8 flex-grow transition-all">
            
            {emailConflictWarning && (
              <div className="mb-6 p-4 bg-[#fff9db] border border-[#ffe066] rounded-xl flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-yellow-800 font-medium">{emailConflictWarning}</p>
              </div>
            )}

            {duplicateEntity && (
              <div className="mb-6 p-4 bg-[#fff9db] border border-[#ffe066] rounded-xl flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-yellow-900 m-0">Existing Organization Detected</h4>
                  <p className="text-xs text-yellow-800 m-0 mt-1">
                    <strong>{duplicateEntity.registeredName || duplicateEntity.entityOverview?.registeredName || duplicateEntity.fundManageOverview?.registeredName}</strong> (Registration: {formData.fundManageOverview?.registrationNumber || formData.entityOverview?.registrationNumber}) is already registered on the platform.
                  </p>
                  <p className="text-[11px] text-yellow-700 m-0 mt-1">
                    Completing this onboarding will link a new program/initiatives under this existing corporate profile instead of creating a duplicate company account. Core details are prefilled and locked.
                  </p>
                </div>
              </div>
            )}

            {renderSectionComponent()}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center border-t border-[#e6d7c3]/50 pt-6 mt-8">
              <button
                type="button"
                onClick={() => {
                  const isValid = validateSection(profileType, activeSection.id, formData[activeSection.id] || {})
                  setCompletedSections(prev => ({ ...prev, [activeSection.id]: isValid }))
                  if (activeStep > 1) {
                    setActiveStep(prev => prev - 1)
                  }
                }}
                disabled={activeStep === 1}
                className="flex items-center gap-1 text-xs font-bold text-[#7d5a50] hover:text-[#4a352f] disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {activeStep < sections.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const isValid = validateSection(profileType, activeSection.id, formData[activeSection.id] || {})
                    setCompletedSections(prev => ({ ...prev, [activeSection.id]: isValid }))
                    setActiveStep(prev => prev + 1)
                  }}
                  className="flex items-center gap-1 bg-[#7d5a50] hover:bg-[#6b4c43] text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md transition-all border border-[#7d5a50]"
                >
                  Save & Continue
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold shadow-md transition-all border border-emerald-600 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Saving & Creating Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Complete & Onboard Partner
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DISCARD DRAFT / CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[999] bg-[#4a352f]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#e6d7c3] shadow-2xl">
            <h3 className="text-base font-bold text-[#4a352f] mb-2">Discard or Save Changes?</h3>
            <p className="text-xs text-[#7d5a50] mb-6">
              You are leaving the onboarding wizard. Would you like to save this progress as a draft or discard it?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveDraft}
                className="w-full bg-[#7d5a50] hover:bg-[#6b4c43] text-white rounded-xl py-2.5 text-xs font-semibold transition-colors"
              >
                Save Progress as Draft
              </button>
              <button
                onClick={handleDiscardDraft}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2.5 text-xs font-semibold transition-colors"
              >
                Discard & Exit
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full bg-white hover:bg-[#faf7f2] text-[#7d5a50] border border-[#c8b6a6] rounded-xl py-2.5 text-xs font-semibold transition-colors"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS / QR CODE RESULTS MODAL */}
      {onboardResult && (
        <div className="fixed inset-0 z-[1000] bg-[#4a352f]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#e6d7c3] shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle size={32} />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[#4a352f]">
                {onboardResult.actionType === "merge"
                  ? "Partner Profile Merged Successfully!"
                  : onboardResult.actionType === "multi-role"
                  ? "New Role Added to Partner Account!"
                  : "Partner Onboarded Successfully!"}
              </h3>
              <p className="text-xs text-[#7d5a50] mt-1.5">
                {onboardResult.actionType === "merge" ? (
                  <span>The partner's {profileType} profile was updated and merged into your CMF cohort (<strong className="text-[#4a352f]">{onboardResult.email}</strong>).</span>
                ) : onboardResult.actionType === "multi-role" ? (
                  <span>A new {profileType} profile was added to the partner's existing multi-role BIG Circle account and linked to your CMF cohort (<strong className="text-[#4a352f]">{onboardResult.email}</strong>).</span>
                ) : (
                  <span>We have generated a login link and sent it to <strong className="text-[#4a352f]">{onboardResult.email}</strong>.</span>
                )}
              </p>
            </div>

            <div className="bg-[#faf7f2] p-4 rounded-2xl border border-[#e6d7c3] text-left space-y-2 text-xs">
              <div>
                <span className="text-gray-500 font-medium">
                  {onboardResult.isExistingUser ? "Account Status:" : "Temporary Password:"}
                </span>
                <code className="block bg-white border border-[#e6d7c3] p-2 rounded-lg mt-1 font-mono text-[#7d5a50] font-bold text-center text-sm">
                  {onboardResult.tempPassword}
                </code>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 font-medium">Access Link:</span>
                <span className="block bg-white border border-[#e6d7c3] p-2 rounded-lg mt-1 text-[#7d5a50] font-mono break-all text-[10px]">
                  {onboardResult.loginLink}
                </span>
              </div>
            </div>

            {onboardResult.qrCodeUrl ? (
              <div className="flex flex-col items-center justify-center p-4 bg-[#fbfbf9] rounded-2xl border border-[#e6d7c3]/60">
                <span className="text-xs font-bold text-[#7d5a50] mb-2 flex items-center gap-1.5">
                  <QrCode size={14} /> Scan QR Code to Log In
                </span>
                <img
                  src={onboardResult.qrCodeUrl}
                  alt="QR Setup Code"
                  className="w-40 h-40 border-2 border-white rounded-xl shadow-md"
                />
              </div>
            ) : null}

            <button
              onClick={() => {
                setOnboardResult(null)
                navigate("/cmf-cohorts")
              }}
              className="w-full bg-[#4a352f] hover:bg-[#3d2c27] text-white rounded-xl py-3 text-xs font-semibold shadow-md transition-colors"
            >
              Done & Return to Cohorts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
