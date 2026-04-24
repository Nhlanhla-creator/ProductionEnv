// structure/surveysStructure.js

export const SURVEYS_STRUCTURE = [
  {
    id: "member-feedback",
    name: "Member Feedback",
    type: "folder",
    icon: "📊",
    children: [
      { id: "annual-survey", name: "Annual Survey 2024", type: "file", icon: "📋", path: ["Surveys", "Member Feedback", "Annual Survey 2024"] },
      { id: "satisfaction-survey", name: "Satisfaction Survey Q4", type: "file", icon: "📋", path: ["Surveys", "Member Feedback", "Satisfaction Survey Q4"] },
      { id: "needs-assessment", name: "Needs Assessment Survey", type: "file", icon: "📋", path: ["Surveys", "Member Feedback", "Needs Assessment Survey"] },
    ]
  },
  {
    id: "program-evaluation",
    name: "Program Evaluation",
    type: "folder",
    icon: "🎯",
    children: [
      { id: "training-feedback", name: "Training Feedback Form", type: "file", icon: "📋", path: ["Surveys", "Program Evaluation", "Training Feedback Form"] },
      { id: "workshop-evaluation", name: "Workshop Evaluation", type: "file", icon: "📋", path: ["Surveys", "Program Evaluation", "Workshop Evaluation"] },
      { id: "event-feedback", name: "Event Feedback Survey", type: "file", icon: "📋", path: ["Surveys", "Program Evaluation", "Event Feedback Survey"] },
    ]
  },
  {
    id: "partner-surveys",
    name: "Partner Surveys",
    type: "folder",
    icon: "🤝",
    children: [
      { id: "partner-satisfaction", name: "Partner Satisfaction Survey", type: "file", icon: "📋", path: ["Surveys", "Partner Surveys", "Partner Satisfaction Survey"] },
      { id: "collaboration-feedback", name: "Collaboration Feedback", type: "file", icon: "📋", path: ["Surveys", "Partner Surveys", "Collaboration Feedback"] },
    ]
  },
  {
    id: "impact-assessment",
    name: "Impact Assessment",
    type: "folder",
    icon: "📈",
    children: [
      { id: "economic-impact", name: "Economic Impact Survey", type: "file", icon: "📋", path: ["Surveys", "Impact Assessment", "Economic Impact Survey"] },
      { id: "social-impact", name: "Social Impact Assessment", type: "file", icon: "📋", path: ["Surveys", "Impact Assessment", "Social Impact Assessment"] },
      { id: "employment-survey", name: "Employment Impact Survey", type: "file", icon: "📋", path: ["Surveys", "Impact Assessment", "Employment Impact Survey"] },
    ]
  },
  {
    id: "survey-templates",
    name: "Survey Templates",
    type: "folder",
    icon: "📝",
    children: [
      { id: "template-onboarding", name: "Onboarding Survey Template", type: "file", icon: "📋", path: ["Surveys", "Survey Templates", "Onboarding Survey Template"] },
      { id: "template-exit", name: "Exit Survey Template", type: "file", icon: "📋", path: ["Surveys", "Survey Templates", "Exit Survey Template"] },
      { id: "template-nps", name: "NPS Survey Template", type: "file", icon: "📋", path: ["Surveys", "Survey Templates", "NPS Survey Template"] },
    ]
  }
];