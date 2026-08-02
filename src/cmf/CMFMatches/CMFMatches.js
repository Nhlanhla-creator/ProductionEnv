import React, { useState } from "react"
import CMFDealFlowPipeline from "./CMFDealFlowPipeline"
import CMFTabbedTables from "./CMFTabbedTables"

import { useCMFMatches } from "./CMFMatchesContext"

// (Keep INITIAL_MOCK_SMES, INITIAL_MOCK_FUNDERS, INITIAL_MOCK_CATALYSTS)
// ... (I'll keep the mock lists to act as fallback/mock data)


const INITIAL_MOCK_SMES = [
  {
    id: "sme_1",
    name: "BuildPro Construction (Pty) Ltd",
    location: "Gauteng",
    sector: "Construction",
    fundingStage: "Startup",
    fundingRequired: "R1.5M",
    fundingAmount: 1500000,
    equityOffered: "10%",
    guarantees: "Directors Surety",
    supportRequired: "Tech support & operations help",
    servicesRequired: "Advisory",
    applicationDate: "2026-03-05",
    pipelineStage: "Matched",
    currentStatus: "Declined",
    matchPercentage: 50,
    bigScore: 35,
    compliance: 40,
    legitimacy: 30,
    fundability: 35,
    leadership: 40,
    pis: 30,
    lastActivity: "N/A"
  },
  {
    id: "sme_2",
    name: "yale",
    location: "Western Cape",
    sector: "Technology",
    fundingStage: "Startup",
    fundingRequired: "R10.0M",
    fundingAmount: 10000000,
    equityOffered: "15%",
    guarantees: "IP Pledge",
    supportRequired: "Marketing help & corporate structuring",
    servicesRequired: "Corporate Connections",
    applicationDate: "2025-11-03",
    pipelineStage: "Evaluation",
    currentStatus: "Evaluation",
    matchPercentage: 38,
    bigScore: 21,
    compliance: 25,
    legitimacy: 20,
    fundability: 20,
    leadership: 25,
    pis: 15,
    lastActivity: "2026-07-17T10:31:56.820Z"
  },
  {
    id: "sme_3",
    name: "EcoPower CleanTech",
    location: "Eastern Cape",
    sector: "CleanTech",
    fundingStage: "Growth Stage",
    fundingRequired: "R2.8M",
    fundingAmount: 2800000,
    equityOffered: "15%",
    guarantees: "IP Patent Pledge",
    supportRequired: "IP protection patent audits & capital structuring",
    servicesRequired: "Deal Readiness",
    applicationDate: "2026-06-01",
    pipelineStage: "Exit",
    currentStatus: "Exit",
    matchPercentage: 91,
    bigScore: 86,
    compliance: 88,
    legitimacy: 82,
    fundability: 88,
    leadership: 85,
    pis: 85,
    lastActivity: "N/A"
  },
  {
    id: "sme_4",
    name: "MandlaTech Solutions (Pty) Ltd",
    location: "KwaZulu-Natal",
    sector: "Technology",
    fundingStage: "Startup",
    fundingRequired: "R1.0M",
    fundingAmount: 1000000,
    equityOffered: "8%",
    guarantees: "Personal Surety",
    supportRequired: "Market expansion help",
    servicesRequired: "Advisory",
    applicationDate: "2026-03-02",
    pipelineStage: "Offer",
    currentStatus: "Offer",
    matchPercentage: 63,
    bigScore: 59,
    compliance: 60,
    legitimacy: 55,
    fundability: 60,
    leadership: 65,
    pis: 55,
    lastActivity: "N/A"
  },
  {
    id: "sme_5",
    name: "Siyakhula Logistics",
    location: "Eastern Cape",
    sector: "Logistics",
    fundingStage: "Growth Stage",
    fundingRequired: "R3.0M",
    fundingAmount: 3000000,
    equityOffered: "12%",
    guarantees: "Vehicle Fleet Lien",
    supportRequired: "Fleet management software",
    servicesRequired: "Corporate Connections",
    applicationDate: "2026-02-18",
    pipelineStage: "Active",
    currentStatus: "Active",
    matchPercentage: 88,
    bigScore: 82,
    compliance: 85,
    legitimacy: 80,
    fundability: 85,
    leadership: 85,
    pis: 80,
    lastActivity: "N/A"
  },
  {
    id: "sme_6",
    name: "Zama Foods",
    location: "Free State",
    sector: "Agriculture",
    fundingStage: "Startup",
    fundingRequired: "R500K",
    fundingAmount: 500000,
    equityOffered: "20%",
    guarantees: "Asset mortgage",
    supportRequired: "Farming inputs assistance",
    servicesRequired: "Deal Readiness",
    applicationDate: "2026-05-10",
    pipelineStage: "Matched",
    currentStatus: "Declined",
    matchPercentage: 70,
    bigScore: 61,
    compliance: 65,
    legitimacy: 60,
    fundability: 60,
    leadership: 65,
    pis: 60,
    lastActivity: "N/A"
  },
  {
    id: "sme_7",
    name: "BlueSky Logistics",
    location: "Western Cape",
    sector: "Retail",
    fundingStage: "Early Stage",
    fundingRequired: "R2.5M",
    fundingAmount: 2500000,
    equityOffered: "10%",
    guarantees: "Vehicle Fleet pledge",
    supportRequired: "Strategic expansion and supply chain consulting",
    servicesRequired: "Advisory",
    applicationDate: "2026-06-25",
    pipelineStage: "Active",
    currentStatus: "Active",
    matchPercentage: 90,
    bigScore: 84,
    compliance: 85,
    legitimacy: 80,
    fundability: 85,
    leadership: 85,
    pis: 80,
    lastActivity: "N/A"
  }
]

