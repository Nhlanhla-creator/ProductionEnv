import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebaseConfig"
import { resolveProfileContext } from "./profile-context"

export const resolveApplicationScope = async (user) => {
  if (!user?.uid) return null

  const isInvestorView = sessionStorage.getItem("investorViewMode") === "true"
  const viewingSMEId = sessionStorage.getItem("viewingSMEId")
  if (isInvestorView && viewingSMEId) {
    return {
      applicationUserId: viewingSMEId,
      companyId: null,
      matchUserId: viewingSMEId,
    }
  }

  const context = await resolveProfileContext()
  const isCompanyProfile = Boolean(
    context?.scope === "company" && context.companyId && !context.isCmf
  )
  let applicationUserIds = [context?.profileId || user.uid]

  if (isCompanyProfile) {
    const membersSnapshot = await getDocs(
      query(
        collection(db, "users"),
        where("companyId", "==", context.companyId)
      )
    )
    applicationUserIds = [
      ...new Set([
        context.profileId || user.uid,
        ...membersSnapshot.docs.map((member) => member.id),
      ]),
    ]
  }

  return {
    applicationUserId: context?.profileId || user.uid,
    applicationUserIds,
    companyId: isCompanyProfile ? context.companyId : null,
    matchUserId: context?.profileId || user.uid,
  }
}

export const resolveMatchUserId = async (user) => {
  if (!user?.uid) return null

  const isInvestorView = sessionStorage.getItem("investorViewMode") === "true"
  const viewingSMEId = sessionStorage.getItem("viewingSMEId")
  if (isInvestorView && viewingSMEId) return viewingSMEId

  const context = await resolveProfileContext()
  return context?.profileId || user.uid
}

export const getScopedApplicationDocuments = async (collectionName, scope) => {
  const applicationUserIds = scope.applicationUserIds || [
    scope.applicationUserId,
  ]
  const queries = []
  if (scope.companyId) {
    queries.push(
      getDocs(
        query(
          collection(db, collectionName),
          where("companyId", "==", scope.companyId)
        )
      )
    )
  }
  for (let index = 0; index < applicationUserIds.length; index += 30) {
    const userIds = applicationUserIds.slice(index, index + 30)
    queries.push(
      getDocs(
        query(
          collection(db, collectionName),
          where("userId", "in", userIds)
        )
      )
    )
  }

  const snapshots = await Promise.all(queries)

  const documentsById = new Map()
  snapshots.forEach((snapshot) => {
    snapshot.forEach((application) => documentsById.set(application.id, application))
  })
  return [...documentsById.values()]
}

export const getCurrentCompanyId = async () => {
  const context = await resolveProfileContext()
  return context?.scope === "company" && !context.isCmf
    ? context.companyId || null
    : null
}
