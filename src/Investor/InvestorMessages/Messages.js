import { useEffect, useState } from "react"
import MessagesComponent from "../../components/Messages/MessagesComponent"
import Upsell from "../../components/Upsell/Upsell"
import useSubscriptionPlan from "../../hooks/useSubscriptionPlan"

const InvestorMessages = () => {
  const { currentPlan, subscriptionLoading } = useSubscriptionPlan()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    checkSidebarState()
    window.addEventListener("sidebarToggle", checkSidebarState)
    window.addEventListener("storage", checkSidebarState)

    return () => {
      window.removeEventListener("sidebarToggle", checkSidebarState)
      window.removeEventListener("storage", checkSidebarState)
    }
  }, [])



  const config = {
    supportAttachments: true,
    showSearchIcon: true,
    hasRecipientDropdown: false,
  }

  const getContainerStyles = () => ({
    width: "100%",
    minHeight: "100vh",
    maxWidth: "100vw",
    overflowX: "hidden",
    padding: `72px 20px 20px ${isSidebarCollapsed ? "80px" : "280px"}`,
    margin: "0",
    boxSizing: "border-box",
    position: "relative",
    transition: "padding 0.3s ease",
    backgroundColor: "#f8f9fa",
  })

  if (subscriptionLoading) {
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

  return <MessagesComponent config={config} />
}

export default InvestorMessages
