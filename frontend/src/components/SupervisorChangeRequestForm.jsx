import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SupervisorChangeRequestForm({ onRequestSubmitted }) {
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_supervisor_id: '',
    reason: ''
  });

  useEffect(() => {
    loadAvailableSupervisors();
  }, []);

  const loadAvailableSupervisors = async () => {
    try {
      const response = await api.get('/supervisor-change/available-supervisors');
      setAvailableSupervisors(response.data);
    } catch (error) {
      console.error('Error loading available supervisors:', error);
      alert('Failed to load available supervisors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.new_supervisor_id) {
      alert('Please select a new supervisor');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for the supervisor change');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/supervisor-change/request', formData);
      alert('Supervisor change request submitted successfully. Both supervisors have been notified.');
      setFormData({ new_supervisor_id: '', reason: '' });
      if (onRequestSubmitted) {
        onRequestSubmitted(response.data.request);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Request Supervisor Change</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Supervisor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select New Supervisor <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.new_supervisor_id}
            onChange={(e) => setFormData({ ...formData, new_supervisor_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Select Supervisor --</option>
            {availableSupervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name} - {supervisor.designation}
                {supervisor.school && ` (${supervisor.school})`}
                {supervisor.specialization && ` - ${supervisor.specialization}`}
                {` - Current Students: ${supervisor.current_student_count}`}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Your current supervisor is excluded from this list
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Change <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please provide detailed reasons for requesting supervisor change..."
            required
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Approval Process:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Both your current supervisor and the requested new supervisor will be notified immediately</li>
            <li>Both supervisors must approve your request (if either declines, the request is cancelled)</li>
            <li>After both supervisors approve, the request goes to Dean Academics for final approval</li>
            <li>Once approved by Dean, your supervisor will be officially changed</li>
          </ol>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
