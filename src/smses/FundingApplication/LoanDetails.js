import { useId } from "react"
import FileUpload from "./FileUpload"
import {
  bankFields,
  declarationFields,
  eligibilityFields,
  fieldApplies,
  getLoanToValue,
  loanDocuments,
  loanFields,
  loanPolicy,
  premisesFields,
  principalContext,
  principalFields,
  principalRoles,
  propertyContext,
  propertyDocuments,
  propertyFields,
  propertyOffered,
  samePrincipal,
  shareCertificatesRequired,
  signingAuthority,
} from "./loanApplication"

const emptyLoanProfile = { legalStructure: "", principals: [] }
const emptyFiles = []
const fieldsetStyle = { marginBottom: 24, padding: 16, border: "1px solid #d6c4b7", borderRadius: 8, minWidth: 0 }

// Safe UUID helper that avoids the ESLint no-undef error for globalThis.
// Uses the standard browser `crypto` global directly.
const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

function LoanField({ field, value, onChange }) {
  const id = useId()
  if (field.type === "confirmation") {
    return (
      <label className="form-field" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        <span>{field.label}</span>
      </label>
    )
  }

  const props = {
    id,
    value: value ?? "",
    onChange: (event) => onChange(event.target.value),
    "aria-required": !field.optional,
  }

  return (
    <div className="form-field">
      <label className="form-field-label" htmlFor={id}>
        {field.label} {!field.optional && <span className="required" aria-hidden="true">*</span>}
      </label>
      {field.options ? (
        <select {...props} className="form-select">
          <option value="">Select</option>
          {Object.entries(field.options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea {...props} className="form-textarea" rows={3} />
      ) : (
        <input
          {...props}
          className="form-input"
          type={["date", "email", "tel"].includes(field.type) ? field.type : "text"}
          inputMode={field.inputMode || (["money", "positiveMoney", "signedMoney"].includes(field.type) ? "decimal" :
            ["months", "count"].includes(field.type) ? "numeric" : undefined)}
          autoComplete="off"
        />
      )}
    </div>
  )
}

function LoanFields({ fields, data, context = data, update }) {
  return (
    <div className="grid-container">
      {fields.filter((field) => fieldApplies(field, context)).map((field) => (
        <LoanField key={field.id} field={field} value={data[field.id]} onChange={(value) => update({ [field.id]: value })} />
      ))}
    </div>
  )
}

function LoanUploads({ documents, data, update }) {
  return (
    <div className="grid-container">
      {documents.filter((document) => fieldApplies(document, data)).map((document) => (
        <FileUpload
          key={document.id}
          label={document.label}
          documentLabel={document.label}
          required={document.required}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
          value={data[document.id] || emptyFiles}
          onChange={(files) => update({ [document.id]: files })}
        />
      ))}
    </div>
  )
}

function LoanEligibility({ data, legalStructure }) {
  const pending = []
  if (loanPolicy.minimumAnnualTurnover === null) pending.push("annual turnover")
  if (loanPolicy.minimumAnnualNetProfit === null) pending.push("annual net profit")
  if (legalStructure === "trust" && loanPolicy.minimumTrustees === null) pending.push("minimum number of trustees")
  return (
    <ul>
      {data.taxStanding && <li>Tax standing (self-declared) · {data.taxStanding === "yes" ? "In good standing" : "Requires lender review"}</li>}
      {pending.length > 0 && <li>Lender confirmation needed for {pending.join(", ")}.</li>}
      {loanPolicy.minimumAnnualTurnover !== null && <li>Minimum annual turnover · R {loanPolicy.minimumAnnualTurnover.toLocaleString("en-ZA")}</li>}
      {loanPolicy.minimumAnnualNetProfit !== null && <li>Minimum annual net profit · R {loanPolicy.minimumAnnualNetProfit.toLocaleString("en-ZA")}</li>}
      {legalStructure === "trust" && loanPolicy.minimumTrustees !== null && <li>Minimum appointed trustees · {loanPolicy.minimumTrustees}</li>}
    </ul>
  )
}

function LoanToValue({ data, amountRequested }) {
  const ltv = getLoanToValue(data, amountRequested)
  const maximum = loanPolicy.maxLoanToValuePercent
  const basis = loanPolicy.loanToValueBasis === "requested" ? "requested" : "combined"
  if (!ltv) return <p>Enter the requested amount, current valuations and outstanding bond balances to calculate loan-to-value.</p>
  return (
    <div>
      <p>Requested loan ÷ total property valuation · <strong>{ltv.requested.toFixed(2)}%</strong></p>
      <p>Requested loan plus existing bonds ÷ total property valuation · <strong>{ltv.combined.toFixed(2)}%</strong></p>
      <p>{maximum === null
        ? "Loan-to-value limit pending lender confirmation."
        : `${basis === "requested" ? "Requested" : "Combined"} loan-to-value ${ltv[basis] <= maximum ? "meets" : "exceeds"} the ${maximum}% limit.`}</p>
    </div>
  )
}

function upsertRow(rows, id, patch) {
  return rows.map((row) => row.id === id ? { ...row, ...patch } : row)
}

export default function LoanDetails({ data, update, amountRequested, profile = emptyLoanProfile }) {
  const principals = data.principals || []
  const properties = data.properties || []
  const profilePeople = profile.principals.filter((person) => !principals.some((row) => samePrincipal(person, row)))
  const newPrincipal = (person = {}) => ({ id: newId(), ...person })
  const updatePrincipals = (rows) => update({ principals: rows, allPrincipalsIncluded: false })

  const selectSignatory = (signatoryId, patch = {}) => update({
    ...patch,
    signatoryId,
    signature: "",
    signaturePlace: "",
    signatureDate: "",
    repaymentDeclaration: false,
    historyDeclaration: false,
    authorityDeclaration: false,
    creditCheckConsent: false,
    updatedFinancialsConsent: false,
    signingAuthority: [],
  })

  const removePrincipal = (id) => {
    const rows = principals.filter((person) => person.id !== id)
    if (data.signatoryId === id) {
      selectSignatory("", { principals: rows, allPrincipalsIncluded: false })
    } else {
      updatePrincipals(rows)
    }
  }

  return (
    <div>
      <h2>Loan Application</h2>
      <fieldset style={fieldsetStyle}>
        <legend>Loan and project details</legend>
        <LoanFields fields={loanFields} data={data} update={update} />
      </fieldset>
      <fieldset style={fieldsetStyle}>
        <legend>Eligibility and disclosures</legend>
        <LoanFields fields={eligibilityFields} data={data} context={{ ...data, legalStructure: profile.legalStructure }} update={update} />
        <LoanEligibility data={data} legalStructure={profile.legalStructure} />
      </fieldset>
      <fieldset style={fieldsetStyle}>
        <legend>Operating premises and property security</legend>
        <LoanFields fields={[...premisesFields, propertyOffered]} data={data} update={update} />
        {data.propertyOffered === "yes" && (
          <>
            {properties.map((property, index) => {
              const updateProperty = (patch) => update({ properties: upsertRow(properties, property.id, patch) })
              return (
                <fieldset key={property.id} style={fieldsetStyle}>
                  <legend>Property {index + 1}</legend>
                  <LoanFields fields={propertyFields} data={property} context={propertyContext(property)} update={updateProperty} />
                  <LoanUploads documents={propertyDocuments} data={property} update={updateProperty} />
                  <button type="button" className="btn btn-secondary" onClick={() => update({ properties: properties.filter((row) => row.id !== property.id) })}>Remove property {index + 1}</button>
                </fieldset>
              )
            })}
            <button type="button" className="btn btn-secondary" onClick={() => update({ properties: [...properties, { id: newId() }] })}>Add property</button>
            <LoanToValue data={data} amountRequested={amountRequested} />
          </>
        )}
      </fieldset>
      <fieldset style={fieldsetStyle}>
        <legend>Principals and transaction signatory</legend>
        <p>List each relevant director, member or trustee. Add the authorised signatory if they are a different person.</p>
        {profilePeople.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => updatePrincipals([...principals, ...profilePeople.map(newPrincipal)])}>Add people from Universal Profile</button>
        )}
        {principals.map((person, index) => (
          <fieldset key={person.id} style={fieldsetStyle}>
            <legend>{person.fullName || `Person ${index + 1}`}</legend>
            <LoanFields
              fields={principalFields}
              data={person}
              context={principalContext(person)}
              update={(patch) => {
                const rows = upsertRow(principals, person.id, patch)
                if (patch.fullName !== undefined || patch.role !== undefined) updatePrincipals(rows)
                else update({ principals: rows })
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={() => removePrincipal(person.id)}>Remove person {index + 1}</button>
          </fieldset>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => updatePrincipals([...principals, newPrincipal()])}>Add person</button>
        <LoanField
          field={{ label: "I confirm all relevant principals are listed.", type: "confirmation" }}
          value={data.allPrincipalsIncluded}
          onChange={(value) => update({ allPrincipalsIncluded: value })}
        />
        <LoanField
          field={{
            label: "Who is signing this loan application?",
            options: Object.fromEntries(principals.filter((person) => person.fullName?.trim()).map((person) => [
              person.id, `${person.fullName} (${principalRoles[person.role] || "Role pending"})`,
            ])),
          }}
          value={data.signatoryId}
          onChange={selectSignatory}
        />
        <LoanUploads documents={[signingAuthority]} data={data} update={update} />
      </fieldset>
      <fieldset style={fieldsetStyle}>
        <legend>Bank details and supporting documents</legend>
        <LoanFields fields={bankFields} data={data} update={update} />
        <LoanField field={shareCertificatesRequired} value={data.shareCertificatesRequired} onChange={(value) => update({ shareCertificatesRequired: value })} />
        <LoanUploads documents={loanDocuments} data={data} update={update} />
      </fieldset>
      <fieldset style={fieldsetStyle}>
        <legend>Loan declarations, consent and signature</legend>
        <LoanFields fields={declarationFields} data={data} update={update} />
      </fieldset>
    </div>
  )
}

const maskNumber = (value) => `•••• ${String(value).slice(-4)}`

function SummaryTable({ fields = [], documents = [], data, context = data }) {
  const visibleFields = fields.filter((field) => fieldApplies(field, context))
  const visibleDocuments = documents.filter((document) => fieldApplies(document, data))

  return (
    <table style={{ width: "100%", tableLayout: "fixed", overflowWrap: "anywhere" }}>
      <tbody>
        {visibleFields.map((field) => {
          const value = data[field.id]
          let display = value === "" || value == null ? "—" : value
          if (field.type === "confirmation") display = value ? "Confirmed" : "Pending"
          if (field.options) display = field.options[value] || "—"
          if (value && ["idNumber", "accountNumber"].includes(field.id)) display = maskNumber(value)
          return <tr key={field.id}><th scope="row" style={{ textAlign: "left", padding: 6 }}>{field.label}</th><td style={{ padding: 6 }}>{display}</td></tr>
        })}
        {visibleDocuments.map((document) => {
          const urls = (data[document.id] || []).filter((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry))
          return (
            <tr key={document.id}>
              <th scope="row" style={{ textAlign: "left", padding: 6 }}>{document.label}</th>
              <td style={{ padding: 6 }}>
                {urls.length ? urls.map((url, index) => (
                  <div key={url}><a href={url} target="_blank" rel="noopener noreferrer">View document {index + 1}</a></div>
                )) : "—"}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function LoanDetailsSummary({ data, amountRequested }) {
  const signatory = data.principals?.find((person) => person.id === data.signatoryId)
  return (
    <details style={{ ...fieldsetStyle, background: "#faf7f2" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Loan Application</summary>
      <h3>Loan and project details</h3>
      <SummaryTable fields={loanFields} data={data} />
      <h3>Eligibility and disclosures</h3>
      <SummaryTable fields={eligibilityFields} data={data} />
      <LoanEligibility data={data} legalStructure={data.legalStructure} />
      <h3>Operating premises and security</h3>
      <SummaryTable fields={[...premisesFields, propertyOffered]} data={data} />
      {data.propertyOffered === "yes" && (
        <>
          <LoanToValue data={data} amountRequested={amountRequested} />
          {(data.properties || []).map((property, index) => (
            <div key={property.id}>
              <h4>Property {index + 1}</h4>
              <SummaryTable fields={propertyFields} documents={propertyDocuments} data={property} context={propertyContext(property)} />
            </div>
          ))}
        </>
      )}
      <h3>Principals and transaction signatory</h3>
      <p>Signatory · {signatory?.fullName || "Pending"}</p>
      {(data.principals || []).map((person) => (
        <div key={person.id}>
          <h4>{person.fullName || "Principal"}</h4>
          <SummaryTable fields={principalFields} data={person} context={principalContext(person)} />
        </div>
      ))}
      <SummaryTable fields={[{ id: "allPrincipalsIncluded", label: "All relevant principals listed", type: "confirmation" }]} documents={[signingAuthority]} data={data} />
      <h3>Bank details and supporting documents</h3>
      <SummaryTable fields={[...bankFields, shareCertificatesRequired]} documents={loanDocuments} data={data} />
      <h3>Loan declarations, consent and signature</h3>
      <SummaryTable fields={declarationFields} data={data} />
    </details>
  )
}