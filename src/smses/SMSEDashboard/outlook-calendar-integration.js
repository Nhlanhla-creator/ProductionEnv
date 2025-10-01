"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import "./Dashboard.css"

export function OutlookCalendarIntegration({ onSync }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // This would be replaced with actual Microsoft Graph API integration
  const connectToOutlook = async () => {
    try {
      setIsConnecting(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful connection
      setIsConnected(true)

      // Mock events from Outlook
      const mockEvents = [
        {
          id: "event-1",
          subject: "Team Meeting",
          start: {
            dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            timeZone: "UTC",
          },
        },
        {
          id: "event-2",
          subject: "Client Call",
          start: {
            dateTime: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
            timeZone: "UTC",
          },
        },
      ]

      // Notify parent component
      onSync(true, mockEvents)
    } catch (error) {
      console.error("Error connecting to Outlook:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div>
      {!isConnected ? (
        <button
          onClick={connectToOutlook}
          disabled={isConnecting}
          className="flex items-center rounded-md bg-[#0078D4] px-2 py-1 text-xs font-medium text-white hover:bg-[#106EBE]"
        >
          {isConnecting ? (
            "Connecting..."
          ) : (
            <>
              <ExternalLink size={12} className="mr-1" />
              Connect Outlook
            </>
          )}
        </button>
      ) : (
        <span className="flex items-center text-xs font-medium text-green-600">✓ Outlook Connected</span>
      )}
    </div>
  )
}