const INITIAL_MOCK_FUNDERS = [
  {
    id: "funder_1",
    name: "Vantage Capital Partners",
    type: "Venture Capital",
    location: "Gauteng",
    fundingRange: "R5.0M - R25.0M",
    sectors: ["Technology", "Telecommunications", "Health"],
    matchPercentage: 92,
    contactPerson: "Sarah Jenkins",
    email: "s.jenkins@vantage.co.za",
    description: "Vantage Capital provides non-dilutive growth capital to mid-market businesses across Africa, specializing in tech and telecom infrastructure.",
    status: "Matched"
  },
  {
    id: "funder_2",
    name: "Seba Growth Fund",
    type: "Private Equity",
    location: "Western Cape",
    fundingRange: "R2.0M - R10.0M",
    sectors: ["Logistics", "Manufacturing", "Retail"],
    matchPercentage: 85,
    contactPerson: "Dumisani Khumalo",
    email: "dumi@sebagrowth.com",
    description: "Seba Growth Fund is an impact-first private equity fund targeting high-potential logistics and manufacturing suppliers in South Africa.",
    status: "Matched"
  },
  {
    id: "funder_3",
    name: "Green Energy Fund Africa",
    type: "Impact Grant",
    location: "National",
    fundingRange: "R500K - R3.0M",
    sectors: ["Agriculture", "Renewables", "Water Tech"],
    matchPercentage: 78,
    contactPerson: "Elena Rostova",
    email: "e.rostova@gefa.org",
    description: "GEFA distributes green grants and technical support to off-grid renewables and smart agriculture startups across sub-Saharan Africa.",
    status: "Matched"
  },
  {
    id: "funder_4",
    name: "Anglo American Zimele",
    type: "Corporate ESD",
    location: "Limpopo",
    fundingRange: "R1.0M - R5.0M",
    sectors: ["Mining Services", "Logistics", "Engineering"],
    matchPercentage: 74,
    contactPerson: "Tshepo Mashaba",
    email: "tshepo.mashaba@anglo.com",
    description: "Anglo American Zimele helps fund local supplier enterprises located in and around mine hosting communities, focusing on operational readiness.",
    status: "Matched"
  }
]

const INITIAL_MOCK_CATALYSTS = [
  {
    id: "catalyst_1",
    name: "Seda Tech Incubator",
    type: "Incubator",
    location: "Gauteng",
    focus: "Technical Advisory & Workspaces",
    sectors: ["Technology", "Information Systems"],
    matchPercentage: 95,
    contactPerson: "Linda Naidoo",
    email: "l.naidoo@seda.org.za",
    description: "Seda Tech Incubator offers physical space, high-speed fiber, and structured systems development mentoring for young digital innovators.",
    status: "Matched"
  },
  {
    id: "catalyst_2",
    name: "Red Bull Amaphiko",
    type: "Accelerator",
    location: "Western Cape",
    focus: "Marketing, Branding & Social Impact",
    sectors: ["Creatives", "Social Enterprise", "FMCG"],
    matchPercentage: 88,
    contactPerson: "Marc van der Merwe",
    email: "marc.vdmerwe@redbull.com",
    description: "A global program that supports social entrepreneurs using creativity, branding, storytelling, and media scaling to drive grassroots change.",
    status: "Matched"
  },
  {
    id: "catalyst_3",
    name: "Founders Factory Africa",
    type: "Venture Builder",
    location: "National",
    focus: "Product Scaling & Tech Talent",
    sectors: ["Fintech", "Healthtech", "Logistics"],
    matchPercentage: 82,
    contactPerson: "Naledi Dlamini",
    email: "naledi@foundersfactory.co.za",
    description: "Founders Factory Africa designs, builds, and scales early-stage ventures with direct engineering, product design, and business development desks.",
    status: "Matched"
  },
  {
    id: "catalyst_4",
    name: "SAB Foundation Boost",
    type: "Enterprise Development",
    location: "KwaZulu-Natal",
    focus: "Mentorship & Corporate Supply Chains",
    sectors: ["Agriculture", "Manufacturing", "Tourism"],
    matchPercentage: 79,
    contactPerson: "Gugu Mtshali",
    email: "gugu.mtshali@sab.co.za",
    description: "SAB Foundation Boost supports black-owned businesses with intensive mentorship, market access, and soft loans to enter larger supply chains.",
    status: "Matched"
  }
]

export default function CMFMatches() {
  const { smeMatches, funderMatches, catalystMatches, loading, updateMatchStage } = useCMFMatches()
  const [stageFilter, setStageFilter] = useState(null)
  const [stageOverrides, setStageOverrides] = useState([])

  const [filters, setFilters] = useState({
    location: "",
    matchScore: 0,
    minValue: "",
    maxValue: "",
    instruments: [],
    stages: [],
    sectors: [],
    supportTypes: [],
    smeType: "",
    sortBy: "",
  })

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const displaySMEs = smeMatches || []

  return (
    <div
      className="w-full min-h-screen p-8 box-border font-sans"
      style={{
        backgroundImage: "url('../../assets/BiGBackround.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="w-full max-w-full m-0 box-border">
        {/* DealFlow Pipeline */}
        <div className="w-full max-w-full mb-6">
          <CMFDealFlowPipeline 
            smeMatches={displaySMEs} 
            loading={loading} 
            onStageClick={setStageFilter} 
          />
        </div>

     

        {/* Tabbed Tables */}
        <div className="w-full max-w-full mb-6">
          <CMFTabbedTables
         
            stageFilter={stageFilter}
            smeMatches={displaySMEs}
            funderMatches={funderMatches}
            catalystMatches={catalystMatches}
            loading={loading}
            onUpdateStage={updateMatchStage}
            onStageOverride={setStageOverrides}
          />
        </div>
      </div>
    </div>
  )
}
