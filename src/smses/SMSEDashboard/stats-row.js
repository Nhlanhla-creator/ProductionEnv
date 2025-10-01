"use client"

import { LegitimacyScoreCard } from "./legitimacy-score-card"
import { FundabilityScoreCard } from "./fundability-score-card"
import { CustomerReviewsCard } from "./customer-reviews-card"
import { CalendarCard } from "./compliance-score"
import "./Dashboard.css"

export function StatsRow({ styles, profileData }) {
  return (
    <div className="main-stats-row grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <LegitimacyScoreCard styles={styles} profileData={profileData} />
      <CustomerReviewsCard styles={styles} />
      <FundabilityScoreCard styles={styles} profileData={profileData} />
      <CalendarCard styles={styles} />
    </div>
  )
}
