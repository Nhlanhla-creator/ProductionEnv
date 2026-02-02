import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  Star,
  RefreshCw,
  User,
  Zap,
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Edit2,
  Save,
  X,
  Trash2
} from 'lucide-react';

// ============================================================================
// INITIAL DATA STRUCTURE
// ============================================================================

const INITIAL_SPRINTS_DATA = {
  0: {
    id: 0,
    name: "Sprint 0",
    subtitle:
      "Alignment and Planning - Finalize architecture, flows, and team tools.",
    tasks: [
      {
        id: "SP0.1",
        action: "Design SME/funder intake wireframes",
        category: ["Frontend"],
        dependencies: "None",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-04-15",
        endDate: "2025-04-18",
        status: "Done",
      },
      {
        id: "SP0.2",
        action: "Draft BIG Score criteria & QA templates",
        category: ["QA"],
        dependencies: "None",
        assignee: ["Lerato Nama"],
        startDate: "2025-04-18",
        endDate: "2025-04-19",
        status: "Done",
      },
      {
        id: "SP0.3",
        action: "Firebase project setup (Auth, DB structure)",
        category: ["Backend"],
        dependencies: "None",
        assignee: ["Makha", "Lindelani"],
        startDate: "2025-04-15",
        endDate: "2025-04-27",
        status: "Done",
      },
      {
        id: "SP0.4",
        action: "Define backend API flows (score logic, profiles)",
        category: ["Backend"],
        dependencies: "Firebase setup",
        assignee: ["Makha"],
        startDate: "2025-04-17",
        endDate: "2025-04-27",
        status: "Done",
      },
      {
        id: "SP0.5",
        action: "Assist with DB structure setup",
        category: ["Backend"],
        dependencies: "Firebase setup",
        assignee: ["Lindelani", "Makha"],
        startDate: "2025-04-17",
        endDate: "2025-04-27",
        status: "Done",
      },
      {
        id: "SP0.6",
        action: "Research blockchain tools (Firebase access rules)",
        category: ["Security"],
        dependencies: "None",
        assignee: ["Lindelani"],
        startDate: "2025-04-17",
        endDate: "2025-04-29",
        status: "Done",
      },
      {
        id: "SP0.7",
        action: "Finalize MVP scope & success criteria",
        category: ["Traction"],
        dependencies: "None",
        assignee: ["Thando"],
        startDate: "2025-04-15",
        endDate: "2025-04-29",
        status: "Done",
      },
      {
        id: "SP0.8",
        action: "Project tool lock (Notion main hub)",
        category: ["Traction"],
        dependencies: "None",
        assignee: ["Thando"],
        startDate: "2025-04-17",
        endDate: "2025-05-02",
        status: "Done",
      },
      {
        id: "SP0.9",
        action: "Refine pitch deck (v2)",
        category: ["Funding"],
        dependencies: "None",
        assignee: ["Thando"],
        startDate: "2025-04-18",
        endDate: "2025-05-09",
        status: "Not started",
      },
      {
        id: "SP0.10",
        action: "Google ecosystem(what tool we can use)",
        category: [
          "Funding",
          "Traction",
          "Security",
          "QA",
          "Frontend",
          "Backend",
          "Intake/Comms",
        ],
        dependencies: "None",
        assignee: [],
        startDate: "",
        endDate: "",
        status: "Done",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  1: {
    id: 1,
    name: "Sprint 1",
    subtitle:
      "SME Onboarding + Compliance Score - Have SME profiles captured, scored manually, and displayed",
    tasks: [
      {
        id: "SP1.1",
        action: "Build intake form + add form validation & error handling",
        category: ["Frontend", "QA"],
        dependencies: "Backend API ready",
        assignee: ["Lerato Nama", "Nhlanhla Msomi"],
        startDate: "2025-04-23",
        endDate: "2025-04-26",
        status: "Done",
      },
      {
        id: "SP1.2",
        action: "Firebase schema for SME profiles & docs",
        category: ["Backend"],
        dependencies: "Profiles from frontend",
        assignee: ["Makha"],
        startDate: "2025-04-21",
        endDate: "2025-05-01",
        status: "Done",
      },
      {
        id: "SP1.3",
        action: "API endpoint for CRUD + score storage",
        category: ["Backend"],
        dependencies: "SME schema",
        assignee: ["Makha"],
        startDate: "2025-04-23",
        endDate: "2025-05-05",
        status: "Done",
      },
      {
        id: "SP1.4",
        action: "Integrate compliance score % display",
        category: ["Frontend"],
        dependencies: "Backend score API",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-04-28",
        endDate: "2025-05-05",
        status: "Done",
      },
      {
        id: "SP1.5",
        action: 'Add rule-based auto-scoring (e.g., "If doc X uploaded, +10%")',
        category: ["Frontend", "Backend"],
        dependencies: "Backend score API",
        assignee: ["Makha", "Nhlanhla Msomi"],
        startDate: "2025-04-28",
        endDate: "2025-05-05",
        status: "Done",
      },
      {
        id: "SP1.6",
        action: "Manual compliance scoring (50 dummy SMEs + Investors)",
        category: ["QA"],
        dependencies: "SME intake complete",
        assignee: ["Lerato Nama"],
        startDate: "2025-04-28",
        endDate: "2025-05-09",
        status: "Done",
      },
      {
        id: "SP1.8",
        action: "Apply for Google credits",
        category: ["Funding"],
        dependencies: "None",
        assignee: ["Thando"],
        startDate: "2025-04-21",
        endDate: "2025-05-09",
        status: "Done",
      },
      {
        id: "SP1.9",
        action: "Optimize the compliance score % display",
        category: ["Backend"],
        dependencies: "",
        assignee: ["Makha"],
        startDate: "2025-05-07",
        endDate: "2025-05-12",
        status: "Done",
      },
      {
        id: "SP1.10",
        action: "API setup",
        category: ["Backend"],
        dependencies: "SME schema",
        assignee: ["Makha"],
        startDate: "2025-04-23",
        endDate: "2025-05-12",
        status: "Done",
      },
      {
        id: "SP1.12",
        action: "Draft SME onboarding emails, FAQs",
        category: ["Intake/Comms"],
        dependencies: "Wireframes",
        assignee: ["Lerato Nama", "Thando"],
        startDate: "2025-04-18",
        endDate: "2025-05-16",
        status: "Done",
      },
      {
        id: "SP1.7",
        action: "Test intake form flow",
        category: ["QA"],
        dependencies: "SME intake complete",
        assignee: ["Lerato Nama"],
        startDate: "2025-04-29",
        endDate: "2025-05-17",
        status: "Done",
      },
      {
        id: "SP1.11",
        action: "Integrate pitch deck in chatGPT",
        category: [],
        dependencies: "",
        assignee: [],
        startDate: "",
        endDate: "2025-05-26",
        status: "Done",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  2: {
    id: 2,
    name: "Sprint 2",
    subtitle:
      "Funder Profiles + Matching Logic - Capture funder profiles and implement basic matching.",
    tasks: [
      {
        id: "SP2.6",
        action: "Add landing page messages (clarify feature availability)",
        category: ["Frontend"],
        dependencies: "None",
        assignee: ["Thando", "Lerato Nama"],
        startDate: "2025-05-07",
        endDate: "2025-05-08",
        status: "Done",
      },
      {
        id: "SP2.8",
        action: "API for matching logic",
        category: ["Backend"],
        dependencies: "Matching schema",
        assignee: ["Makha"],
        startDate: "2025-05-05",
        endDate: "2025-05-13",
        status: "Done",
      },
      {
        id: "SP2.1",
        action: "Integrate match logic setup",
        category: ["Backend"],
        dependencies: "Matching schema",
        assignee: ["Lindelani", "Makha"],
        startDate: "2025-05-05",
        endDate: "2025-05-14",
        status: "Done",
      },
      {
        id: "SP2.5",
        action: "Service provider matching dashboard view",
        category: ["Frontend"],
        dependencies: "Matching logic API",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-05-07",
        endDate: "2025-05-15",
        status: "Done",
      },
      {
        id: "SP2.3",
        action: "Build funder intake form + matching dashboard",
        category: ["Frontend"],
        dependencies: "None",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-05-05",
        endDate: "2025-05-16",
        status: "Done",
      },
      {
        id: "SP2.4",
        action: "Add filtering options for funders (SMEs)",
        category: ["Frontend"],
        dependencies: "Matching logic API",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-05-07",
        endDate: "2025-05-16",
        status: "Done",
      },
      {
        id: "SP2.7",
        action: "Firebase schema for funder profiles & matching",
        category: ["Backend"],
        dependencies: "Frontend action button",
        assignee: ["Makha", "Lindelani"],
        startDate: "2025-05-01",
        endDate: "2025-05-16",
        status: "Done",
      },
      {
        id: "SP2.11",
        action: "NDA doc sign",
        category: ["Security"],
        dependencies: "",
        assignee: ["Lindelani"],
        startDate: "",
        endDate: "2025-05-16",
        status: "Done",
      },
      {
        id: "SP2.13",
        action: 'Embed Calendar with "My events"- SMSE',
        category: ["Frontend"],
        dependencies: "",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-05-14",
        endDate: "2025-05-19",
        status: "Done",
      },
      {
        id: "SP2.10",
        action: "Validate matching outputs (dummy data)",
        category: ["QA"],
        dependencies: "Matching logic live",
        assignee: ["Lerato Nama"],
        startDate: "2025-05-08",
        endDate: "2025-05-21",
        status: "Done",
      },
      {
        id: "SP2.9",
        action: "Harden matching data access controls",
        category: ["Security"],
        dependencies: "Matching logic live",
        assignee: ["Lindelani"],
        startDate: "2025-05-07",
        endDate: "2025-05-23",
        status: "Done",
      },
      {
        id: "SP2.12",
        action: "Add email verification",
        category: ["Backend"],
        dependencies: "Security",
        assignee: ["Lindelani"],
        startDate: "2025-05-14",
        endDate: "2025-05-23",
        status: "Done",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  3: {
    id: 3,
    name: "Sprint 3",
    subtitle:
      "Dashboards (SME, Funder, Internal) - Enable real-time tracking of profiles, scores, matches.",
    tasks: [
      {
        id: "SP3.1",
        action: "API endpoints for dashboards",
        category: ["Backend"],
        dependencies: "Firebase data ready",
        assignee: ["Makha"],
        startDate: "2025-05-09",
        endDate: "2025-05-23",
        status: "Done",
      },
      {
        id: "SP3.2",
        action: "SME & funder dashboards",
        category: ["Frontend"],
        dependencies: "Matching logic APIs",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-06-23",
        endDate: "2025-06-26",
        status: "Done",
      },
      {
        id: "SP3.3",
        action: "Internal admin view",
        category: ["Frontend"],
        dependencies: "API endpoints",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-06-26",
        endDate: "2025-06-30",
        status: "Done",
      },
      {
        id: "SP3.4",
        action: "Role-based access controls (RBAC)",
        category: ["Security"],
        dependencies: "Dashboards built",
        assignee: ["Lindelani"],
        startDate: "2025-05-16",
        endDate: "2025-05-23",
        status: "Done",
      },
      {
        id: "SP3.5",
        action: "Test dashboards (data accuracy, UI/UX)",
        category: ["QA"],
        dependencies: "Dashboards live",
        assignee: ["Lerato Nama"],
        startDate: "2025-05-16",
        endDate: "2025-05-23",
        status: "Not started",
      },
      {
        id: "SP3.6",
        action: "Collect feedback from pilot SMEs/funders",
        category: ["Traction"],
        dependencies: "Dashboards ready for demo",
        assignee: ["Thando"],
        startDate: "2025-05-16",
        endDate: "2025-05-31",
        status: "Done",
      },
      {
        id: "SP3.7",
        action: "Investor meetings + pitch deck iteration",
        category: ["Funding"],
        dependencies: "Dashboards ready for demo",
        assignee: ["Thando"],
        startDate: "2025-05-30",
        endDate: "2025-07-08",
        status: "Done",
      },
      {
        id: "SP3.8",
        action: "Integrate Firebase (or similar) to track engagement/drop-offs",
        category: ["Backend"],
        dependencies: "Dashboards live",
        assignee: ["Makha"],
        startDate: "2025-05-15",
        endDate: "2025-06-27",
        status: "Done",
      },
      {
        id: "SP3.9",
        action:
          "Firebase cost audit (monitor read/write limits) to avoid bill shocks post MVP",
        category: ["Backend"],
        dependencies: "",
        assignee: ["Lindelani"],
        startDate: "2025-05-06",
        endDate: "2025-06-27",
        status: "Done",
      },
      {
        id: "SP3.10",
        action:
          "Enable more than one sign up for different roles - two dashboards",
        category: ["Backend"],
        dependencies: "",
        assignee: ["Lindelani"],
        startDate: "2025-06-30",
        endDate: "2025-06-30",
        status: "Done",
      },
      {
        id: "SP3.11",
        action:
          "Help option on the BIG Score - to get comments and feedback (flows to support@bigmarketplace.africa)",
        category: ["Frontend"],
        dependencies: "",
        assignee: ["Lerato Nama"],
        startDate: "2025-07-01",
        endDate: "2025-07-01",
        status: "Done",
      },
      {
        id: "SP3.12",
        action:
          "How to improve page - feedback (flows to support@bigmarketplace.africa)",
        category: ["Frontend"],
        dependencies: "",
        assignee: ["Lerato Nama"],
        startDate: "2025-07-01",
        endDate: "2025-07-01",
        status: "Done",
      },
      {
        id: "SP3.13",
        action: "Record videos for all roles",
        category: ["Traction"],
        dependencies: "",
        assignee: ["Thando"],
        startDate: "2025-07-09",
        endDate: "2025-07-09",
        status: "Done",
      },
      {
        id: "SP3.14",
        action: "Testing for BIG Score accuracy",
        category: ["QA"],
        dependencies: "BigScore is done",
        assignee: ["Lerato Nama"],
        startDate: "2025-07-01",
        endDate: "2025-07-23",
        status: "Not started",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  4: {
    id: 4,
    name: "Sprint 4",
    subtitle: "Pilot Testing Sprint - Pilot test SME & funder flows.",
    tasks: [
      {
        id: "SP4.1",
        action: "Charts for Advisors",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-07-24",
        endDate: "2025-07-31",
        status: "Not started",
      },
      {
        id: "SP4.2",
        action: "Charts for Catalyst",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-07-24",
        endDate: "2025-07-31",
        status: "Not started",
      },
      {
        id: "SP4.3",
        action: "Pipeline for Catalyst charts",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-07-31",
        endDate: "2025-08-07",
        status: "Not started",
      },
      {
        id: "SP4.4",
        action: "Pipeline for Advisor charts",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-07-31",
        endDate: "2025-08-07",
        status: "Not started",
      },
      {
        id: "SP4.5",
        action: "Missing info charts - Intern",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-08-07",
        endDate: "2025-08-14",
        status: "Not started",
      },
      {
        id: "SP4.6",
        action: "Missing info charts - Program sponsor",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-08-07",
        endDate: "2025-08-14",
        status: "Not started",
      },
      {
        id: "SP4.7",
        action: "QA insights",
        category: ["QA"],
        dependencies: "Charts completed",
        assignee: ["Lerato Nama"],
        startDate: "2025-08-14",
        endDate: "2025-08-21",
        status: "Not started",
      },
      {
        id: "SP4.8",
        action: "Countdown message",
        category: ["Frontend"],
        dependencies: "Notification system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-08-14",
        endDate: "2025-08-21",
        status: "Not started",
      },
      {
        id: "SP4.9",
        action: "Message-interns",
        category: ["Backend"],
        dependencies: "Notification system",
        assignee: ["Makha"],
        startDate: "2025-08-21",
        endDate: "2025-08-28",
        status: "Not started",
      },
      {
        id: "SP4.10",
        action: "Notification to email",
        category: ["Backend"],
        dependencies: "Message system",
        assignee: ["Makha"],
        startDate: "2025-08-21",
        endDate: "2025-08-28",
        status: "Not started",
      },
      {
        id: "SP4.11",
        action: "Chart for funder, customer, supplier",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["Makha"],
        startDate: "2025-08-28",
        endDate: "2025-09-04",
        status: "Not started",
      },
      {
        id: "SP4.12",
        action: "Add the ratings function so SMEs can review the interns",
        category: ["Backend"],
        dependencies: "Intern matching system",
        assignee: ["M Mofeli"],
        startDate: "2025-09-15",
        endDate: "2025-09-19",
        status: "Done",
      },
      {
        id: "SP4.13",
        action: "Display ratings on program sponsor and intern tables",
        category: ["Backend"],
        dependencies: "Ratings function",
        assignee: ["M Mofeli"],
        startDate: "2025-09-16",
        endDate: "2025-09-19",
        status: "Done",
      },
      {
        id: "SP4.14",
        action: "Do the customers and suppliers charts on Big Insights",
        category: ["Backend"],
        dependencies: "Dashboard APIs",
        assignee: ["M Mofeli"],
        startDate: "2025-09-17",
        endDate: "2025-09-19",
        status: "Done",
      },
      {
        id: "SP4.15",
        action: "Do the intern charts (whichever ones that require ratings)",
        category: ["Backend"],
        dependencies: "Ratings function",
        assignee: ["M Mofeli"],
        startDate: "2025-09-17",
        endDate: "2025-09-19",
        status: "Done",
      },
      {
        id: "SP4.16",
        action: "My Growth Suite Strategy and Execution",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-09-26",
        endDate: "2025-10-03",
        status: "Not started",
      },
      {
        id: "SP4.17",
        action: "My Growth Suite Financial and Performance",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-09-26",
        endDate: "2025-10-03",
        status: "Not started",
      },
      {
        id: "SP4.18",
        action: "My Growth Suite People",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-10-03",
        endDate: "2025-10-10",
        status: "Not started",
      },
      {
        id: "SP4.19",
        action: "My Growth Suite Operational Strength",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-10-03",
        endDate: "2025-10-10",
        status: "Not started",
      },
      {
        id: "SP4.20",
        action: "My Growth Suite Social Environment Impact",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-10-10",
        endDate: "2025-10-17",
        status: "Not started",
      },
      {
        id: "SP4.21",
        action: "My Growth Suite Marketing Sales and Funnels",
        category: ["Backend"],
        dependencies: "Growth Suite framework",
        assignee: ["Makha"],
        startDate: "2025-10-10",
        endDate: "2025-10-17",
        status: "Not started",
      },
      {
        id: "SP4.22",
        action: "Billing and payments",
        category: ["Backend"],
        dependencies: "Payment gateway integration",
        assignee: ["Makha"],
        startDate: "2025-10-17",
        endDate: "2025-10-24",
        status: "Not started",
      },
      {
        id: "SP4.23",
        action: "Business Cards",
        category: ["Frontend"],
        dependencies: "Profile system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-09-15",
        endDate: "2025-09-26",
        status: "Done",
      },
      {
        id: "SP4.24",
        action: "Business brochure QR code",
        category: ["Frontend"],
        dependencies: "Business Cards",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-09-26",
        endDate: "2025-10-03",
        status: "Not started",
      },
      {
        id: "SP4.25",
        action: "Catalyst profile (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-03",
        endDate: "2025-10-10",
        status: "Not started",
      },
      {
        id: "SP4.26",
        action: "Advisor (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-10",
        endDate: "2025-10-17",
        status: "Not started",
      },
      {
        id: "SP4.27",
        action: "Investor (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-17",
        endDate: "2025-10-24",
        status: "Not started",
      },
      {
        id: "SP4.28",
        action: "Intern (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-24",
        endDate: "2025-10-31",
        status: "Not started",
      },
      {
        id: "SP4.29",
        action: "Program sponsor (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-24",
        endDate: "2025-10-31",
        status: "Not started",
      },
      {
        id: "SP4.30",
        action: "Supplier (my matches, Successful deals)",
        category: ["Frontend"],
        dependencies: "Matching system",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-10-31",
        endDate: "2025-11-07",
        status: "Not started",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  5: {
    id: 5,
    name: "Sprint 5",
    subtitle:
      "Composite BIG Score + Automation Layer - Aggregate compliance, matching, and manual scores into BIG Score.",
    tasks: [
      {
        id: "SP5.1",
        action:
          "Develop semi-automated scoring (rules-based) before full composite score",
        category: ["Backend"],
        dependencies: "Scoring rules defined",
        assignee: ["Makha"],
        startDate: "2025-11-07",
        endDate: "2025-11-14",
        status: "Not started",
      },
      {
        id: "SP5.2",
        action: "Composite BIG Score logic",
        category: ["Backend"],
        dependencies: "Semi-automated scoring",
        assignee: ["Makha"],
        startDate: "2025-11-14",
        endDate: "2025-11-21",
        status: "Not started",
      },
      {
        id: "SP5.3",
        action: "Assist with scoring integration",
        category: ["Backend"],
        dependencies: "Composite BIG Score logic",
        assignee: ["Lindelani"],
        startDate: "2025-11-21",
        endDate: "2025-11-28",
        status: "Not started",
      },
      {
        id: "SP5.4",
        action: "Display BIG Score breakdown in dashboards",
        category: ["Frontend"],
        dependencies: "Composite BIG Score logic",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-11-28",
        endDate: "2025-12-05",
        status: "Not started",
      },
      {
        id: "SP5.5",
        action: "Validate score outputs & edge cases",
        category: ["QA"],
        dependencies: "BIG Score display",
        assignee: ["Lerato Nama"],
        startDate: "2025-12-05",
        endDate: "2025-12-12",
        status: "Not started",
      },
      {
        id: "SP5.6",
        action: "Push for testimonials from pilot SMEs/funders",
        category: ["Traction"],
        dependencies: "Pilot testing complete",
        assignee: ["Thando"],
        startDate: "2025-12-12",
        endDate: "2025-12-19",
        status: "Not started",
      },
      {
        id: "SP5.7",
        action: "Finalize pitch deck for investor demo",
        category: ["Funding"],
        dependencies: "Testimonials collected",
        assignee: ["Thando"],
        startDate: "2025-12-19",
        endDate: "2025-12-26",
        status: "Not started",
      },
      {
        id: "SP5.8",
        action: "Draft BIG Score Methodology doc",
        category: ["Traction"],
        dependencies: "BIG Score validated",
        assignee: ["Lerato Nama"],
        startDate: "2025-12-26",
        endDate: "2026-01-02",
        status: "Not started",
      },
      {
        id: "SP5.9",
        action: "AI Match Insights™ mockup (even if fake - investor Wow)",
        category: ["Traction"],
        dependencies: "BIG Score Methodology",
        assignee: ["Thando"],
        startDate: "2026-01-02",
        endDate: "2026-01-09",
        status: "Not started",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  6: {
    id: 6,
    name: "Sprint 6",
    subtitle:
      "Security, Blockchain, & Compliance - Harden security and prep blockchain for verification.",
    tasks: [
      {
        id: "SP6.1",
        action: "Harden data encryption, RBAC, audit logs",
        category: ["Security"],
        dependencies: "Composite score live",
        assignee: ["Lindelani"],
        startDate: "2026-01-09",
        endDate: "2026-01-16",
        status: "Not started",
      },
      {
        id: "SP6.2",
        action: "Prototype compliance doc hashes on blockchain",
        category: ["Blockchain"],
        dependencies: "Compliance docs in place",
        assignee: ["Lindelani"],
        startDate: "2026-01-16",
        endDate: "2026-01-23",
        status: "Not started",
      },
      {
        id: "SP6.3",
        action: "Security penetration tests",
        category: ["QA"],
        dependencies: "Security enhancements",
        assignee: ["Lerato Nama"],
        startDate: "2026-01-23",
        endDate: "2026-01-30",
        status: "Not started",
      },
      {
        id: "SP6.4",
        action: "Collect feedback on security from funders",
        category: ["Traction"],
        dependencies: "Security hardened",
        assignee: ["Thando"],
        startDate: "2026-01-30",
        endDate: "2026-02-06",
        status: "Not started",
      },
      {
        id: "SP6.5",
        action: "Engage tech partners (blockchain/Advisors)",
        category: ["Funding"],
        dependencies: "Blockchain prototype",
        assignee: ["Thando"],
        startDate: "2026-02-06",
        endDate: "2026-02-13",
        status: "Not started",
      },
      {
        id: "SP6.6",
        action: "Finalize BIG Score Methodology doc",
        category: ["Traction"],
        dependencies: "Composite logic live",
        assignee: ["Lerato Nama"],
        startDate: "2026-02-13",
        endDate: "2026-02-20",
        status: "Not started",
      },
      {
        id: "SP6.7",
        action: "Review Firebase costs/limits before demo",
        category: ["Backend"],
        dependencies: "Security hardened",
        assignee: ["Makha"],
        startDate: "2026-02-20",
        endDate: "2026-02-27",
        status: "Not started",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  9: {
    id: 9,
    name: "Sprint 9",
    subtitle:
      "Post-Demo Improvements & Pilot Expansion - Incorporating demo feedback and expand pilot users.",
    tasks: [
      {
        id: "SP9.1",
        action: "Implement demo feedback (data flows)",
        category: ["Backend"],
        dependencies: "Investor feedback",
        assignee: ["Makha"],
        startDate: "2025-06-17",
        endDate: "2025-06-19",
        status: "Not started",
      },
      {
        id: "SP9.2",
        action: "Assist with backend improvements",
        category: ["Backend"],
        dependencies: "Investor feedback",
        assignee: ["Lindelani"],
        startDate: "2025-06-17",
        endDate: "2025-06-19",
        status: "Not started",
      },
      {
        id: "SP9.3",
        action: "Implement UI/UX feedback",
        category: ["Frontend"],
        dependencies: "Investor feedback",
        assignee: ["Nhlanhla Msomi"],
        startDate: "2025-06-17",
        endDate: "2025-06-19",
        status: "Not started",
      },
      {
        id: "SP9.4",
        action: "Validate post-demo improvements",
        category: ["QA"],
        dependencies: "Fixes implemented",
        assignee: ["Lerato Nama"],
        startDate: "2025-06-20",
        endDate: "2025-06-20",
        status: "Not started",
      },
      {
        id: "SP9.5",
        action: "Enhance blockchain prototype (if feedback)",
        category: ["Security"],
        dependencies: "Investor feedback",
        assignee: ["Lindelani"],
        startDate: "2025-06-20",
        endDate: "2025-06-21",
        status: "Not started",
      },
      {
        id: "SP9.6",
        action: "Expand pilot cohort (SMEs, funders)",
        category: ["Traction"],
        dependencies: "System improvements",
        assignee: ["Thando"],
        startDate: "2025-06-21",
        endDate: "2025-06-24",
        status: "Not started",
      },
      {
        id: "SP9.7",
        action: "Refine investor materials post-demo",
        category: ["Funding"],
        dependencies: "Investor feedback",
        assignee: ["Thando"],
        startDate: "2025-06-21",
        endDate: "2025-06-24",
        status: "Not started",
      },
      {
        id: "SP9.8",
        action: "Post-demo funder survey",
        category: ["Traction"],
        dependencies: "Investor demo complete",
        assignee: ["Thando"],
        startDate: "2025-06-17",
        endDate: "2025-06-18",
        status: "Not started",
      },
      {
        id: "SP9.9",
        action: "Case study/testimonial template for pilots",
        category: ["Traction"],
        dependencies: "Pilot feedback",
        assignee: ["Thando"],
        startDate: "2025-06-18",
        endDate: "2025-06-19",
        status: "Not started",
      },
      {
        id: "SP9.10",
        action:
          "Apply for 1-2 grants (Plan B funding) to reduce investor dependency",
        category: ["Funding"],
        dependencies: "Pilot feedback",
        assignee: ["Thando"],
        startDate: "2025-06-25",
        endDate: "2025-06-30",
        status: "Not started",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
    ],
  },
  10: {
    id: 10,
    name: "Sprint 10",
    subtitle: "Stay organized with tasks, your way.",
    tasks: [
      {
        id: "SP10.1",
        action: "Big score summary not up to date",
        status: "Not started",
        category: ["Backend"],
        assignee: ["Lindelani"],
        startDate: "",
        endDate: "",
        dependencies: "None",
      },
      {
        id: "SP10.2",
        action: "Conditional business plan upload based on advisor existence",
        status: "Not started",
        category: ["Backend"],
        assignee: ["Lindelani"],
        startDate: "",
        endDate: "",
        dependencies: "None",
      },
    ],
    columns: [
      { id: "id", label: "Number", type: "text", editable: false },
      { id: "action", label: "Action", type: "text", editable: true },
      { id: "status", label: "Status", type: "select", editable: true },
      {
        id: "category",
        label: "Category",
        type: "multi-select",
        editable: true,
      },
      {
        id: "assignee",
        label: "Assignee",
        type: "multi-select",
        editable: true,
      },
      { id: "startDate", label: "Start date", type: "date", editable: true },
      { id: "endDate", label: "End date", type: "date", editable: true },
      {
        id: "dependencies",
        label: "Dependencies",
        type: "text",
        editable: true,
      },
    ],
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  'Frontend',
  'Backend',
  'QA',
  'Security',
  'Traction',
  'Funding',
  'Intake/Comms'
];

const ASSIGNEES = [
  'Lindelani',
  'Nhlanhla Msomi',
  'Makha',
  'Lerato Nama',
  'Thando'
];

const STATUSES = ['Not started', 'In progress', 'Done', 'Blocked'];

const STATUS_COLORS = {
  'Not started': '#ef4444',
  'In progress': '#f59e0b',
  'Done': '#10b981',
  'Blocked': '#6b7280'
};

const CATEGORY_COLORS = {
  'Frontend': '#3b82f6',
  'Backend': '#8b5cf6',
  'QA': '#ec4899',
  'Security': '#f59e0b',
  'Traction': '#10b981',
  'Funding': '#ef4444',
  'Intake/Comms': '#06b6d4'
};

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

const EditableCell = memo(({ 
  value, 
  columnType, 
  isEditing, 
  onSave, 
  onCancel 
}) => {
  const [editValue, setEditValue] = useState(value);

  const handleSave = useCallback(() => {
    onSave(editValue);
  }, [editValue, onSave]);

  if (!isEditing) {
    if (columnType === 'select') {
      return (
        <span 
          style={{
            ...styles.statusBadge,
            background: STATUS_COLORS[value] || '#6b7280'
          }}
        >
          {value || 'Not started'}
        </span>
      );
    }
    
    if (columnType === 'multi-select') {
      const items = Array.isArray(value) ? value : [];
      return (
        <div style={styles.multiSelectDisplay}>
          {items.map((item, idx) => (
            <span 
              key={idx}
              style={{
                ...styles.categoryBadge,
                background: CATEGORY_COLORS[item] || '#6b7280'
              }}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    return <span>{value || '-'}</span>;
  }

  // Editing mode
  if (columnType === 'select') {
    return (
      <div style={styles.editControls}>
        <select
          value={editValue || 'Not started'}
          onChange={(e) => setEditValue(e.target.value)}
          style={styles.editInput}
        >
          {STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  if (columnType === 'multi-select') {
    const selectedItems = Array.isArray(editValue) ? editValue : [];
    const options = columnType === 'multi-select' && 
                    (value === selectedItems || selectedItems.some(v => CATEGORIES.includes(v)))
                    ? CATEGORIES 
                    : ASSIGNEES;

    return (
      <div style={styles.editControls}>
        <div style={styles.multiSelectEdit}>
          {options.map(option => (
            <label key={option} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedItems.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditValue([...selectedItems, option]);
                  } else {
                    setEditValue(selectedItems.filter(item => item !== option));
                  }
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  if (columnType === 'date') {
    return (
      <div style={styles.editControls}>
        <input
          type="date"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          style={styles.editInput}
        />
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  // Default text input
  return (
    <div style={styles.editControls}>
      <input
        type="text"
        value={editValue || ''}
        onChange={(e) => setEditValue(e.target.value)}
        style={styles.editInput}
        autoFocus
      />
      <button onClick={handleSave} style={styles.saveBtn}>
        <Save size={14} />
      </button>
      <button onClick={onCancel} style={styles.cancelBtn}>
        <X size={14} />
      </button>
    </div>
  );
});

const TableRow = memo(({ 
  task, 
  columns, 
  onUpdateTask, 
  onDeleteTask,
  editingCell,
  setEditingCell
}) => {
  const handleCellClick = useCallback((columnId) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.editable) {
      setEditingCell(`${task.id}-${columnId}`);
    }
  }, [columns, task.id, setEditingCell]);

  const handleSave = useCallback((columnId, newValue) => {
    onUpdateTask(task.id, columnId, newValue);
    setEditingCell(null);
  }, [task.id, onUpdateTask, setEditingCell]);

  const handleCancel = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

  return (
    <tr style={styles.tableRow}>
      {columns.map(column => {
        const cellKey = `${task.id}-${column.id}`;
        const isEditing = editingCell === cellKey;
        
        return (
          <td 
            key={column.id} 
            style={styles.tableCell}
            onClick={() => handleCellClick(column.id)}
          >
            <EditableCell
              value={task[column.id]}
              columnType={column.type}
              isEditing={isEditing}
              onSave={(newValue) => handleSave(column.id, newValue)}
              onCancel={handleCancel}
            />
          </td>
        );
      })}
      <td style={styles.tableCell}>
        <button
          onClick={() => onDeleteTask(task.id)}
          style={styles.deleteBtn}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
});

const SprintTable = memo(({ 
  sprint, 
  onUpdateTask, 
  onAddTask, 
  onDeleteTask,
  onAddColumn 
}) => {
  const [editingCell, setEditingCell] = useState(null);

  const handleAddTask = useCallback(() => {
    const newTaskId = `SP${sprint.id}.${sprint.tasks.length + 1}`;
    const newTask = { id: newTaskId };
    
    sprint.columns.forEach(col => {
      if (col.type === 'multi-select') {
        newTask[col.id] = [];
      } else if (col.type === 'select') {
        newTask[col.id] = 'Not started';
      } else {
        newTask[col.id] = '';
      }
    });
    
    onAddTask(sprint.id, newTask);
  }, [sprint, onAddTask]);

  const handleAddColumn = useCallback(() => {
    const columnName = prompt('Enter column name:');
    if (!columnName) return;
    
    const columnType = prompt('Enter column type (text/select/multi-select/date):');
    if (!['text', 'select', 'multi-select', 'date'].includes(columnType)) {
      alert('Invalid column type');
      return;
    }

    onAddColumn(sprint.id, {
      id: columnName.toLowerCase().replace(/\s+/g, '_'),
      label: columnName,
      type: columnType,
      editable: true
    });
  }, [sprint.id, onAddColumn]);

  if (!sprint.columns || sprint.columns.length === 0) {
    return (
      <div style={styles.emptyTable}>
        <p style={styles.emptyTableText}>No table structure defined for this sprint</p>
        <button onClick={handleAddColumn} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
        </button>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableControls}>
        <button onClick={handleAddTask} style={styles.addTaskBtn}>
          <Plus size={16} />
          Add Task
        </button>
        <button onClick={handleAddColumn} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              {sprint.columns.map(column => (
                <th key={column.id} style={styles.tableHeader}>
                  {column.label}
                </th>
              ))}
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sprint.tasks.map(task => (
              <TableRow
                key={task.id}
                task={task}
                columns={sprint.columns}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const SprintCard = memo(({ 
  sprint, 
  isExpanded, 
  onToggle, 
  onUpdateTask, 
  onAddTask,
  onDeleteTask,
  onAddColumn
}) => {
  return (
    <div style={styles.sprintCard}>
      <div
        style={styles.sprintCardHeader}
        onClick={() => onToggle(sprint.id)}
      >
        {isExpanded ? (
          <ChevronDown size={20} />
        ) : (
          <ChevronRight size={20} />
        )}
        <div style={styles.sprintHeaderContent}>
          <strong style={styles.sprintName}>{sprint.name}</strong>
          <span style={styles.sprintSubtitle}>{sprint.subtitle}</span>
          <span style={styles.taskCount}>
            {sprint.tasks.length} task{sprint.tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div style={styles.sprintContent}>
          <SprintTable
            sprint={sprint}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onAddColumn={onAddColumn}
          />
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Delivery = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [sprintsData, setSprintsData] = useState(INITIAL_SPRINTS_DATA);

  const toggleSprint = useCallback((id) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleUpdateTask = useCallback((sprintId, taskId, columnId, newValue) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      const updatedTasks = sprint.tasks.map(task =>
        task.id === taskId ? { ...task, [columnId]: newValue } : task
      );
      
      return {
        ...prev,
        [sprintId]: {
          ...sprint,
          tasks: updatedTasks
        }
      };
    });
  }, []);

  const handleAddTask = useCallback((sprintId, newTask) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      return {
        ...prev,
        [sprintId]: {
          ...sprint,
          tasks: [...sprint.tasks, newTask]
        }
      };
    });
  }, []);

  const handleDeleteTask = useCallback((sprintId, taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      return {
        ...prev,
        [sprintId]: {
          ...sprint,
          tasks: sprint.tasks.filter(task => task.id !== taskId)
        }
      };
    });
  }, []);

  const handleAddColumn = useCallback((sprintId, newColumn) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      const updatedColumns = [...(sprint.columns || []), newColumn];
      
      // Add the new column to all existing tasks with default value
      const updatedTasks = sprint.tasks.map(task => ({
        ...task,
        [newColumn.id]: newColumn.type === 'multi-select' ? [] : 
                       newColumn.type === 'select' ? 'Not started' : ''
      }));

      return {
        ...prev,
        [sprintId]: {
          ...sprint,
          columns: updatedColumns,
          tasks: updatedTasks
        }
      };
    });
  }, []);

  const handleAddSprint = useCallback(() => {
    const newSprintId = Math.max(...Object.keys(sprintsData).map(Number)) + 1;
    const newSprint = {
      id: newSprintId,
      name: `Sprint ${newSprintId}`,
      subtitle: 'New sprint - add your description',
      tasks: [],
      columns: []
    };

    setSprintsData(prev => ({
      ...prev,
      [newSprintId]: newSprint
    }));
  }, [sprintsData]);

  const sortedSprints = useMemo(() => {
    return Object.values(sprintsData).sort((a, b) => a.id - b.id);
  }, [sprintsData]);

  return (
    <>
      <style>{`
        :root {
          --light-brown: #f5f0e1;
          --medium-brown: #e6d7c3;
          --accent-brown: #c8b6a6;
          --primary-brown: #a67c52;
          --dark-brown: #7d5a50;
          --text-brown: #4a352f;
          --background-brown: #faf7f2;
          --pale-brown: #f0e6d9;
          --sidebar-width: 280px;
        }

        .delivery-wrapper {
          background: var(--background-brown);
          min-height: 100vh;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <div className="delivery-wrapper">
        <div style={styles.pageTitle}>
          <h1 style={styles.titleText}>DELIVERY</h1>
        </div>

        <div style={styles.contentWrapper}>
          {/* Sidebar */}
          <div style={styles.categorySidebar}>
            <div
              style={{
                ...styles.categoryButton,
                ...(activeCategory === 'meetings' && styles.categoryButtonActive)
              }}
              onClick={() =>
                setActiveCategory(activeCategory === 'meetings' ? null : 'meetings')
              }
            >
              <ChevronRight
                size={16}
                style={{
                  transform: activeCategory === 'meetings' ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span>Meetings</span>
            </div>

            <div
              style={{
                ...styles.categoryButton,
                ...(activeCategory === 'sprints' && styles.categoryButtonActive)
              }}
              onClick={() =>
                setActiveCategory(activeCategory === 'sprints' ? null : 'sprints')
              }
            >
              <ChevronRight
                size={16}
                style={{
                  transform: activeCategory === 'sprints' ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span>Sprints</span>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {activeCategory === 'meetings' && (
              <div style={styles.comingSoon}>
                <Clock size={48} color="var(--accent-brown)" />
                <p style={styles.comingSoonText}>Meetings view coming soon...</p>
              </div>
            )}

            {activeCategory === 'sprints' && (
              <div style={styles.sprintsContainer}>
                <div style={styles.sprintsHeader}>
                  <h2 style={styles.sprintsTitle}>Sprint Management</h2>
                  <button onClick={handleAddSprint} style={styles.addSprintBtn}>
                    <Plus size={18} />
                    Add Sprint
                  </button>
                </div>

                {sortedSprints.map((sprint) => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    isExpanded={expandedSprints[sprint.id]}
                    onToggle={toggleSprint}
                    onUpdateTask={(taskId, columnId, newValue) =>
                      handleUpdateTask(sprint.id, taskId, columnId, newValue)
                    }
                    onAddTask={(newTask) => handleAddTask(sprint.id, newTask)}
                    onDeleteTask={(taskId) => handleDeleteTask(sprint.id, taskId)}
                    onAddColumn={handleAddColumn}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  pageTitle: {
    padding: '20px 32px',
    background: '#fff',
    borderBottom: '1px solid var(--medium-brown)',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 600,
    margin: 0,
    color: 'var(--text-brown)',
    letterSpacing: '0.5px'
  },
  contentWrapper: {
    display: 'flex',
  },
  categorySidebar: {
    width: '200px',
    background: 'var(--pale-brown)',
    borderRight: '1px solid var(--medium-brown)',
    padding: '20px 0',
    minHeight: 'calc(100vh - 68px)'
  },
  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: 15,
    color: 'var(--text-brown)',
    transition: 'all 0.2s',
    userSelect: 'none'
  },
  categoryButtonActive: {
    background: '#fff',
    fontWeight: 600,
  },
  mainContent: {
    flex: 1,
    padding: 24,
    maxWidth: '100%',
    overflow: 'auto'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyText: {
    color: 'var(--accent-brown)',
    fontSize: 16
  },
  comingSoon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
  },
  comingSoonText: {
    color: 'var(--accent-brown)',
    fontSize: 16
  },
  sprintsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sprintsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sprintsTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-brown)',
    margin: 0
  },
  addSprintBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  sprintCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s'
  },
  sprintCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.2s'
  },
  sprintHeaderContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  sprintName: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-brown)'
  },
  sprintSubtitle: {
    fontSize: 13,
    color: '#666',
    flex: 1
  },
  taskCount: {
    fontSize: 12,
    color: '#999',
    background: 'var(--pale-brown)',
    padding: '4px 10px',
    borderRadius: 12
  },
  sprintContent: {
    borderTop: '1px solid #e0e0e0',
    padding: 20,
    background: '#fafafa'
  },
  tableContainer: {
    width: '100%'
  },
  tableControls: {
    display: 'flex',
    gap: 12,
    marginBottom: 16
  },
  addTaskBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  addColumnBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'var(--accent-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  tableWrapper: {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e0e0e0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14
  },
  tableHeaderRow: {
    background: 'var(--pale-brown)'
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-brown)',
    borderBottom: '2px solid var(--medium-brown)',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    transition: 'background 0.15s',
    cursor: 'pointer'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'middle'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    color: '#fff'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    color: '#fff',
    marginRight: 4,
    marginBottom: 4
  },
  multiSelectDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4
  },
  editControls: {
    display: 'flex',
    gap: 6,
    alignItems: 'center'
  },
  editInput: {
    padding: '6px 10px',
    border: '1px solid var(--accent-brown)',
    borderRadius: 4,
    fontSize: 13,
    flex: 1,
    minWidth: 120
  },
  multiSelectEdit: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    background: '#f9f9f9',
    borderRadius: 4,
    maxHeight: 200,
    overflowY: 'auto',
    minWidth: 180
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 3,
    transition: 'background 0.15s'
  },
  saveBtn: {
    padding: '6px 10px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  cancelBtn: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  deleteBtn: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  emptyTable: {
    padding: 40,
    textAlign: 'center',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e0e0e0'
  },
  emptyTableText: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14
  }
};

export default Delivery;