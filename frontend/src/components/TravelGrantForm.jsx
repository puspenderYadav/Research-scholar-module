import React, { useState } from 'react'
import api from '../services/api'

const TravelGrantForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    grant_type: '',
    event_name: '',
    organizers: '',
    venue_country: '',
    broad_area: '',
    reasons_for_visit: '',
    start_date: '',
    end_date: '',
    funds_from_other_agencies: false,
    institute_amount: '',
    institute_reasons: '',
    funding_agency_name: '',
    sanctioned_amount: '',
    registration_waiver_requested: false,
    funds_from_supervisor_grant: false,
    supervisor_grant_amount: '',
    anticipated_expenses: '',
    other_financial_details: '',
    presenting_paper: false,
    paper_title: '',
    number_of_papers: '',
    paper_links: '',
    paper_other_details: ''
  })

  const [files, setFiles] = useState({
    invitation_letter: null,
    registration_waiver_document: null
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const grantTypes = [
    'International Conference',
    'National Conference',
    'Workshop',
    'Field Trip',
    'Research collaboration'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }))
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.grant_type) newErrors.grant_type = 'Grant type is required'
    if (!formData.event_name) newErrors.event_name = 'Event name is required'
    if (!formData.organizers) newErrors.organizers = 'Organizer(s) name is required'
    if (!formData.venue_country) newErrors.venue_country = 'Venue & Country is required'
    if (!files.invitation_letter) newErrors.invitation_letter = 'Invitation letter is required'
    if (!formData.broad_area) newErrors.broad_area = 'Broad area is required'
    if (!formData.reasons_for_visit) newErrors.reasons_for_visit = 'Reasons for visit is required'
    if (!formData.anticipated_expenses) newErrors.anticipated_expenses = 'Anticipated expenses is required'

    if (formData.funds_from_other_agencies) {
      if (formData.funding_agency_name && !formData.sanctioned_amount) {
        newErrors.sanctioned_amount = 'Sanctioned amount is required'
      }
      if (formData.registration_waiver_requested && !files.registration_waiver_document) {
        newErrors.registration_waiver_document = 'Registration waiver document is required'
      }
      if (formData.funds_from_supervisor_grant && !formData.supervisor_grant_amount) {
        newErrors.supervisor_grant_amount = 'Supervisor grant amount is required'
      }
    }

    if (formData.presenting_paper) {
      if (!formData.paper_title) newErrors.paper_title = 'Paper title is required'
      if (!formData.number_of_papers) newErrors.number_of_papers = 'Number of papers is required'
      if (!formData.paper_links) newErrors.paper_links = 'Paper links are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key])
        }
      })

      // Append files
      if (files.invitation_letter) {
        submitData.append('invitation_letter', files.invitation_letter)
      }
      if (files.registration_waiver_document) {
        submitData.append('registration_waiver_document', files.registration_waiver_document)
      }

      await api.post('/travel-grants/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      alert('Travel grant application submitted successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error submitting travel grant:', error)
      alert(error.response?.data?.error || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Apply for Travel Grant</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grant Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Travel Grant For <span className="text-red-500">*</span>
          </label>
          <select
            name="grant_type"
            value={formData.grant_type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.grant_type ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select grant type</option>
            {grantTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.grant_type && <p className="text-red-500 text-sm mt-1">{errors.grant_type}</p>}
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name of Event <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="event_name"
            value={formData.event_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.event_name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.event_name && <p className="text-red-500 text-sm mt-1">{errors.event_name}</p>}
        </div>

        {/* Organizers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name of the Organizer(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="organizers"
            value={formData.organizers}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.organizers ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.organizers && <p className="text-red-500 text-sm mt-1">{errors.organizers}</p>}
        </div>

        {/* Venue & Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue & Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="venue_country"
            value={formData.venue_country}
            onChange={handleChange}
            placeholder="e.g., New York, USA"
            className={`w-full px-3 py-2 border rounded-md ${errors.venue_country ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.venue_country && <p className="text-red-500 text-sm mt-1">{errors.venue_country}</p>}
        </div>

        {/* Invitation Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invitation Letter (PDF) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="invitation_letter"
            accept=".pdf"
            onChange={handleFileChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.invitation_letter ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.invitation_letter && <p className="text-red-500 text-sm mt-1">{errors.invitation_letter}</p>}
        </div>

        {/* Broad Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Broad Area of the Event <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="broad_area"
            value={formData.broad_area}
            onChange={handleChange}
            placeholder="e.g., Artificial Intelligence, Machine Learning"
            className={`w-full px-3 py-2 border rounded-md ${errors.broad_area ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.broad_area && <p className="text-red-500 text-sm mt-1">{errors.broad_area}</p>}
        </div>

        {/* Reasons for Visit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State Reasons for Visit <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reasons_for_visit"
            value={formData.reasons_for_visit}
            onChange={handleChange}
            rows="4"
            className={`w-full px-3 py-2 border rounded-md ${errors.reasons_for_visit ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.reasons_for_visit && <p className="text-red-500 text-sm mt-1">{errors.reasons_for_visit}</p>}
        </div>

        {/* Dates (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Funds Required Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Funds Required</h3>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="funds_from_other_agencies"
                checked={formData.funds_from_other_agencies}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Receiving funds from other agencies?</span>
            </label>
          </div>

          {formData.funds_from_other_agencies && (
            <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
              {/* Via Institute */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Via Institute</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter Amount (INR)</label>
                  <input
                    type="number"
                    name="institute_amount"
                    value={formData.institute_amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State Reasons</label>
                  <textarea
                    name="institute_reasons"
                    value={formData.institute_reasons}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Via Other Sources */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Via Other Sources</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name of the Funding Agency
                  </label>
                  <input
                    type="text"
                    name="funding_agency_name"
                    value={formData.funding_agency_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sanctioned Amount (INR)
                  </label>
                  <input
                    type="number"
                    name="sanctioned_amount"
                    value={formData.sanctioned_amount}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.sanctioned_amount ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.sanctioned_amount && <p className="text-red-500 text-sm mt-1">{errors.sanctioned_amount}</p>}
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="registration_waiver_requested"
                      checked={formData.registration_waiver_requested}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Have you requested for registration waiver from the organizers?
                    </span>
                  </label>
                </div>

                {formData.registration_waiver_requested && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attach Registration Waiver PDF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="registration_waiver_document"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.registration_waiver_document ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.registration_waiver_document && <p className="text-red-500 text-sm mt-1">{errors.registration_waiver_document}</p>}
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="funds_from_supervisor_grant"
                      checked={formData.funds_from_supervisor_grant}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Are you receiving any other funds from your supervisor's grant?
                    </span>
                  </label>
                </div>

                {formData.funds_from_supervisor_grant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mention Amount (INR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="supervisor_grant_amount"
                      value={formData.supervisor_grant_amount}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${errors.supervisor_grant_amount ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.supervisor_grant_amount && <p className="text-red-500 text-sm mt-1">{errors.supervisor_grant_amount}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Anticipated Expenses */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anticipated Expenses (in INR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="anticipated_expenses"
              value={formData.anticipated_expenses}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.anticipated_expenses ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.anticipated_expenses && <p className="text-red-500 text-sm mt-1">{errors.anticipated_expenses}</p>}
          </div>

          {/* Other Financial Details */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Financial Details</label>
            <textarea
              name="other_financial_details"
              value={formData.other_financial_details}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Presenting Paper Section */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="presenting_paper"
                checked={formData.presenting_paper}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Are you presenting a paper?</span>
            </label>
          </div>

          {formData.presenting_paper && (
            <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title of the Paper <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="paper_title"
                  value={formData.paper_title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.paper_title ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.paper_title && <p className="text-red-500 text-sm mt-1">{errors.paper_title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Papers <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="number_of_papers"
                  value={formData.number_of_papers}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md ${errors.number_of_papers ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.number_of_papers && <p className="text-red-500 text-sm mt-1">{errors.number_of_papers}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link of Papers <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="paper_links"
                  value={formData.paper_links}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter links separated by commas or newlines"
                  className={`w-full px-3 py-2 border rounded-md ${errors.paper_links ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.paper_links && <p className="text-red-500 text-sm mt-1">{errors.paper_links}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Details</label>
                <textarea
                  name="paper_other_details"
                  value={formData.paper_other_details}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TravelGrantForm
