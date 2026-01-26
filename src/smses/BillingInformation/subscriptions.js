import ReusableSubscription from "../../components/Subscriptions/Subscriptions";
import ReusableSubscriptionMock from "../../components/Subscriptions/MockSub";

const MySubscriptions = () => {
  return <ReusableSubscription userType="smse" showAddOns={true} />;
}

export default MySubscriptions;