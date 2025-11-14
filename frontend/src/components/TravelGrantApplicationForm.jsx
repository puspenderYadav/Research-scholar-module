import React, { useState } from 'react';
import api from '../services/api';

const TravelGrantApplicationForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    grant_type: '',
    event_name: '',
    organizers: '',
    venue_country: '',
    departure_date: '',
    return_date: '',
    total_days: 0,
    broad_area: '',
    reasons_for_visit: '',
    funds_from_other_agencies: false,
    via_institute: false,
    institute_amount: '',
    institute_reasons: '',
    via_other_sources: false,
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
  });

  const [files, setFiles] = useState({
    invitation_letter: null,
    waiver_document: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Auto-calculate total days when dates change
    if (name === 'departure_date' || name === 'return_date') {
      if (newFormData.departure_date && newFormData.return_date) {
        const departure = new Date(newFormData.departure_date);
        const returnDate = new Date(newFormData.return_date);
        const diffTime = Math.abs(returnDate - departure);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        newFormData.total_days = diffDays;
      }
    }

    setFormData(newFormData);
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.grant_type) newErrors.grant_type = 'Travel grant type is required';
    if (!formData.event_name) newErrors.event_name = 'Event name is required';
    if (!formData.organizers) newErrors.organizers = 'Organizer name is required';
    if (!formData.venue_country) newErrors.venue_country = 'Venue & Country is required';
    if (!formData.departure_date) newErrors.departure_date = 'Departure date is required';
    if (!formData.return_date) newErrors.return_date = 'Return date is required';
    if (!files.invitation_letter) newErrors.invitation_letter = 'Invitation letter is required';
    if (!formData.broad_area) newErrors.broad_area = 'Broad area is required';
    if (!formData.reasons_for_visit) newErrors.reasons_for_visit = 'Reason for visit is required';
    if (!formData.anticipated_expenses) newErrors.anticipated_expenses = 'Anticipated expenses is required';

    // Conditional required fields - Institute funding
    if (formData.funds_from_other_agencies && formData.via_institute) {
      if (!formData.institute_amount) newErrors.institute_amount = 'Institute amount is required';
      if (!formData.institute_reasons) newErrors.institute_reasons = 'Institute reason is required';
    }

    // Conditional required fields - Other sources
    if (formData.funds_from_other_agencies && formData.via_other_sources) {
      if (!formData.funding_agency_name) newErrors.funding_agency_name = 'Funding agency name is required';
      if (!formData.sanctioned_amount) newErrors.sanctioned_amount = 'Sanctioned amount is required';

      if (formData.registration_waiver_requested && !files.waiver_document) {
        newErrors.waiver_document = 'Waiver document is required';
      }

      if (formData.funds_from_supervisor_grant && !formData.supervisor_grant_amount) {
        newErrors.supervisor_grant_amount = 'Supervisor grant amount is required';
      }
    }

    // Remove duplicate anticipated_expenses validation (already in required fields above)

    // Conditional required fields - Presenting paper
    if (formData.presenting_paper) {
      if (!formData.paper_title) newErrors.paper_title = 'Paper title is required';
      if (!formData.number_of_papers) newErrors.number_of_papers = 'Number of papers is required';
      if (!formData.paper_links) newErrors.paper_links = 'Paper links are required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('Form validation failed. Please check the errors above.');
      // Scroll to first error
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();

      // Append all form fields (map departure_date to start_date, return_date to end_date)
      Object.keys(formData).forEach(key => {
        if (key === 'departure_date') {
          submitData.append('start_date', formData[key]);
        } else if (key === 'return_date') {
          submitData.append('end_date', formData[key]);
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append files
      if (files.invitation_letter) {
        submitData.append('invitation_letter', files.invitation_letter);
      }
      if (files.waiver_document) {
        submitData.append('registration_waiver_document', files.waiver_document);
      }

      await api.post('/travel-grants/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Travel grant application submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Apply for Travel Grant</h2>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Travel Grant Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Grant For <span className="text-red-500">*</span>
          </label>
          <select
            name="grant_type"
            value={formData.grant_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select grant type</option>
            <option value="International Conference">International Conference</option>
            <option value="National Conference">National Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Field Trip">Field Trip</option>
            <option value="Research Collaboration">Research Collaboration</option>
          </select>
          {errors.grant_type && <p className="text-red-500 text-sm mt-1">{errors.grant_type}</p>}
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name of Event <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="event_name"
            value={formData.event_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.event_name && <p className="text-red-500 text-sm mt-1">{errors.event_name}</p>}
        </div>

        {/* Organizer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name of the Organizer(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="organizers"
            value={formData.organizers}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.organizers && <p className="text-red-500 text-sm mt-1">{errors.organizers}</p>}
        </div>

        {/* Venue & Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Venue & Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="venue_country"
            value={formData.venue_country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.venue_country && <p className="text-red-500 text-sm mt-1">{errors.venue_country}</p>}
        </div>

        {/* Travel Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="departure_date"
              value={formData.departure_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.departure_date && <p className="text-red-500 text-sm mt-1">{errors.departure_date}</p>}
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="return_date"
              value={formData.return_date}
              onChange={handleChange}
              min={formData.departure_date}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.return_date && <p className="text-red-500 text-sm mt-1">{errors.return_date}</p>}
          </div>

          {/* Total Days (Auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Days
            </label>
            <input
              type="number"
              name="total_days"
              value={formData.total_days}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-semibold"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
          </div>
        </div>

        {/* Invitation Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Letter <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="invitation_letter"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.invitation_letter && <p className="text-red-500 text-sm mt-1">{errors.invitation_letter}</p>}
        </div>

        {/* Broad Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Broad Area of the Event <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="broad_area"
            value={formData.broad_area}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.broad_area && <p className="text-red-500 text-sm mt-1">{errors.broad_area}</p>}
        </div>

        {/* Reason for Visit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State Reasons for Visit <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reasons_for_visit"
            value={formData.reasons_for_visit}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.reasons_for_visit && <p className="text-red-500 text-sm mt-1">{errors.reasons_for_visit}</p>}
        </div>

        {/* Anticipated Expenses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anticipated Expenses (in INR) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="anticipated_expenses"
            value={formData.anticipated_expenses}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.anticipated_expenses && <p className="text-red-500 text-sm mt-1">{errors.anticipated_expenses}</p>}
        </div>

        {/* Funds from Other Agencies */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="funds_from_other_agencies"
              checked={formData.funds_from_other_agencies}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Funds required (receiving from other agencies)
            </span>
          </label>
        </div>

        {/* Conditional: Funds Details */}
        {formData.funds_from_other_agencies && (
          <div className="ml-6 space-y-4 border-l-2 border-blue-200 pl-4">
            {/* Via Institute */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="via_institute"
                  checked={formData.via_institute}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Via Institute</span>
              </label>

              {formData.via_institute && (
                <div className="ml-6 mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="institute_amount"
                      value={formData.institute_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.institute_amount && <p className="text-red-500 text-sm mt-1">{errors.institute_amount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State Reasons <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="institute_reasons"
                      value={formData.institute_reasons}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.institute_reasons && <p className="text-red-500 text-sm mt-1">{errors.institute_reasons}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Via Other Sources */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="via_other_sources"
                  checked={formData.via_other_sources}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Via Other Sources</span>
              </label>

              {formData.via_other_sources && (
                <div className="ml-6 mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name of the Funding Agency <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="funding_agency_name"
                      value={formData.funding_agency_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.funding_agency_name && <p className="text-red-500 text-sm mt-1">{errors.funding_agency_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sanctioned Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="sanctioned_amount"
                      value={formData.sanctioned_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.sanctioned_amount && <p className="text-red-500 text-sm mt-1">{errors.sanctioned_amount}</p>}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="registration_waiver_requested"
                        checked={formData.registration_waiver_requested}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requested registration waiver from organizers
                      </span>
                    </label>

                    {formData.registration_waiver_requested && (
                      <div className="ml-6 mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attach Waiver Document (PDF) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          name="waiver_document"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.waiver_document && <p className="text-red-500 text-sm mt-1">{errors.waiver_document}</p>}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="funds_from_supervisor_grant"
                        checked={formData.funds_from_supervisor_grant}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Receiving funds from supervisor's grant
                      </span>
                    </label>

                    {formData.funds_from_supervisor_grant && (
                      <div className="ml-6 mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mention Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="supervisor_grant_amount"
                          value={formData.supervisor_grant_amount}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.supervisor_grant_amount && <p className="text-red-500 text-sm mt-1">{errors.supervisor_grant_amount}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Other Details (Funding) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Details
              </label>
              <textarea
                name="other_financial_details"
                value={formData.other_financial_details}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Presenting Paper */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="presenting_paper"
              checked={formData.presenting_paper}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Presenting Paper</span>
          </label>
        </div>

        {/* Conditional: Paper Details */}
        {formData.presenting_paper && (
          <div className="ml-6 space-y-4 border-l-2 border-green-200 pl-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title of the Paper <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="paper_title"
                value={formData.paper_title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.paper_title && <p className="text-red-500 text-sm mt-1">{errors.paper_title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Papers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="number_of_papers"
                value={formData.number_of_papers}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.number_of_papers && <p className="text-red-500 text-sm mt-1">{errors.number_of_papers}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link of Papers <span className="text-red-500">*</span>
              </label>
              <textarea
                name="paper_links"
                value={formData.paper_links}
                onChange={handleChange}
                rows="3"
                placeholder="Enter paper links (one per line)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.paper_links && <p className="text-red-500 text-sm mt-1">{errors.paper_links}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Details
              </label>
              <textarea
                name="paper_other_details"
                value={formData.paper_other_details}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TravelGrantApplicationForm;
