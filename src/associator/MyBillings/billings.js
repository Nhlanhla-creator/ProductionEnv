"use client";
import React, { useState } from 'react';
import { CreditCard, History, Download, AlertCircle } from 'lucide-react';

const AssociatorBillings = () => {
  const [activeTab, setActiveTab] = useState('current');

  const subscription = {
    plan: 'Associator Pro',
    status: 'Active',
    nextBilling: '2025-01-15',
    amount: '$49/month',
    features: ['Unlimited Connections', 'Priority Support', 'Analytics Dashboard', 'API Access']
  };

  const transactions = [
    { id: 1, date: '2024-12-15', description: 'Monthly Subscription', amount: '$49.00', status: 'Paid' },
    { id: 2, date: '2024-11-15', description: 'Monthly Subscription', amount: '$49.00', status: 'Paid' },
    { id: 3, date: '2024-10-15', description: 'Monthly Subscription', amount: '$49.00', status: 'Paid' },
    { id: 4, date: '2024-09-15', description: 'Setup Fee', amount: '$99.00', status: 'Paid' },
  ];

  return (
    <div className="associator-billings">
      <div className="billings-header">
        <h1>Billing & Payments</h1>
        <p>Manage your subscription and payment history</p>
      </div>

      <div className="billing-tabs">
        <button className={activeTab === 'current' ? 'active' : ''} onClick={() => setActiveTab('current')}>
          Current Plan
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
          Billing History
        </button>
        <button className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>
          Payment Methods
        </button>
      </div>

      {activeTab === 'current' && (
        <div className="current-plan">
          <div className="plan-card">
            <div className="plan-header">
              <div>
                <h2>{subscription.plan}</h2>
                <span className={`plan-status ${subscription.status.toLowerCase()}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="plan-price">
                <h3>{subscription.amount}</h3>
                <p>per month</p>
              </div>
            </div>
            <div className="plan-details">
              <p><strong>Next Billing Date:</strong> {subscription.nextBilling}</p>
              <div className="plan-features">
                <h4>Features Included:</h4>
                <ul>
                  {subscription.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="plan-actions">
              <button className="upgrade-btn">Upgrade Plan</button>
              <button className="cancel-btn">Cancel Subscription</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="billing-history">
          <div className="history-header">
            <h3>Transaction History</h3>
            <button className="export-btn">
              <Download size={16} />
              Export CSV
            </button>
          </div>
          <div className="transactions-table">
            <div className="table-header">
              <div>Date</div>
              <div>Description</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Invoice</div>
            </div>
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-row">
                <div>{transaction.date}</div>
                <div>{transaction.description}</div>
                <div>{transaction.amount}</div>
                <div>
                  <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </div>
                <div>
                  <button className="view-invoice">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="payment-methods">
          <div className="payment-card">
            <div className="card-header">
              <CreditCard size={24} />
              <div>
                <h3>•••• 4242</h3>
                <p>Expires 12/2026</p>
              </div>
              <span className="default-badge">Default</span>
            </div>
            <div className="card-actions">
              <button>Edit</button>
              <button>Remove</button>
            </div>
          </div>
          <button className="add-payment-btn">+ Add Payment Method</button>
          
          <div className="billing-info">
            <AlertCircle size={16} />
            <p>Your subscription will automatically renew on {subscription.nextBilling}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociatorBillings;