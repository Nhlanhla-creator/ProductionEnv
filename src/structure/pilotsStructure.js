// structure/pilotsStructure.js

export const PILOTS_STRUCTURE = [
  {
    id: "active-pilots",
    name: "Active Pilots",
    type: "folder",
    icon: "🔄",
    children: [
      { id: "pilot1", name: "Digital Transformation Pilot", type: "file", icon: "📊", path: ["Pilots & Case Studies", "Active Pilots", "Digital Transformation Pilot"] },
      { id: "pilot2", name: "Green Energy Initiative", type: "file", icon: "🌱", path: ["Pilots & Case Studies", "Active Pilots", "Green Energy Initiative"] },
      { id: "pilot3", name: "Skills Development Program", type: "file", icon: "🎓", path: ["Pilots & Case Studies", "Active Pilots", "Skills Development Program"] },
    ]
  },
  {
    id: "completed-pilots",
    name: "Completed Pilots",
    type: "folder",
    icon: "✅",
    children: [
      { id: "pilot-results1", name: "Market Access Pilot - Results", type: "file", icon: "📈", path: ["Pilots & Case Studies", "Completed Pilots", "Market Access Pilot - Results"] },
      { id: "pilot-results2", name: "Funding Readiness Pilot - Results", type: "file", icon: "💰", path: ["Pilots & Case Studies", "Completed Pilots", "Funding Readiness Pilot - Results"] },
    ]
  },
  {
    id: "case-studies",
    name: "Case Studies",
    type: "folder",
    icon: "📖",
    children: [
      { id: "case-study1", name: "SME Success: TechStart Solutions", type: "file", icon: "🏆", path: ["Pilots & Case Studies", "Case Studies", "SME Success: TechStart Solutions"] },
      { id: "case-study2", name: "Investor Success: Capital Group", type: "file", icon: "📈", path: ["Pilots & Case Studies", "Case Studies", "Investor Success: Capital Group"] },
      { id: "case-study3", name: "Catalyst Impact: Accelerator Program", type: "file", icon: "🚀", path: ["Pilots & Case Studies", "Case Studies", "Catalyst Impact: Accelerator Program"] },
    ]
  },
  {
    id: "testimonials",
    name: "Testimonials",
    type: "folder",
    icon: "💬",
    children: [
      { id: "sme-testimonials", name: "SME Testimonials", type: "file", icon: "🏢", path: ["Pilots & Case Studies", "Testimonials", "SME Testimonials"] },
      { id: "investor-testimonials", name: "Investor Testimonials", type: "file", icon: "💰", path: ["Pilots & Case Studies", "Testimonials", "Investor Testimonials"] },
      { id: "partner-testimonials", name: "Partner Testimonials", type: "file", icon: "🤝", path: ["Pilots & Case Studies", "Testimonials", "Partner Testimonials"] },
    ]
  },
  {
    id: "pilot-proposals",
    name: "Pilot Proposals",
    type: "folder",
    icon: "📝",
    children: [
      { id: "proposal1", name: "AI for SMEs - Proposal", type: "file", icon: "🤖", path: ["Pilots & Case Studies", "Pilot Proposals", "AI for SMEs - Proposal"] },
      { id: "proposal2", name: "Export Readiness Program", type: "file", icon: "🌍", path: ["Pilots & Case Studies", "Pilot Proposals", "Export Readiness Program"] },
    ]
  }
];