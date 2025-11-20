import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SynopsisUploadTracker from '../components/SynopsisUploadTracker';
import { useAuth } from '../contexts/AuthContext';

const Synopsis = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState('');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingSynopsis, setReviewingSynopsis] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewAction, setReviewAction] = useState('');

  useEffect(() => {
    setUserRole(user?.role || '');
  }, [user]);

  useEffect(() => {
    if (!userRole) return;

    if (userRole === 'scholar') {
      setLoading(false);
      setError(null);
      return;
    }

    if (['supervisor', 'dc_member', 'apc_member', 'school_chair', 'ad_research', 'dean_academics'].includes(userRole)) {
      fetchPendingReviews();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch('http://localhost:5000/api/synopsis/pending-reviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingReviews(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch pending reviews');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const openReviewModal = (synopsisItem, action) => {
    setReviewingSynopsis(synopsisItem);
    setReviewAction(action);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewingSynopsis(null);
    setReviewComments('');
    setReviewAction('');
  };

  const handleReview = async () => {
    if (!reviewingSynopsis) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/synopsis/${reviewingSynopsis.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: reviewAction,
          comments: reviewComments
        })
      });

      if (response.ok) {
        alert(`Synopsis ${reviewAction === 'approved' ? 'approved' : reviewAction === 'rejected' ? 'rejected' : 'sent back for changes'} successfully!`);
        closeReviewModal();
        fetchData(userRole); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to review synopsis'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStageLabel = (stage) => {
    const labels = {
      'supervisor': 'Supervisor Review',
      'dc_apc': 'DC/APC Review',
      'school_chair': 'School Chair Review',
      'ad_research': 'AD Research Review',
      'dean_academics': 'Dean Academics Review',
      'completed': 'Approved'
    };
    return labels[stage] || stage;
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-violet-100 text-violet-800',
      'with_supervisor': 'bg-yellow-100 text-yellow-800',
      'with_dc_apc': 'bg-yellow-100 text-yellow-800',
      'with_school_chair': 'bg-yellow-100 text-yellow-800',
      'with_ad_research': 'bg-yellow-100 text-yellow-800',
      'with_dean': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'changes_requested': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderReviewerView = () => {
    return (
      <div>
        <div className="card">
          <div className="bg-purple-100 px-6 py-2 -mx-6 -mt-6 mb-6 rounded-t-lg">
            <h2 className="text-lg font-semibold text-purple-900">Pending Synopsis Reviews</h2>
          </div>
          {pendingReviews.length === 0 ? (
            <p className="text-gray-600">No pending synopsis reviews at this time.</p>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((syn) => (
                <div key={syn.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {syn.scholar?.name} ({syn.scholar?.enrollment_number})
                      </h3>
                      <p className="text-sm text-gray-600">
                        Version {syn.version} - Submitted: {new Date(syn.submission_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(syn.status)}`}>
                      {syn.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Current Stage</p>
                    <p className="font-semibold">{getStageLabel(syn.current_stage)}</p>
                  </div>

                  <div className="mb-4">
                    <a
                      href={`http://localhost:5000/api/synopsis/${syn.id}/download`}
                      className="text-violet-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Synopsis ({syn.file_name})
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openReviewModal(syn, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openReviewModal(syn, 'changes_requested')}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => openReviewModal(syn, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900">Synopsis</h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'scholar'
            ? 'Submit and track your synopsis through the approval process'
            : 'Review and approve synopsis submissions'}
        </p>
      </div>

      {userRole === 'scholar' ? (
        <SynopsisUploadTracker scholarId={user?.scholar_profile?.id} />
      ) : (
        renderReviewerView()
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {reviewAction === 'approved' ? 'Approve Synopsis' :
               reviewAction === 'rejected' ? 'Reject Synopsis' :
               'Request Changes'}
            </h3>

            {reviewingSynopsis && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Scholar</p>
                <p className="font-semibold">
                  {reviewingSynopsis.scholar?.name} ({reviewingSynopsis.scholar?.enrollment_number})
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {reviewAction !== 'approved' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows="4"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-violet-500"
                placeholder={
                  reviewAction === 'approved' ? 'Optional feedback...' :
                  reviewAction === 'rejected' ? 'Explain why the synopsis is being rejected...' :
                  'Describe the changes needed...'
                }
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReview}
                disabled={reviewAction !== 'approved' && !reviewComments.trim()}
                className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  reviewAction === 'approved' ? 'bg-green-600' :
                  reviewAction === 'rejected' ? 'bg-red-600' :
                  'bg-orange-600'
                }`}
              >
                Confirm {reviewAction === 'approved' ? 'Approval' : reviewAction === 'rejected' ? 'Rejection' : 'Request'}
              </button>
              <button
                onClick={closeReviewModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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

export default Synopsis;
