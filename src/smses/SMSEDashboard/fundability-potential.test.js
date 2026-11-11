jest.mock("../../firebaseConfig", () => ({ db: {} }))
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}))

import { scoreEnvironmentalStrength, scoreSocialStrength } from "./fundability-potential"

describe("Environmental and Social Strength scoring", () => {
  test("does not award full environmental credit for a single answer", () => {
    const result = scoreEnvironmentalStrength({
      governance: { complianceRequired: "no" },
    })

    expect(result.available).toBe(true)
    expect(result.percent).toBe(30)
    expect(result.breakdown.find((row) => row.key === "environmentalCompliance")).toMatchObject({
      percent: 100,
      evidence: "no; permits Not answered",
    })
  })

  test("scores missing permits as zero when compliance is required", () => {
    const result = scoreEnvironmentalStrength({
      governance: { complianceRequired: "yes", permitsInPlace: "no" },
    })
    const compliance = result.breakdown.find((row) => row.key === "environmentalCompliance")

    expect(compliance.percent).toBe(0)
    expect(compliance.evidence).toBe("yes; permits no")
    expect(compliance.reason).toMatch(/permits in place score fully/i)
  })

  test("does not award full social credit for a No to a positive-practice question", () => {
    const result = scoreSocialStrength({
      governance: { employmentPractices: "no" },
    })

    expect(result.available).toBe(true)
    expect(result.percent).toBe(0)
    expect(result.breakdown.find((row) => row.key === "employmentPractices")).toMatchObject({
      percent: 0,
      evidence: "no",
    })
  })

  test("treats a No incident report as favourable but still accounts for unanswered questions", () => {
    const result = scoreSocialStrength({
      governance: { socialIncidents: "no" },
    })

    expect(result.percent).toBe(17)
    expect(result.breakdown.find((row) => row.key === "socialIncidents").percent).toBe(100)
  })

  test("does not count environmental impact text as social impact evidence", () => {
    const result = scoreSocialStrength({
      socialImpact: { environmentalImpact: "We will reduce emissions through energy efficiency." },
    })

    expect(result.available).toBe(false)
    expect(result.percent).toBeNull()
    expect(result.breakdown.some((row) => row.key === "jobs")).toBe(true)
    expect(result.breakdown.every((row) => row.available === false)).toBe(true)
  })

  test("keeps unanswered environmental rows available for the inactive explorer", () => {
    const result = scoreEnvironmentalStrength({})

    expect(result.available).toBe(false)
    expect(result.percent).toBeNull()
    const exposure = result.breakdown.find((row) => row.key === "environmentalExposure")
    const compliance = result.breakdown.find((row) => row.key === "environmentalCompliance")

    expect(exposure).toMatchObject({
      section: "Governance",
      field: "exposureType",
      actionable: false,
    })
    expect(compliance).toMatchObject({
      section: "Governance",
      field: "complianceRequired",
      actionable: true,
    })
    expect(result.breakdown.every((row) => row.percent === 0)).toBe(true)
  })

  test("routes missing social evidence to the application section or its true profile field", () => {
    const result = scoreSocialStrength({})
    const jobs = result.breakdown.find((row) => row.key === "jobs")
    const employment = result.breakdown.find((row) => row.key === "employmentPractices")

    expect(jobs).toMatchObject({
      section: "Social Impact",
      field: "jobsToCreate",
      actionable: true,
    })
    expect(employment).toMatchObject({
      section: "Governance",
      field: "employmentPractices",
      actionable: true,
    })
  })
})
