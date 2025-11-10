import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SupervisorChangeApprovalList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const response = await api.get('/supervisor-change/pending-approvals');
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId, action, endpoint) => {
    const comment = prompt(
      action === 'approve' 
        ? 'Optional: Add a comment for approval' 
        : 'Please provide a reason for rejection (required):'
    );

    if (action === 'reject' && !comment) {
      alert('Reason for rejection is required');
      return;
    }

    setProcessingId(requestId);
    try {
      await api.post(`/supervisor-change/${requestId}/${endpoint}`, {
        action,
        comment: comment || ''
      });
      
      alert(
        action === 'approve'
          ? 'Request approved successfully'
          : 'Request rejected successfully'
      );
      
      loadPendingRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      alert(error.response?.data?.error || 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No pending supervisor change requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pending Supervisor Change Requests</h2>
      
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Scholar & Supervisor Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scholar Information</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {request.scholar?.name}</p>
                  <p><span className="font-medium">Enrollment:</span> {request.scholar?.enrollment_number}</p>
                  <p><span className="font-medium">Program:</span> {request.scholar?.program}</p>
                  <p><span className="font-medium">Research Area:</span> {request.scholar?.research_area}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Current Supervisor</h4>
                <p className="text-sm mt-1">{request.current_supervisor?.name}</p>
                <p className="text-sm text-gray-600">{request.current_supervisor?.email}</p>
                <div className="mt-2">
                  {getStatusBadge(request.current_supervisor_status)}
                </div>
                {request.current_supervisor_comment && (
                  <p className="text-sm mt-2 text-gray-700 italic">
                    Comment: {request.current_supervisor_comment}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Requested New Supervisor</h4>
                <p className="text-sm mt-1">{request.new_supervisor?.name}</p>
                <p className="text-sm text-gray-600">{request.new_supervisor?.email}</p>
                <div className="mt-2">
                  {getStatusBadge(request.new_supervisor_status)}
                </div>
                {request.new_supervisor_comment && (
                  <p className="text-sm mt-2 text-gray-700 italic">
                    Comment: {request.new_supervisor_comment}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Request Details & Actions */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Reason for Change</h4>
                <p className="text-sm mt-2 text-gray-700 bg-gray-50 p-3 rounded">
                  {request.reason}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Request Details</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Status:</span> {getStatusBadge(request.status)}</p>
                  <p><span className="font-medium">Submitted:</span> {new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Approval Status Info */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-medium text-blue-900">Approval Status:</p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>✓ Current Supervisor: {request.current_supervisor_status}</li>
                  <li>✓ New Supervisor: {request.new_supervisor_status}</li>
                  <li>✓ Dean Approval: {request.dean_status}</li>
                </ul>
                {request.current_supervisor_status === 'pending' && request.new_supervisor_status === 'pending' && (
                  <p className="mt-2 text-xs text-blue-700">
                    ⚠️ Both supervisors must approve before Dean review
                  </p>
                )}
                {request.current_supervisor_status === 'rejected' || request.new_supervisor_status === 'rejected' && (
                  <p className="mt-2 text-xs text-red-700">
                    ❌ Request cancelled - one supervisor rejected
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {request.is_pending_for_current_user && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    Your Action Required
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproval(
                        request.id,
                        'approve',
                        request.user_role === 'current_supervisor' 
                          ? 'approve-current-supervisor' 
                          : 'approve-new-supervisor'
                      )}
                      disabled={processingId === request.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApproval(
                        request.id,
                        'reject',
                        request.user_role === 'current_supervisor' 
                          ? 'approve-current-supervisor' 
                          : 'approve-new-supervisor'
                      )}
                      disabled={processingId === request.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {request.user_role === 'current_supervisor' 
                      ? 'If you reject, the request will be cancelled immediately'
                      : 'If you reject, the request will be cancelled immediately'}
                  </p>
                </div>
              )}

              {!request.is_pending_for_current_user && request.status === 'pending' && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                  <p className="text-sm text-gray-600">
                    Waiting for {
                      request.current_supervisor_status === 'pending' && request.new_supervisor_status === 'pending'
                        ? 'both supervisors to respond'
                        : request.current_supervisor_status === 'pending'
                        ? 'current supervisor to respond'
                        : 'new supervisor to respond'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
