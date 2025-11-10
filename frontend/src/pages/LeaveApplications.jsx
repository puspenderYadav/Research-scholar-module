import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { leaveAPI } from '../services/api';
import { format } from 'date-fns';

const LeaveApplications = () => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: 'personal',
    start_date: '',
    end_date: '',
    total_days: 0,
    reason: '',
    supporting_document: null,
    declaration1: false,
    declaration2: false,
    declaration3: false
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotalDays();
  }, [formData.start_date, formData.end_date]);

  const loadData = async () => {
    try {
      const [leavesResponse, balanceResponse] = await Promise.all([
        leaveAPI.getAll(),
        leaveAPI.getBalance()
      ]);
      setLeaves(leavesResponse.data);
      setBalance(balanceResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData({ ...formData, total_days: diffDays });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate declarations
    if (!formData.declaration1 || !formData.declaration2 || !formData.declaration3) {
      alert('Please confirm all declarations');
      return;
    }

    // Validate supporting document for non-personal leaves
    if (formData.leave_type !== 'personal' && !formData.supporting_document) {
      alert(`Supporting document is required for ${formData.leave_type} leave`);
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('leave_type', formData.leave_type);
      submitData.append('start_date', formData.start_date);
      submitData.append('end_date', formData.end_date);
      submitData.append('total_days', formData.total_days);
      submitData.append('reason', formData.reason);

      if (formData.supporting_document) {
        submitData.append('supporting_document', formData.supporting_document);
      }

      await leaveAPI.create(submitData);

      alert('Leave application submitted successfully!');
      setShowForm(false);
      setFormData({
        leave_type: 'personal',
        start_date: '',
        end_date: '',
        total_days: 0,
        reason: '',
        supporting_document: null,
        declaration1: false,
        declaration2: false,
        declaration3: false
      });
      loadData();
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert(error.response?.data?.error || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      personal: 'Personal Leave',
      medical: 'Medical Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-iit-darkblue">Leave Applications</h1>
            <p className="text-gray-600 mt-2">Manage your leave applications and track balances</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-iit-blue text-white rounded-lg hover:bg-iit-darkblue transition font-semibold"
          >
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Personal Leave</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {balance.personal_leave_remaining}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {balance.personal_leave_total} days
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medical Leave</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {balance.medical_leave_remaining}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {balance.medical_leave_total} days
                </p>
              </div>
              <div className="text-4xl">🏥</div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maternity Leave</p>
                <p className="text-2xl font-bold text-pink-600 mt-1">
                  {balance.maternity_leave_taken ? 'Taken' : 'Not Taken'}
                </p>
              </div>
              <div className="text-4xl">👶</div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paternity Leave</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {balance.paternity_leave_taken ? 'Taken' : 'Not Taken'}
                </p>
              </div>
              <div className="text-4xl">👨‍👧</div>
            </div>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
          <span className="mr-2">📋</span>
          Leave History
        </h2>

        {leaves.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No leave applications yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-iit-lightblue">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Current Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Submitted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{getLeaveTypeLabel(leave.leave_type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {leave.total_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {leave.current_stage === 'supervisor' ? 'Supervisor' : 'School Chair'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(leave.submission_date), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-iit-darkblue">Apply for Leave</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type of Leave <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="leave_type"
                    value={formData.leave_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                    required
                  >
                    <option value="personal">1 - Personal Leave (30 days)</option>
                    <option value="medical">2 - Medical Leave (30 days)</option>
                    <option value="maternity">3 - Maternity Leave</option>
                    <option value="paternity">4 - Paternity Leave</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                    required
                  />
                </div>

                {/* Total Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Days
                  </label>
                  <input
                    type="number"
                    value={formData.total_days}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Leave <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                    required
                  />
                </div>

                {/* Supporting Document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supporting Document (PDF/JPG)
                    {formData.leave_type !== 'personal' && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type="file"
                    name="supporting_document"
                    onChange={handleInputChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                    required={formData.leave_type !== 'personal'}
                  />
                  {formData.leave_type === 'personal' && (
                    <p className="text-xs text-gray-500 mt-1">Not required for personal leave</p>
                  )}
                </div>

                {/* Declarations */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-700 mb-3">Declarations:</p>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="declaration1"
                      checked={formData.declaration1}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                      required
                    />
                    <label className="text-sm text-gray-700">
                      I confirm that the information given above is true to the best of my knowledge.
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="declaration2"
                      checked={formData.declaration2}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                      required
                    />
                    <label className="text-sm text-gray-700">
                      I will not leave the campus without formal approval.
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      name="declaration3"
                      checked={formData.declaration3}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                      required
                    />
                    <label className="text-sm text-gray-700">
                      I understand that absence without sanctioned leave may result in loss of financial assistantship or registration termination.
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-iit-blue text-white rounded-lg hover:bg-iit-darkblue transition font-semibold disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveApplications;
