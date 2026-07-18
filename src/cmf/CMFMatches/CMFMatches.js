import React, { useState } from "react"
import CMFDealFlowPipeline from "./CMFDealFlowPipeline"
import CMFTabbedTables from "./CMFTabbedTables"
import CMFFilter from "./CMFFilter"

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
    name: "Willie Technologies",
    location: "Gauteng",
    sector: "Technology",
    fundingStage: "Startup",
    fundingRequired: "-",
    fundingAmount: 0,
    equityOffered: "5%",
    guarantees: "None",
    supportRequired: "Compliance audit assistance",
    servicesRequired: "Deal Readiness",
    applicationDate: "2026-01-22",
    pipelineStage: "Matched",
    currentStatus: "Withdrawn",
    matchPercentage: 50,
    bigScore: 13,
    compliance: 15,
    legitimacy: 10,
    fundability: 15,
    leadership: 10,
    pis: 15,
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
    pipelineStage: "Admitted",
    currentStatus: "Admitted",
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
  }
]

export default function CMFMatches() {
  const [smeMatches, setSmeMatches] = useState(INITIAL_MOCK_SMES)
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

  const handleUpdateStage = (smeId, newStage) => {
    setSmeMatches(prev => 
      prev.map(item => {
        if (item.id === smeId) {
          return {
            ...item,
            pipelineStage: newStage,
            currentStatus: newStage
          }
        }
        return item
      })
    )
  }

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
            smeMatches={smeMatches} 
            loading={false} 
            onStageClick={setStageFilter} 
          />
        </div>

        {/* Filters */}
        <CMFFilter filters={filters} onFilterChange={handleFilterChange} />

        {/* Tabbed Tables */}
        <div className="w-full max-w-full mb-6">
          <CMFTabbedTables
            filters={filters}
            stageFilter={stageFilter}
            smeMatches={smeMatches}
            loading={false}
            onUpdateStage={handleUpdateStage}
            onStageOverride={setStageOverrides}
          />
        </div>
      </div>
    </div>
  )
}
