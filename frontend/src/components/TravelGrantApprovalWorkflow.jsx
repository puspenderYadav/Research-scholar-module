import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TravelGrantApprovalWorkflow = () => {
  const { user } = useAuth();
  const [pendingGrants, setPendingGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingGrants();
  }, []);

  const fetchPendingGrants = async () => {
    try {
      const response = await api.get('/travel-grants/pending');
      setPendingGrants(response.data);
    } catch (error) {
      console.error('Error fetching pending grants:', error);
    }
  };

  const getApprovalLevel = () => {
    const roleToLevel = {
      'supervisor': 'supervisor',
      'committee_member': 'dc',
      'school_chair': 'school_chair',
      'ad_research': 'ad_research',
      'dean_academics': 'dean_academics'
    };
    return roleToLevel[user?.role] || '';
  };

  const handleAction = (grant, actionType) => {
    setSelectedGrant(grant);
    setAction(actionType);
    setShowModal(true);
    setComment('');
  };

  const submitAction = async () => {
    if (action === 'reject' && !comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/travel-grants/${selectedGrant.id}/approve`, {
        decision: action === 'approve' ? 'approved' : 'rejected',
        comments: comment
      });

      alert(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowModal(false);
      setSelectedGrant(null);
      setComment('');
      fetchPendingGrants();
    } catch (error) {
      console.error('Error processing action:', error);
      alert(error.response?.data?.error || 'Failed to process action');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLevelName = (level) => {
    const names = {
      'supervisor': 'Supervisor',
      'dc': 'Doctoral Committee',
      'school_chair': 'School Chair',
      'ad_research': 'AD Research',
      'dean_academics': 'Dean Academics'
    };
    return names[level] || level;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3 bg-purple-100">
          <h2 className="text-sm font-semibold text-purple-900">Pending Travel Grant Approvals</h2>
        </div>

        {pendingGrants.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No pending approvals at this time
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingGrants.map((grant) => (
              <div key={grant.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {grant.event_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(grant.current_status)}`}>
                        {grant.current_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Scholar:</span> {grant.scholar_name}
                      </div>
                      <div>
                        <span className="font-medium">Grant Type:</span> {grant.grant_type}
                      </div>
                      <div>
                        <span className="font-medium">Venue:</span> {grant.venue_country}
                      </div>
                      <div>
                        <span className="font-medium">Organizer:</span> {grant.organizer_name}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Broad Area:</span> {grant.broad_area}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Reason for Visit:</span>
                        <p className="mt-1">{grant.reason_for_visit}</p>
                      </div>

                      {grant.presenting_paper && (
                        <div className="col-span-2 bg-blue-50 p-3 rounded">
                          <span className="font-medium text-blue-900">Presenting Paper:</span>
                          <p className="mt-1 text-blue-800">{grant.paper_title}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {grant.number_of_papers} paper(s)
                          </p>
                        </div>
                      )}

                      {grant.funds_from_other_agencies && (
                        <div className="col-span-2 bg-green-50 p-3 rounded">
                          <span className="font-medium text-green-900">Funding Details:</span>
                          {grant.via_institute && (
                            <p className="mt-1 text-green-800">
                              Institute: ₹{grant.institute_amount}
                            </p>
                          )}
                          {grant.via_other_sources && (
                            <p className="mt-1 text-green-800">
                              {grant.funding_agency_name}: ₹{grant.sanctioned_amount}
                            </p>
                          )}
                          <p className="mt-1 text-green-800">
                            Anticipated Expenses: ₹{grant.anticipated_expenses}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Document Links */}
                    <div className="mt-3 flex space-x-4">
                      {grant.invitation_letter && (
                        <a
                          href={`/travel-grants/${grant.id}/download/invitation_letter`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          📄 View Invitation Letter
                        </a>
                      )}
                      {grant.waiver_document && (
                        <a
                          href={`/travel-grants/${grant.id}/download/waiver_document`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          📄 View Waiver Document
                        </a>
                      )}
                    </div>

                    {/* Approval History */}
                    {grant.approvals && grant.approvals.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Approval History:</p>
                        <div className="space-y-1">
                          {grant.approvals.map((approval, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-xs rounded ${getStatusBadgeColor(approval.status)}`}>
                                {getLevelName(approval.level)}
                              </span>
                              <span>-</span>
                              <span className="font-medium">{approval.status}</span>
                              {approval.comment && (
                                <>
                                  <span>-</span>
                                  <span className="italic">{approval.comment}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleAction(grant, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(grant, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {action === 'approve' ? 'Approve' : 'Reject'} Travel Grant Application
              </h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                {selectedGrant && (
                  <>
                    You are about to <strong>{action}</strong> the travel grant application for{' '}
                    <strong>{selectedGrant.event_name}</strong> by{' '}
                    <strong>{selectedGrant.scholar_name}</strong>.
                  </>
                )}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === 'reject' ? 'Reason for Rejection' : 'Comments (Optional)'}
                  {action === 'reject' && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={action === 'reject' ? 'Please provide a reason...' : 'Add any comments...'}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedGrant(null);
                  setComment('');
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelGrantApprovalWorkflow;
