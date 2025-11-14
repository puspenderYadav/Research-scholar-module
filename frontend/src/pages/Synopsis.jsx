import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Synopsis = () => {
  const [userRole, setUserRole] = useState('');
  const [synopsis, setSynopsis] = useState(null);
  const [synopsisList, setSynopsisList] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingSynopsis, setReviewingSynopsis] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewAction, setReviewAction] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    fetchData(role);
  }, []);

  const fetchData = async (role) => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (role === 'scholar') {
        // Fetch scholar's synopsis submissions
        const response = await fetch('http://localhost:5000/api/synopsis/my-synopsis', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSynopsisList(data);
          if (data.length > 0) {
            setSynopsis(data[0]); // Latest synopsis
          }
        } else {
          throw new Error('Failed to fetch synopsis data');
        }
      } else if (['supervisor', 'dc_member', 'apc_member', 'school_chair', 'ad_research', 'dean_academics'].includes(role)) {
        // Fetch pending reviews for reviewers
        const response = await fetch('http://localhost:5000/api/synopsis/pending-reviews', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPendingReviews(data);
        } else {
          console.error('Failed to fetch pending reviews');
        }
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      alert('Please select a PDF file');
      e.target.value = '';
    }
  };

  const handleSubmitSynopsis = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('http://localhost:5000/api/synopsis/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('Synopsis submitted successfully!');
        setUploadFile(null);
        fetchData(userRole); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to submit synopsis'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
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
      'submitted': 'bg-blue-100 text-blue-800',
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

  const renderTimeline = () => {
    if (!synopsis) return null;

    const stages = ['supervisor', 'dc_apc', 'school_chair', 'ad_research', 'dean_academics'];
    const currentStageIndex = stages.indexOf(synopsis.current_stage);

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Approval Timeline</h3>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isPast = index < currentStageIndex;
            const isCurrent = index === currentStageIndex && !synopsis.is_approved;
            const isCompleted = synopsis.is_approved && index <= currentStageIndex;
            const approval = synopsis.approvals?.find(a => a.stage === stage);

            return (
              <div key={stage} className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted || isPast ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted || isPast ? '✓' : index + 1}
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`w-0.5 h-12 ${
                      isCompleted || isPast ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <h4 className={`font-semibold ${isCurrent ? 'text-blue-600' : ''}`}>
                    {getStageLabel(stage)}
                  </h4>
                  {approval && approval.decision !== 'pending' && (
                    <div className="mt-2 text-sm">
                      <div className={`inline-block px-2 py-1 rounded ${
                        approval.decision === 'approved' ? 'bg-green-100 text-green-800' :
                        approval.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {approval.decision.toUpperCase()}
                      </div>
                      {approval.approver_name && (
                        <p className="mt-1 text-gray-600">By: {approval.approver_name}</p>
                      )}
                      {approval.reviewed_at && (
                        <p className="text-gray-600">
                          Date: {new Date(approval.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                      {approval.comments && (
                        <p className="mt-1 text-gray-700 italic">"{approval.comments}"</p>
                      )}
                    </div>
                  )}
                  {isCurrent && (
                    <p className="mt-2 text-sm text-blue-600">Currently under review</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScholarView = () => {
    return (
      <div>
        {/* Synopsis Submission Form */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Submit Synopsis</h2>
          <form onSubmit={handleSubmitSynopsis}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Synopsis Document (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !uploadFile}
              className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Synopsis'}
            </button>
          </form>
        </div>

        {/* Current Synopsis Status */}
        {synopsis && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Synopsis Status</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-semibold">{synopsis.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Stage</p>
                <p className="font-semibold">{getStageLabel(synopsis.current_stage)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getStatusColor(synopsis.status)}`}>
                  {synopsis.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submission Date</p>
                <p className="font-semibold">
                  {new Date(synopsis.submission_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {synopsis.is_approved && (
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                <p className="text-green-800 font-semibold text-lg">Synopsis Approved!</p>
                <p className="text-green-700 text-sm mt-1">
                  Approved on: {new Date(synopsis.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Download Synopsis</h3>
              <a
                href={`http://localhost:5000/api/synopsis/${synopsis.id}/download`}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download {synopsis.file_name}
              </a>
            </div>

            {renderTimeline()}
          </div>
        )}

        {/* Previous Submissions */}
        {synopsisList.length > 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Previous Submissions</h2>
            <div className="space-y-3">
              {synopsisList.slice(1).map((syn) => (
                <div key={syn.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Version {syn.version}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(syn.submission_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(syn.status)}`}>
                      {syn.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <a
                    href={`http://localhost:5000/api/synopsis/${syn.id}/download`}
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReviewerView = () => {
    return (
      <div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending Synopsis Reviews</h2>
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
                      className="text-blue-600 hover:underline"
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
        <h1 className="text-3xl font-bold text-gray-800">Synopsis</h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'scholar'
            ? 'Submit and track your synopsis through the approval process'
            : 'Review and approve synopsis submissions'}
        </p>
      </div>

      {userRole === 'scholar' ? renderScholarView() : renderReviewerView()}

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
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
