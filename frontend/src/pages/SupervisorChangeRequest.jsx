import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supervisorChangeAPI, supervisorAPI } from '../services/api';

const SupervisorChangeRequest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    new_supervisor_id: '',
    reason: '',
    additional_comments: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [supervisorsRes, requestsRes] = await Promise.all([
        supervisorAPI.getAll(),
        supervisorChangeAPI.getMyRequests()
      ]);

      console.log('Supervisors response:', supervisorsRes);
      console.log('Requests response:', requestsRes);

      setSupervisors(supervisorsRes.data || []);
      setMyRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.new_supervisor_id || !formData.reason) {
      setError('Please select a new supervisor and provide a reason');
      return;
    }

    try {
      setLoading(true);
      await supervisorChangeAPI.createRequest(formData);
      setSuccess('Supervisor change request submitted successfully!');
      setShowForm(false);
      setFormData({
        new_supervisor_id: '',
        reason: '',
        additional_comments: ''
      });
      loadData();
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { class: 'badge-warning', text: 'Pending' },
      'rejected_by_current': { class: 'badge-danger', text: 'Rejected by Current Supervisor' },
      'rejected_by_new': { class: 'badge-danger', text: 'Rejected by New Supervisor' },
      'rejected_by_dean': { class: 'badge-danger', text: 'Rejected by Dean' },
      'completed': { class: 'badge-success', text: 'Completed' }
    };

    const config = statusConfig[status] || { class: 'badge-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getApprovalStatus = (request) => {
    const steps = [
      {
        name: 'Current Supervisor',
        status: request.current_supervisor_status,
        comment: request.current_supervisor_comment,
        date: request.current_supervisor_reviewed_at
      },
      {
        name: 'New Supervisor',
        status: request.new_supervisor_status,
        comment: request.new_supervisor_comment,
        date: request.new_supervisor_reviewed_at
      },
      {
        name: 'Dean Academics',
        status: request.dean_status,
        comment: request.dean_comment,
        date: request.dean_reviewed_at
      }
    ];

    return steps;
  };

  if (loading && myRequests.length === 0) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Supervisor Change Request</h1>
        <p className="text-gray-600 mt-2">Request to change your research supervisor</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Request Form */}
      {!showForm ? (
        <div className="card mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            disabled={myRequests.some(req => req.status === 'pending')}
          >
            + Submit New Request
          </button>
          {myRequests.some(req => req.status === 'pending') && (
            <p className="text-sm text-gray-500 mt-2">
              You already have a pending request. Please wait for it to be processed.
            </p>
          )}
        </div>
      ) : (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">New Supervisor Change Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Supervisor *
              </label>
              <select
                name="new_supervisor_id"
                value={formData.new_supervisor_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">-- Select Supervisor --</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.user?.name} - {supervisor.designation} ({supervisor.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Change *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Please provide a clear and detailed reason for requesting the supervisor change..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                name="additional_comments"
                value={formData.additional_comments}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Any additional information or context..."
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-success" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Requests History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Request History</h2>

        {myRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No supervisor change requests found. Submit your first request above.
          </p>
        ) : (
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Request #{request.id}</h3>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Supervisor</p>
                    <p className="text-gray-800">{request.current_supervisor?.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Requested New Supervisor</p>
                    <p className="text-gray-800">{request.new_supervisor?.user?.name}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Reason</p>
                  <p className="text-gray-700 text-sm">{request.reason}</p>
                </div>

                {/* Approval Timeline */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Approval Status</p>
                  <div className="space-y-3">
                    {getApprovalStatus(request).map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {step.status === 'approved' ? (
                            <span className="text-green-500 text-xl">✓</span>
                          ) : step.status === 'rejected' ? (
                            <span className="text-red-500 text-xl">✗</span>
                          ) : (
                            <span className="text-gray-400 text-xl">○</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{step.name}</p>
                          <p className="text-xs text-gray-500">
                            {step.status === 'pending' ? 'Waiting for approval' :
                             step.status === 'approved' ? `Approved on ${new Date(step.date).toLocaleDateString()}` :
                             step.status === 'rejected' ? `Rejected on ${new Date(step.date).toLocaleDateString()}` : 'Pending'}
                          </p>
                          {step.comment && (
                            <p className="text-xs text-gray-600 mt-1 italic">"{step.comment}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorChangeRequest;
