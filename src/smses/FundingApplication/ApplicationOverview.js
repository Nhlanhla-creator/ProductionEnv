import FormField from "./FormField";
import FileUpload from "./FileUpload";
import {
  applicationType,
  businessFundingStage,
  urgencyOptions,
  supportFormatOptions,
} from "./applicationOptions";

export const renderApplicationOverview = (data, updateFormData) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData("applicationOverview", { [name]: value });
  };

  return (
    <>
      <h2>Application Overview</h2>

      <div className="grid-container">
        <div>
          <FormField label="Application Type" >
            <select
              name="applicationType"
              value={data.applicationType || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Application Type</option>
              {applicationType.map((type) => (
                <option 
                  key={type.value} 
                  value={type.value}
                  title={type.tooltip || ""}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* Show specification field RIGHT UNDER Application Type when "Other" is selected */}
          {data.applicationType === 'other' && (
            <FormField label="Please specify the type of support you need">
              <textarea
                name="otherApplicationTypeSpecification"
                value={data.otherApplicationTypeSpecification || ""}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Please describe the specific type of support or assistance you are looking for..."
                rows="4"
                required
              />
            </FormField>
          )}
          
          <FormField label="Submission Channel" tooltip="Auto-filled based on how you're submitting this application">
            <input
              type="text"
              name="submissionChannel"
              value={data.submissionChannel || "Online Portal"}
              onChange={handleChange}
              className="form-input"
              disabled
            />
          </FormField>

          <FormField 
            label="Funding Stage" 
            tooltip="Hover over options to see definitions"
            required
          >
            <select
              name="fundingStage"
              value={data.fundingStage || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Funding Stage</option>
              {businessFundingStage.map((stage) => (
                <option 
                  key={stage.value} 
                  value={stage.value}
                  title={stage.tooltip || ""}
                >
                  {stage.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Urgency" >
            <select
              name="urgency"
              value={data.urgency || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Urgency</option>
              {urgencyOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  title={option.tooltip || ""}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Preferred Start Date" >
            <input
              type="date"
              name="preferredStartDate"
              value={data.preferredStartDate || ""}
              onChange={handleChange}
              className="form-input"
              required
            />
          </FormField>

          {/* Support Format field - completely independent */}
          <FormField label="Additional Support Required" >
            <select
              name="supportFormat"
              value={data.supportFormat || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Additional Support Required</option>
              {supportFormatOptions.map((format) => (
                <option 
                  key={format.value} 
                  value={format.value}
                  title={format.tooltip || ""}
                >
                  {format.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* Show specification field RIGHT UNDER Support Format when "Other" is selected */}
          {data.supportFormat === 'other' && (
            <FormField label="Please specify your preferred support format" >
              <textarea
                name="otherSupportFormatSpecification"
                value={data.otherSupportFormatSpecification || ""}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Please describe your preferred support format..."
                rows="3"
                required
              />
            </FormField>
          )}
        </div>
      </div>
    </>
  );
};