import ReusableBillingHistory from "../../components/Subscriptions/BillingHistory";

const BillingHistoryInvestor = () => {
  return (
    <ReusableBillingHistory 
      userType="investor"
      showSidebarSpacing={true}
    />
  )
}

export default BillingHistoryInvestor;