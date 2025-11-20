import { useState } from 'react';
import api from '../services/api';

export default function ProgressReportSubmissionForm({ onReportSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    report_period_start: '',
    report_period_end: '',
    file: null
  });

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!formData.report_period_start || !formData.report_period_end) {
      alert('Please select the report period');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', formData.file);
      data.append('report_period_start', formData.report_period_start);
      data.append('report_period_end', formData.report_period_end);

      const response = await api.post('/progress-reports', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Progress report submitted successfully! Your supervisor and doctoral committee members have been notified.');
      setFormData({
        report_period_start: '',
        report_period_end: '',
        file: null
      });
      
      // Reset file input
      e.target.reset();

      if (onReportSubmitted) {
        onReportSubmitted(response.data.report);
      }
    } catch (error) {
      console.error('Error submitting progress report:', error);
      alert(error.response?.data?.error || 'Failed to submit progress report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Submit Progress Report</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period Start <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.report_period_start}
              onChange={(e) => setFormData({ ...formData, report_period_start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period End <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.report_period_end}
              onChange={(e) => setFormData({ ...formData, report_period_end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
              required
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Report (PDF) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload your progress report as a PDF file (max 10MB)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <h4 className="font-semibold text-violet-900 mb-2">Approval Process:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-violet-800">
            <li>Your report will be sent to your supervisor and all doctoral committee members</li>
            <li>Each reviewer can approve, request changes, or reject the report</li>
            <li>If any reviewer requests changes, you'll need to revise and resubmit</li>
            <li>If any reviewer rejects, the submission is cancelled</li>
            <li>Report is considered officially submitted only after ALL reviewers approve</li>
            <li>You'll receive notifications at each step of the review process</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Progress Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
