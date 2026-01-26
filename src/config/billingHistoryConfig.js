// config/billingHistoryConfig.js

// Success Fee mock data - varies by user type
export const mockSuccessFeeData = {
  investor: [
    {
      id: "SF001",
      transactionId: "INF-001",
      smse: "InfoTech",
      dealValue: "2,000,000.00",
      successFeeAmount: "60,000.00",
      date: "2025-06-10",
      time: "14:30",
      status: "Paid",
      invoiceId: "INF-001",
    },
    {
      id: "SF002",
      transactionId: "WIL-002",
      smse: "WillieTech",
      dealValue: "10,000,000.00",
      successFeeAmount: "300,000.00",
      date: "2025-06-15",
      time: "09:45",
      status: "Pending",
      invoiceId: "WIL-002",
    },
  ],
  catalyst: [
    {
      id: "SF001",
      transactionId: "INF-001",
      smse: "InfoTech",
      dealValue: "2,000,000.00",
      successFeeAmount: "60,000.00",
      date: "2025-06-10",
      time: "14:30",
      status: "Paid",
      invoiceId: "INF-001",
    },
    {
      id: "SF002",
      transactionId: "WIL-002",
      smse: "WillieTech",
      dealValue: "10,000,000.00",
      successFeeAmount: "300,000.00",
      date: "2025-06-15",
      time: "09:45",
      status: "Pending",
      invoiceId: "WIL-002",
    },
  ],
  sme: [
    {
      id: "SF001",
      transactionId: "INF-001",
      investor: "InfoTech Ventures",
      dealValue: "5,100,000.00",
      successFeeAmount: "153,000.00",
      date: "2025-06-10",
      time: "14:30",
      status: "Paid",
      invoiceId: "INF-001",
    },
    {
      id: "SF002",
      transactionId: "WIL-002",
      investor: "WillieTech Capital",
      dealValue: "6,500,000.00",
      successFeeAmount: "195,000.00",
      date: "2025-06-15",
      time: "09:45",
      status: "Pending",
      invoiceId: "WIL-002",
    },
  ],
}

// Growth Tools mock data - SME only
export const mockGrowthToolsData = [
  {
    id: "GT001",
    invoiceId: "INF-001",
    package: "Boost Your Compliance Score",
    tier: "Premium",
    price: "4,999.99",
    date: "2025-06-12",
    status: "Paid",
  },
  {
    id: "GT002",
    invoiceId: "INF-002",
    package: "Boost Your Fundability Score",
    tier: "Silver",
    price: "2,499.99",
    date: "2025-06-18",
    status: "Pending",
  },
]