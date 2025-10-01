
"use client"
import FormField from "./form-field"
import './UniversalProfile.css';

const sourceOptions = [
  { value: "Colleague Friend", label: "Referred by a colleague or friend" },
  { value: "Social Media", label: "Social media (LinkedIn, Instagram, Facebook, etc.)" },
  { value: "Online search", label: "Online search (Google, Bing, etc.)" },
  { value: "Industry Event", label: "Industry event or webinar" },
  { value: "Accelerator/Incubator", label: "Through an accelerator or incubator" },
  { value: "News Media", label: "News article or media feature" },
  { value: "Big Team Invite", label: "Invited directly by BIG Marketplace team" },
  { value: "Client Partner", label: "Existing client or partner referral" },
  { value: "Whatsapp", label: "WhatsApp broadcast or group" },
  { value: "Other", label: "Other (please specify)" },
]

export default function HowDidYouHear({ data = {}, updateData }) {
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Clear the otherSource field if not selecting "other"
    const updatedData = { [name]: value }
    if (name === "source" && value !== "other") {
      updatedData.otherSource = ""
    }
    
    updateData(updatedData)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brown-800 mb-6">How Did You Hear About Us?</h2>

      <div className="max-w-xl mx-left">
        <FormField label="How did you hear about BIG Marketplace?" >
          <select
            name="source"
            value={data.source || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            required
          >
            <option value="">Select how you heard about us</option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {data.source === "colleague_friend" && (
          <FormField label="Who referred you?" >
            <input
              type="text"
              name="referralName"
              value={data.referralName || ""}
              onChange={handleChange}
              placeholder="Name of colleague or friend who referred you"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "social_media" && (
          <FormField label="Which social media platform?" >
            <input
              type="text"
              name="socialPlatform"
              value={data.socialPlatform || ""}
              onChange={handleChange}
              placeholder="e.g., LinkedIn, Instagram, Facebook, Twitter/X"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "industry_event" && (
          <FormField label="Event or webinar name" >
            <input
              type="text"
              name="eventName"
              value={data.eventName || ""}
              onChange={handleChange}
              placeholder="Name of the event or webinar"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "accelerator_incubator" && (
          <FormField label="Accelerator or incubator name" >
            <input
              type="text"
              name="acceleratorName"
              value={data.acceleratorName || ""}
              onChange={handleChange}
              placeholder="Name of the accelerator or incubator"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "news_media" && (
          <FormField label="News source or publication" >
            <input
              type="text"
              name="newsSource"
              value={data.newsSource || ""}
              onChange={handleChange}
              placeholder="Name of publication or news source"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "big_team_invite" && (
          <FormField label="BIG team member name">
            <input
              type="text"
              name="teamMemberName"
              value={data.teamMemberName || ""}
              onChange={handleChange}
              placeholder="Name of BIG Marketplace team member (optional)"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>
        )}

        {data.source === "client_partner" && (
          <FormField label="Client or partner name" >
            <input
              type="text"
              name="clientPartnerName"
              value={data.clientPartnerName || ""}
              onChange={handleChange}
              placeholder="Name of the client or partner who referred you"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        {data.source === "whatsapp" && (
          <FormField label="WhatsApp group or contact details">
            <input
              type="text"
              name="whatsappDetails"
              value={data.whatsappDetails || ""}
              onChange={handleChange}
              placeholder="WhatsApp group name or contact who shared"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
            />
          </FormField>
        )}

        {data.source === "other" && (
          <FormField label="Please specify" >
            <input
              type="text"
              name="otherSource"
              value={data.otherSource || ""}
              onChange={handleChange}
              placeholder="Please tell us how you heard about us"
              className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
              required
            />
          </FormField>
        )}

        <FormField label="Additional Comments">
          <textarea
            name="additionalComments"
            value={data.additionalComments || ""}
            onChange={handleChange}
            rows={4}
            placeholder="Any additional feedback about how you discovered us or your first impression (optional)"
            className="w-full px-3 py-2 border border-brown-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brown-500"
          ></textarea>
        </FormField>
      </div>

      <div className="mt-8 flex justify-end">
      
      </div>
    </div>
  )
}