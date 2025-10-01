"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./custom-dialog"
import { Button } from "./custom-button"

// Simple icon components
const Download = () => <span>📥</span>
const X = () => <span>✕</span>
const Check = () => <span>✓</span>

export default function RegistrationSummary({ data, open, onClose, onComplete }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()

  // Helper function to format data for display
  const formatValue = (value) => {
    if (value === true) return "Yes"
    if (value === false) return "No"
    if (value === undefined || value === null || value === "") return "-"
    return value
  }

  // Helper function to get label for option values
  const getOptionLabel = (options, value) => {
    const option = options.find((opt) => opt.value === value)
    return option ? option.label : value
  }

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add title
      doc.setFontSize(18)
      doc.setTextColor(100, 70, 50) // Brown color
      doc.text("Universal Profile Registration Summary", 105, 15, { align: "center" })
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)

      let yPos = 25

      // Entity Overview
      if (data.entityOverview) {
        yPos = addSectionToPDF(doc, "Entity Overview", data.entityOverview, yPos)
      }

      // Ownership Management
      if (data.ownershipManagement) {
        yPos = addSectionToPDF(doc, "Ownership & Management", data.ownershipManagement, yPos)
      }

      // Contact Details
      if (data.contactDetails) {
        yPos = addSectionToPDF(doc, "Contact Details", data.contactDetails, yPos)
      }

      // Legal Compliance
      if (data.legalCompliance) {
        yPos = addSectionToPDF(doc, "Legal & Compliance", data.legalCompliance, yPos)
      }

      // Products & Services
      if (data.productsServices) {
        yPos = addSectionToPDF(doc, "Products & Services", data.productsServices, yPos)
      }

      // How Did You Hear
      if (data.howDidYouHear) {
        yPos = addSectionToPDF(doc, "How Did You Hear About Us", data.howDidYouHear, yPos)
      }

      // Declaration & Consent
      if (data.declarationConsent) {
        yPos = addSectionToPDF(doc, "Declaration & Consent", data.declarationConsent, yPos)
      }

      // Add date of submission
      doc.setFontSize(10)
      doc.text(`Date of Submission: ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" })

      // Save the PDF
      doc.save("universal_profile_registration.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to add a section to the PDF
  const addSectionToPDF = (doc, title, sectionData, startY) => {
    let yPos = startY

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Add section title
    doc.setFontSize(14)
    doc.setFont(undefined, "bold")
    doc.text(title, 15, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")

    // Special handling for complex sections
    if (title === "Ownership & Management") {
      // Shareholders
      if (sectionData.shareholders && sectionData.shareholders.length > 0) {
        doc.setFont(undefined, "bold")
        doc.text("Shareholders:", 15, yPos)
        yPos += 5
        doc.setFont(undefined, "normal")

        sectionData.shareholders.forEach((shareholder, index) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(`${index + 1}. ${shareholder.name || "Unnamed"} - ${shareholder.shareholding || 0}%`, 20, yPos)
          yPos += 5
        })
        yPos += 3
      }

      // Directors
      if (sectionData.directors && sectionData.directors.length > 0) {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont(undefined, "bold")
        doc.text("Directors:", 15, yPos)
        yPos += 5
        doc.setFont(undefined, "normal")

        sectionData.directors.forEach((director, index) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(
            `${index + 1}. ${director.name || "Unnamed"} - ${director.position || "Position not specified"}`,
            20,
            yPos,
          )
          yPos += 5
        })
        yPos += 3
      }
    } else if (title === "Products & Services") {
      // Product Categories
      if (sectionData.productCategories && sectionData.productCategories.length > 0) {
        doc.setFont(undefined, "bold")
        doc.text("Product Categories:", 15, yPos)
        yPos += 5
        doc.setFont(undefined, "normal")

        sectionData.productCategories.forEach((category, index) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(`${index + 1}. ${category.name || "Unnamed Category"}`, 20, yPos)
          yPos += 5

          if (category.products && category.products.length > 0) {
            category.products.forEach((product) => {
              if (yPos > 270) {
                doc.addPage()
                yPos = 20
              }
              doc.text(`   • ${product.name || "Unnamed Product"}`, 25, yPos)
              yPos += 5
            })
          }
        })
        yPos += 3
      }

      // Service Categories
      if (sectionData.serviceCategories && sectionData.serviceCategories.length > 0) {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFont(undefined, "bold")
        doc.text("Service Categories:", 15, yPos)
        yPos += 5
        doc.setFont(undefined, "normal")

        sectionData.serviceCategories.forEach((category, index) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(`${index + 1}. ${category.name || "Unnamed Category"}`, 20, yPos)
          yPos += 5

          if (category.services && category.services.length > 0) {
            category.services.forEach((service) => {
              if (yPos > 270) {
                doc.addPage()
                yPos = 20
              }
              doc.text(`   • ${service.name || "Unnamed Service"}`, 25, yPos)
              yPos += 5
            })
          }
        })
        yPos += 3
      }
    } else {
      // Standard key-value pairs for other sections
      Object.entries(sectionData).forEach(([key, value]) => {
        // Skip file uploads and arrays
        if (Array.isArray(value) || value instanceof File || key.includes("Url") || key.includes("Doc")) {
          return
        }

        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        // Format the key for display
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim()

        // Format the value
        let displayValue = formatValue(value)

        // Truncate long values
        if (typeof displayValue === "string" && displayValue.length > 60) {
          displayValue = displayValue.substring(0, 57) + "..."
        }

        doc.text(`${formattedKey}: ${displayValue}`, 20, yPos)
        yPos += 5
      })
    }

    return yPos + 5 // Add some extra space after the section
  }

  // Function to handle completion and redirection
  const handleDone = () => {
    // Close the modal
    onClose()

    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete()
    } else {
      // Default behavior: redirect to dashboard
      navigate("/dashboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brown-800">Registration Summary</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            style={{ position: "absolute", right: "16px", top: "16px" }}
          >
            <X />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Entity Overview */}
          {data.entityOverview && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Entity Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-medium">Registered Name:</span>{" "}
                    {formatValue(data.entityOverview.registeredName)}
                  </p>
                  <p>
                    <span className="font-medium">Trading Name:</span> {formatValue(data.entityOverview.tradingName)}
                  </p>
                  <p>
                    <span className="font-medium">Registration Number:</span>{" "}
                    {formatValue(data.entityOverview.registrationNumber)}
                  </p>
                  <p>
                    <span className="font-medium">Entity Type:</span> {formatValue(data.entityOverview.entityType)}
                  </p>
                  <p>
                    <span className="font-medium">Entity Size:</span> {formatValue(data.entityOverview.entitySize)}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Years in Operation:</span>{" "}
                    {formatValue(data.entityOverview.yearsInOperation)}
                  </p>
                  <p>
                    <span className="font-medium">No. of Employees:</span>{" "}
                    {formatValue(data.entityOverview.employeeCount)}
                  </p>
                  <p>
                    <span className="font-medium">Operation Stage:</span>{" "}
                    {formatValue(data.entityOverview.operationStage)}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span> {formatValue(data.entityOverview.location)}
                  </p>
                  <p>
                    <span className="font-medium">Business Description:</span>{" "}
                    {formatValue(data.entityOverview.businessDescription)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ownership & Management */}
          {data.ownershipManagement && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Ownership & Management
              </h3>

              <p>
                <span className="font-medium">Total Shares:</span> {formatValue(data.ownershipManagement.totalShares)}
              </p>

              {data.ownershipManagement.shareholders && data.ownershipManagement.shareholders.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-brown-700 mb-2">Shareholders</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-brown-200 rounded-lg">
                      <thead>
                        <tr className="bg-brown-100">
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            ID/Reg No.
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Country
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            % Shareholding
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Race
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Gender
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ownershipManagement.shareholders.map((shareholder, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.name)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.idRegNo)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.country)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.shareholding)}%</td>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.race)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(shareholder.gender)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data.ownershipManagement.directors && data.ownershipManagement.directors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-brown-700 mb-2">Directors</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-brown-200 rounded-lg">
                      <thead>
                        <tr className="bg-brown-100">
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Position
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Nationality
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-brown-700 uppercase tracking-wider border-b">
                            Exec/Non-Exec
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ownershipManagement.directors.map((director, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-brown-50"}>
                            <td className="px-4 py-2 border-b">{formatValue(director.name)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(director.id)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(director.position)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(director.nationality)}</td>
                            <td className="px-4 py-2 border-b">{formatValue(director.execType)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Details */}
          {data.contactDetails && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-medium">Primary Contact:</span>{" "}
                    {formatValue(data.contactDetails.contactTitle)} {formatValue(data.contactDetails.contactName)}
                  </p>
                  <p>
                    <span className="font-medium">ID Number:</span> {formatValue(data.contactDetails.contactId)}
                  </p>
                  <p>
                    <span className="font-medium">Business Phone:</span>{" "}
                    {formatValue(data.contactDetails.businessPhone)}
                  </p>
                  <p>
                    <span className="font-medium">Mobile:</span> {formatValue(data.contactDetails.mobile)}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {formatValue(data.contactDetails.email)}
                  </p>
                  <p>
                    <span className="font-medium">Website:</span> {formatValue(data.contactDetails.website)}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Physical Address:</span>
                  </p>
                  <p className="whitespace-pre-line">{formatValue(data.contactDetails.physicalAddress)}</p>

                  <p className="mt-2">
                    <span className="font-medium">Postal Address:</span>
                  </p>
                  <p className="whitespace-pre-line">
                    {data.contactDetails.sameAsPhysical
                      ? formatValue(data.contactDetails.physicalAddress)
                      : formatValue(data.contactDetails.postalAddress)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Legal & Compliance */}
          {data.legalCompliance && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Legal & Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-medium">Tax Number:</span> {formatValue(data.legalCompliance.taxNumber)}
                  </p>
                  <p>
                    <span className="font-medium">Tax Clearance Number:</span>{" "}
                    {formatValue(data.legalCompliance.taxClearanceNumber)}
                  </p>
                  <p>
                    <span className="font-medium">Tax Clearance Expiry:</span>{" "}
                    {formatValue(data.legalCompliance.taxClearanceDate)}
                  </p>
                  <p>
                    <span className="font-medium">VAT Number:</span> {formatValue(data.legalCompliance.vatNumber)}
                  </p>
                  <p>
                    <span className="font-medium">RSC Number:</span> {formatValue(data.legalCompliance.rscNumber)}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">UIF Number:</span> {formatValue(data.legalCompliance.uifNumber)}
                  </p>
                  <p>
                    <span className="font-medium">PAYE Number:</span> {formatValue(data.legalCompliance.payeNumber)}
                  </p>
                  <p>
                    <span className="font-medium">B-BBEE Level:</span> {formatValue(data.legalCompliance.bbbeeLevel)}
                  </p>
                  <p>
                    <span className="font-medium">B-BBEE Renewal Date:</span>{" "}
                    {formatValue(data.legalCompliance.bbbeeCertRenewalDate)}
                  </p>
                  <p>
                    <span className="font-medium">CIPC Returns Status:</span>{" "}
                    {formatValue(data.legalCompliance.cipcStatus)}
                  </p>
                  <p>
                    <span className="font-medium">COIDA Number:</span> {formatValue(data.legalCompliance.coidaNumber)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products & Services */}
          {data.productsServices && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Products & Services
              </h3>

              <p>
                <span className="font-medium">Entity Type:</span> {formatValue(data.productsServices.entityType)}
              </p>

              {data.productsServices.productCategories && data.productsServices.productCategories.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-brown-700 mb-2">Product Categories</h4>
                  {data.productsServices.productCategories.map((category, index) => (
                    <div key={index} className="mb-3 pl-4 border-l-2 border-brown-300">
                      <p className="font-medium">{formatValue(category.name)}</p>
                      {category.products && category.products.length > 0 && (
                        <ul className="list-disc pl-6 mt-1">
                          {category.products.map((product, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{formatValue(product.name)}</span>
                              {product.description && <span> - {formatValue(product.description)}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {data.productsServices.serviceCategories && data.productsServices.serviceCategories.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-brown-700 mb-2">Service Categories</h4>
                  {data.productsServices.serviceCategories.map((category, index) => (
                    <div key={index} className="mb-3 pl-4 border-l-2 border-brown-300">
                      <p className="font-medium">{formatValue(category.name)}</p>
                      {category.services && category.services.length > 0 && (
                        <ul className="list-disc pl-6 mt-1">
                          {category.services.map((service, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{formatValue(service.name)}</span>
                              {service.description && <span> - {formatValue(service.description)}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {data.productsServices.keyClients && data.productsServices.keyClients.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-brown-700 mb-2">Key Clients</h4>
                  <ul className="list-disc pl-6">
                    {data.productsServices.keyClients.map((client, index) => (
                      <li key={index}>
                        <span className="font-medium">{formatValue(client.name)}</span>
                        {client.industry && <span> - {formatValue(client.industry)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* How Did You Hear About Us */}
          {data.howDidYouHear && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                How Did You Hear About Us
              </h3>
              <p>
                <span className="font-medium">Source:</span> {formatValue(data.howDidYouHear.source)}
              </p>

              {data.howDidYouHear.source === "referral" && data.howDidYouHear.referralName && (
                <p>
                  <span className="font-medium">Referred by:</span> {formatValue(data.howDidYouHear.referralName)}
                </p>
              )}

              {data.howDidYouHear.source === "partner_org" && data.howDidYouHear.partnerName && (
                <p>
                  <span className="font-medium">Partner Organization:</span>{" "}
                  {formatValue(data.howDidYouHear.partnerName)}
                </p>
              )}

              {data.howDidYouHear.source === "event" && data.howDidYouHear.eventName && (
                <p>
                  <span className="font-medium">Event Name:</span> {formatValue(data.howDidYouHear.eventName)}
                </p>
              )}

              {data.howDidYouHear.source === "other" && data.howDidYouHear.otherSource && (
                <p>
                  <span className="font-medium">Other Source:</span> {formatValue(data.howDidYouHear.otherSource)}
                </p>
              )}

              {data.howDidYouHear.additionalComments && (
                <div className="mt-2">
                  <p>
                    <span className="font-medium">Additional Comments:</span>
                  </p>
                  <p className="whitespace-pre-line">{formatValue(data.howDidYouHear.additionalComments)}</p>
                </div>
              )}
            </div>
          )}

          {/* Declaration & Consent */}
          {data.declarationConsent && (
            <div className="bg-brown-50 p-4 rounded-lg" style={{ backgroundColor: "#efebe9" }}>
              <h3 className="text-lg font-semibold text-brown-700 mb-2" style={{ color: "#5d4037" }}>
                Declaration & Consent
              </h3>
              <p>
                <span className="font-medium">Accuracy Declaration:</span>{" "}
                {data.declarationConsent.accuracy ? "Confirmed" : "Not Confirmed"}
              </p>
              <p>
                <span className="font-medium">Data Processing Consent:</span>{" "}
                {data.declarationConsent.dataProcessing ? "Given" : "Not Given"}
              </p>
              <p>
                <span className="font-medium">Terms & Conditions Agreement:</span>{" "}
                {data.declarationConsent.termsConditions ? "Agreed" : "Not Agreed"}
              </p>
            </div>
          )}

          {/* Footer with buttons */}
          <div className="mt-6 flex justify-between items-center border-t border-brown-200 pt-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-brown-600"
              style={{ backgroundColor: "#795548", color: "white" }}
            >
              <Download /> {isGenerating ? "Generating PDF..." : "Download PDF"}
            </Button>

            {/* Done button */}
            <Button
              onClick={handleDone}
              className="bg-green-600"
              style={{ backgroundColor: "#4caf50", color: "white" }}
            >
              <Check /> Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
