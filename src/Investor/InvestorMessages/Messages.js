import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import MessagesComponent from "../../components/Messages/MessagesComponent"
import Upsell from "../../components/Upsell/Upsell"
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan"

const InvestorMessages = () => {
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()
  const [recipientsList, setRecipientsList] = useState([])
  const [recipientsLoading, setRecipientsLoading] = useState(true)

  useEffect(() => {
    const fetchRecipients = async () => {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        setRecipientsLoading(false)
        return
      }

      try {
        const recipientsMap = new Map()

        // SMEs this investor has applications against (I am the funder)
        const appsQuery = query(
          collection(db, "investorApplications"),
          where("funderId", "==", user.uid)
          || collection(db, "smeinvestorApplications"),
          where("funderId", "==", user.uid)
        )
        const appsSnapshot = await getDocs(appsQuery)
        appsSnapshot.forEach(doc => {
          const data = doc.data()
          const id = data.smeId
          const name = data.smeName
          if (id && name && !recipientsMap.has(id)) {
            recipientsMap.set(id, { id, name })
          }
        })

        setRecipientsList(Array.from(recipientsMap.values()))
      } catch (error) {
        console.error("Error fetching recipients:", error)
      } finally {
        setRecipientsLoading(false)
      }
    }

    fetchRecipients()
  }, [])

  const config = {
    showSidebarOffset: false,
    supportAttachments: true,
    showSearchIcon: true,
    hasRecipientDropdown: true,
  }

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  if (subscriptionLoading || recipientsLoading) {
    return (
      <div style={getContainerStyles()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "#6d4c41" }}>
            <h2>Checking subscription...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (currentPlan === "basic") {
    return (
      <Upsell
        title={"Messages"}
        subtitle={"One-to-one messaging with SMEs and partners. Available on Engage & Partner plans."}
        features={["Direct messaging with SMEs","File attachments & previews","Reply, forward & save drafts","Meeting details parsing & RSVP links"]}
        variant={"center"}
        expandedWidth={280}
        collapsedWidth={80}
        plans={["Engage", "Partner"]}
        upgradeMessage={"Upgrade to Engage or Partner to enable messaging features including attachments and direct SME communication."}
        primaryLabel={"View Available Plans"}
      />
    )
  }

  return <MessagesComponent config={config} recipientsList={recipientsList} />
}

export default InvestorMessages