"use client"
import "./investor-growth-tools-orders.css"

const GrowthToolsOrders = () => {
  const orders = [
    {
      date: "2025-04-12",
      tool: "HR Policy Pack",
      type: "Template Bundle",
      price: "R249.00",
      status: "Paid",
      file: "HRpolicy.pdf",
    },
    {
      date: "2025-03-28",
      tool: "ESG Reporting Tool",
      type: "Interactive Tool",
      price: "R399.00",
      status: "Paid",
      file: "ESGreport.pdf",
    },
  ]

  return (
    <div className="growth-tools-container">
      <h2 className="growth-tools-title">Growth Tools Orders</h2>

      {orders.length > 0 ? (
        orders.map((order, idx) => (
          <div key={idx} className="growth-tools-card">
            <h3 className="tool-name">{order.tool}</h3>
            <p className="tool-type">{order.type}</p>

            <div className="order-details">
              <div className="order-detail">
                <span className="order-detail-label">Date</span>
                <span className="order-detail-value">{order.date}</span>
              </div>

              <div className="order-detail">
                <span className="order-detail-label">Price</span>
                <span className="order-detail-value">{order.price}</span>
              </div>

              <div className="order-detail">
                <span className="order-detail-label">Status</span>
                <span className="status-badge">{order.status}</span>
              </div>
            </div>

            <button className="download-button" onClick={() => alert(`Download ${order.file}`)}>
              Download
            </button>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <p>You haven't purchased any growth tools yet.</p>
        </div>
      )}
    </div>
  )
}

export default GrowthToolsOrders
