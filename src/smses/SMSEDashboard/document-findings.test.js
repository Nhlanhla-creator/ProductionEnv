import { statementFindings } from "./document-findings"

describe("Financial statement findings", () => {
  test("surfaces report-specific risks and follow-ups without assigning point values", () => {
    const findings = statementFindings({
      overallScore: 4,
      breakdown: { revenueGrowth: 4, profitability: 5 },
      summary:
        'Revenue growth is unverified due to single-year data. Material discrepancies were noted for annual revenue (R 1,650,000 vs R 2,500,000) and audit status.',
    })

    expect(findings.riskNotes).toHaveLength(2)
    expect(findings.followUps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Reconcile the figures flagged against the profile" }),
        expect.objectContaining({ title: "Support the reported financial trend with comparable periods" }),
      ])
    )
    expect(findings.followUps.every((item) => item.pointValue === undefined)).toBe(true)
  })

  test("does not invent follow-ups when the analysis reported no risks", () => {
    const findings = statementFindings({
      overallScore: 5,
      breakdown: { profitability: 5 },
      summary: "Profitability and cash flow are strong.",
    })

    expect(findings.riskNotes).toEqual([])
    expect(findings.followUps).toEqual([])
  })
})
