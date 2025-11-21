import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const SupervisorApprovals = () => {
  const [searchParams] = useSearchParams();
  const requestIdParam = searchParams.get('request_id');

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    if (requestIdParam && requests.length > 0) {
      const request = requests.find(r => r.id === parseInt(requestIdParam));
      if (request) {
        setSelectedRequest(request);
      }
    }
  }, [requestIdParam, requests]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisor-change/pending-approvals');
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError(err.response?.data?.error || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError(null);

      // Determine which endpoint to call based on user's role in this request
      let endpoint;
      const isCurrent = selectedRequest.current_supervisor_status === 'pending';
      const isNew = selectedRequest.new_supervisor_status === 'pending';

      if (isCurrent) {
        endpoint = `/supervisor-change/${selectedRequest.id}/approve-current-supervisor`;
      } else if (isNew) {
        endpoint = `/supervisor-change/${selectedRequest.id}/approve-new-supervisor`;
      } else {
        setError('Unable to determine approval role');
        return;
      }

      await api.post(endpoint, {
        action: approvalAction,
        comment: approvalComment
      });

      alert(`Request ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh the list
      fetchPendingApprovals();
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalComment('');
    } catch (err) {
      console.error('Error submitting approval:', err);
      setError(err.response?.data?.error || 'Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalComment('');
    setShowApprovalModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getUserRole = (request) => {
    if (request.current_supervisor_status === 'pending') {
      return 'current_supervisor';
    } else if (request.new_supervisor_status === 'pending') {
      return 'new_supervisor';
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading approvals...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Supervisor Change Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve/reject supervisor change requests
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No pending approvals at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const role = getUserRole(request);
              const isCurrent = role === 'current_supervisor';
              const isNew = role === 'new_supervisor';

              return (
                <div key={request.id} className="card hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {request.scholar?.user?.name || 'Scholar'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.scholar?.enrollment_number} • {request.scholar?.user?.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Your Role */}
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-violet-900">
                      {isCurrent && '🔵 You are the CURRENT supervisor'}
                      {isNew && '🟢 You are the REQUESTED NEW supervisor'}
                    </p>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Supervisor:</p>
                      <p className="font-medium text-gray-800">
                        {request.current_supervisor?.user?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.current_supervisor?.designation || ''}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getStatusBadge(request.current_supervisor_status)}`}>
                        {request.current_supervisor_status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Requested New Supervisor:</p>
                      <p className="font-medium text-gray-800">
                        {request.new_supervisor?.user?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.new_supervisor?.designation || ''}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getStatusBadge(request.new_supervisor_status)}`}>
                        {request.new_supervisor_status}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Reason for Change:</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-800">{request.reason}</p>
                      {request.additional_comments && (
                        <p className="text-gray-600 mt-2 text-sm">
                          <span className="font-medium">Additional Comments:</span> {request.additional_comments}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openApprovalModal(request, 'approve')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => openApprovalModal(request, 'reject')}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h2>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  You are about to <span className="font-semibold">{approvalAction}</span> the supervisor change request from:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800">
                    {selectedRequest.scholar?.user?.name} ({selectedRequest.scholar?.enrollment_number})
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {approvalAction === 'reject' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder={approvalAction === 'approve' ? 'Add any comments (optional)' : 'Please provide a reason for rejection'}
                  required={approvalAction === 'reject'}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleApprovalSubmit}
                  disabled={submitting || (approvalAction === 'reject' && !approvalComment.trim())}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${approvalAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupervisorApprovals;
