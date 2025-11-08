import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supervisorChangeAPI } from '../services/api';

const SupervisorChangeApprovals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await supervisorChangeAPI.getPendingApprovals();
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request, action) => {
    setSelectedRequest(request);
    setModalAction(action);
    setComment('');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setModalAction('');
    setComment('');
  };

  const handleApproval = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      const data = {
        action: modalAction,
        comment: comment
      };

      // Determine which endpoint to call based on user role and request state
      if (user.role === 'supervisor') {
        // Check if this supervisor is the current or new supervisor
        if (selectedRequest.current_supervisor_status === 'pending') {
          await supervisorChangeAPI.approveByCurrentSupervisor(selectedRequest.id, data);
        } else {
          await supervisorChangeAPI.approveByNewSupervisor(selectedRequest.id, data);
        }
      } else if (user.role === 'dean_academics' || user.role === 'ad_research') {
        await supervisorChangeAPI.approveByDean(selectedRequest.id, data);
      }

      setSuccess(`Request ${modalAction}d successfully!`);
      closeModal();
      loadRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      setError(error.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getMyRoleInRequest = (request) => {
    if (user.role === 'supervisor') {
      if (request.current_supervisor_status === 'pending') {
        return 'current_supervisor';
      } else if (request.new_supervisor_status === 'pending') {
        return 'new_supervisor';
      }
    } else if (user.role === 'dean_academics' || user.role === 'ad_research') {
      return 'dean';
    }
    return null;
  };

  if (loading && requests.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-800">Supervisor Change Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and approve supervisor change requests
        </p>
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

      {/* Pending Requests */}
      <div className="card">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-2">No pending approvals</p>
            <p className="text-sm text-gray-400">
              All supervisor change requests have been processed
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => {
              const myRole = getMyRoleInRequest(request);
              return (
                <div key={request.id} className="border border-gray-300 rounded-lg p-5 bg-white shadow-sm">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Request #{request.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge badge-warning">Pending Your Approval</span>
                  </div>

                  {/* Scholar Info */}
                  <div className="bg-blue-50 rounded p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700">Scholar</p>
                    <p className="text-gray-800 font-semibold">
                      {request.scholar?.user?.name} ({request.scholar?.enrollment_number})
                    </p>
                  </div>

                  {/* Supervisors Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Current Supervisor</p>
                      <p className="text-gray-800">{request.current_supervisor?.user?.name}</p>
                      <p className="text-xs text-gray-500">{request.current_supervisor?.designation}</p>
                      {request.current_supervisor_status === 'approved' && (
                        <p className="text-xs text-green-600 mt-1">✓ Approved</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Requested New Supervisor</p>
                      <p className="text-gray-800">{request.new_supervisor?.user?.name}</p>
                      <p className="text-xs text-gray-500">{request.new_supervisor?.designation}</p>
                      {request.new_supervisor_status === 'approved' && (
                        <p className="text-xs text-green-600 mt-1">✓ Approved</p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Reason for Change</p>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.reason}</p>
                    </div>
                  </div>

                  {/* Additional Comments */}
                  {request.additional_comments && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Additional Comments</p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.additional_comments}</p>
                      </div>
                    </div>
                  )}

                  {/* Previous Approvals */}
                  {myRole !== 'current_supervisor' && request.current_supervisor_comment && (
                    <div className="mb-4 border-l-4 border-green-500 bg-green-50 p-3">
                      <p className="text-sm font-medium text-gray-700">Current Supervisor's Comment</p>
                      <p className="text-sm text-gray-600 italic">"{request.current_supervisor_comment}"</p>
                    </div>
                  )}

                  {myRole === 'dean' && request.new_supervisor_comment && (
                    <div className="mb-4 border-l-4 border-green-500 bg-green-50 p-3">
                      <p className="text-sm font-medium text-gray-700">New Supervisor's Comment</p>
                      <p className="text-sm text-gray-600 italic">"{request.new_supervisor_comment}"</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => openModal(request, 'approve')}
                      className="btn-success"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => openModal(request, 'reject')}
                      className="btn-danger"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {modalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You are about to <strong>{modalAction}</strong> the supervisor change request for:
              </p>
              <p className="font-semibold text-gray-800">
                {selectedRequest.scholar?.user?.name} ({selectedRequest.scholar?.enrollment_number})
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment {modalAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="input-field"
                placeholder={`Provide ${modalAction === 'reject' ? 'reason for rejection' : 'any additional comments'}...`}
                required={modalAction === 'reject'}
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleApproval}
                className={modalAction === 'approve' ? 'btn-success' : 'btn-danger'}
                disabled={loading || (modalAction === 'reject' && !comment.trim())}
              >
                {loading ? 'Processing...' : `Confirm ${modalAction === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
              <button
                onClick={closeModal}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SupervisorChangeApprovals;
