import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getAuthToken, getUserRole } from '../utils/auth';

const Thesis = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('initial');
  const [uploading, setUploading] = useState(false);

  // For supervisor - examiner CSV upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvDeadlineDays, setCsvDeadlineDays] = useState(90);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [selectedThesisId, setSelectedThesisId] = useState(null);

  // For pending reviews
  const [pendingReviews, setPendingReviews] = useState([]);

  // For supervisor - all scholars' theses tracking
  const [allScholarsTheses, setAllScholarsTheses] = useState([]);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'all'

  // For defense scheduling
  const [schedulingThesisId, setSchedulingThesisId] = useState(null);
  const [defenseDate, setDefenseDate] = useState('');
  const [defenseTime, setDefenseTime] = useState('');
  const [defenseVenue, setDefenseVenue] = useState('');
  const [schedulingDefense, setSchedulingDefense] = useState(false);

  useEffect(() => {
    fetchThesisData();
  }, []);

  const fetchThesisData = async () => {
    try {
      const token = getAuthToken();

      if (userRole === 'scholar') {
        // Fetch scholar's own thesis
        const response = await fetch('http://localhost:5000/api/thesis/my-thesis', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setThesis(data);
        } else if (response.status === 404) {
          // No thesis found - scholar hasn't submitted yet
          setThesis(null);
        }
      } else {
        // Fetch pending reviews for supervisors/reviewers
        const response = await fetch('http://localhost:5000/api/thesis/pending-reviews', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPendingReviews(data);
        }

        // For supervisors, also fetch all scholars' theses for tracking
        if (userRole === 'supervisor') {
          const trackingResponse = await fetch('http://localhost:5000/api/thesis/my-scholars-theses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (trackingResponse.ok) {
            const trackingData = await trackingResponse.json();
            setAllScholarsTheses(trackingData);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching thesis data:', err);
      setError('Failed to load thesis data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
      setError('');
    } else {
      setError('Please select a PDF file');
      setUploadFile(null);
    }
  };

  const handleSubmitThesis = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('submission_type', submissionType);

      const token = getAuthToken();
      const endpoint = submissionType === 'final'
        ? 'http://localhost:5000/api/thesis/submit-final'
        : 'http://localhost:5000/api/thesis/submit';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Thesis submitted successfully! Your supervisor has been notified.');
        setUploadFile(null);
        setSubmissionType('initial');
        // Refresh thesis data
        setTimeout(() => {
          fetchThesisData();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit thesis');
      }
    } catch (err) {
      console.error('Error submitting thesis:', err);
      setError('Failed to submit thesis. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (thesisId, action, comments = '') => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/thesis/${thesisId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, comments })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchThesisData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to process approval');
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      setError('Failed to process approval');
    }
  };

  const handleCsvUpload = async (thesisId) => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setUploadingCsv(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('deadline_days', csvDeadlineDays);

      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/thesis/${thesisId}/upload-examiners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${data.message} Deadline: ${data.deadline}`);
        setCsvFile(null);
        setSelectedThesisId(null);
        fetchThesisData();
      } else {
        setError(data.error || 'Failed to upload examiners');
      }
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError('Failed to upload CSV file');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleScheduleDefense = async (thesisId) => {
    if (!defenseDate || !defenseTime || !defenseVenue) {
      setError('Please fill in all defense details');
      return;
    }

    setSchedulingDefense(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/thesis/${thesisId}/schedule-defense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          defense_date: defenseDate,
          defense_time: defenseTime,
          venue: defenseVenue
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Defense scheduled successfully! Scholar and committee have been notified.');
        setSchedulingThesisId(null);
        setDefenseDate('');
        setDefenseTime('');
        setDefenseVenue('');
        fetchThesisData();
      } else {
        setError(data.error || 'Failed to schedule defense');
      }
    } catch (err) {
      console.error('Error scheduling defense:', err);
      setError('Failed to schedule defense');
    } finally {
      setSchedulingDefense(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'supervisor': 'bg-violet-100 text-violet-800',
      'dc_apc': 'bg-purple-100 text-purple-800',
      'external_review': 'bg-yellow-100 text-yellow-800',
      'defense_scheduled': 'bg-orange-100 text-orange-800',
      'post_defense_revision': 'bg-pink-100 text-pink-800',
      'supervisor_final_review': 'bg-violet-100 text-violet-800',
      'dean_academics': 'bg-purple-100 text-purple-800',
      'defense_completed': 'bg-green-100 text-green-800',
      'final_approval': 'bg-violet-100 text-violet-800',
      'completed': 'bg-green-500 text-white'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return 'text-green-600';
    if (status === 'rejected') return 'text-red-600';
    if (status === 'changes_requested') return 'text-orange-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-purple-900">Thesis Submission & Defense</h1>
        <p className="text-gray-600 mt-1">
          {userRole === 'scholar'
            ? 'Submit your thesis and track its progress through the approval workflow'
            : 'Review and approve thesis submissions'
          }
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Scholar View */}
      {userRole === 'scholar' && (
        <>
          {/* Post-Defense Revised Thesis Upload - PRIORITY ALERT */}
          {thesis && thesis.status === 'awaiting_revised_thesis' && (
            <div className="card mb-6 border-4 border-red-500 bg-red-50">
              <div className="bg-red-600 text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  ACTION REQUIRED: Submit Revised Thesis
                </h2>
                <p className="text-sm mt-1">Your defense was successful! Please upload your revised thesis incorporating feedback.</p>
              </div>

              {/* Deadline Warning */}
              {thesis.revised_thesis_deadline && (
                <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
                  <p className="font-bold text-orange-800 text-lg">
                    DEADLINE: {new Date(thesis.revised_thesis_deadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {(() => {
                      const now = new Date();
                      const deadline = new Date(thesis.revised_thesis_deadline);
                      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                      if (daysLeft < 0) return 'OVERDUE! Please submit immediately.';
                      if (daysLeft === 0) return 'Due TODAY!';
                      if (daysLeft <= 7) return `${daysLeft} days remaining - URGENT!`;
                      return `${daysLeft} days remaining`;
                    })()}
                  </p>
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleSubmitThesis}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revised Thesis File (PDF) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      handleFileChange(e);
                      setSubmissionType('post_defense_revision');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    required
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-2 font-semibold">✓ Selected: {uploadFile.name}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Submission:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Supervisor will review your revised thesis</li>
                    <li>After supervisor approval, it goes to Dean Academics</li>
                    <li>After Dean approval, your degree will be awarded!</li>
                  </ol>
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading Revised Thesis...' : 'Submit Revised Thesis'}
                </button>
              </form>
            </div>
          )}

          {/* Regular Thesis Submission Form - Hidden if awaiting revised thesis */}
          {(!thesis || thesis.status !== 'awaiting_revised_thesis') && (
            <div className="card mb-6">
              <div className="bg-purple-100 px-6 py-2 -mx-6 -mt-6 mb-6 rounded-t-lg">
                <h2 className="text-lg font-semibold text-purple-900">Submit Thesis</h2>
              </div>
              <form onSubmit={handleSubmitThesis}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Type
                  </label>
                  <select
                    value={submissionType}
                    onChange={(e) => setSubmissionType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                  >
                    <option value="initial">Initial Submission</option>
                    <option value="revision_minor">Minor Revision</option>
                    <option value="revision_major">Major Revision</option>
                    <option value="final">Final Submission (After Defense)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thesis File (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                  {uploadFile && (
                    <p className="text-sm text-gray-600 mt-2">Selected: {uploadFile.name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Uploading...' : 'Submit Thesis'}
                </button>
              </form>
            </div>
          )}

          {/* Current Thesis Status */}
          {thesis && (
            <div className="card">
              <div className="bg-purple-100 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-lg">
                <h2 className="text-xl font-semibold text-purple-900">Your Thesis Status</h2>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Version</p>
                    <p className="font-semibold">Version {thesis.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submission Type</p>
                    <p className="font-semibold capitalize">{thesis.submission_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Stage</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStageColor(thesis.current_stage)}`}>
                      {thesis.current_stage?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${getStatusColor(thesis.status)}`}>
                      {thesis.status?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Submission Date */}
                <div>
                  <p className="text-sm text-gray-600">Submitted On</p>
                  <p className="font-semibold">
                    {new Date(thesis.submission_date).toLocaleString()}
                  </p>
                </div>

                {/* External Examiner Deadline */}
                {thesis.external_examiner_deadline && (
                  <div>
                    <p className="text-sm text-gray-600">Examiner Deadline</p>
                    <p className="font-semibold text-orange-600">
                      {new Date(thesis.external_examiner_deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Revised Thesis Deadline (Post-Defense) */}
                {thesis.revised_thesis_deadline && (
                  <div className="col-span-2">
                    <div className="bg-orange-50 border-2 border-orange-400 p-3 rounded-lg">
                      <p className="text-sm text-orange-800 font-semibold mb-1">
                        Revised Thesis Submission Deadline
                      </p>
                      <p className="font-bold text-orange-900 text-lg">
                        {new Date(thesis.revised_thesis_deadline).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        {(() => {
                          const now = new Date();
                          const deadline = new Date(thesis.revised_thesis_deadline);
                          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                          if (daysLeft < 0) return 'OVERDUE!';
                          if (daysLeft === 0) return 'Due TODAY!';
                          if (daysLeft <= 7) return `${daysLeft} days remaining - URGENT!`;
                          return `${daysLeft} days remaining`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Examiners */}
                {thesis.examiners && thesis.examiners.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">External Examiners ({thesis.examiners.length})</p>
                    <div className="space-y-2">
                      {thesis.examiners.map((assignment, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-semibold">{assignment.examiner?.name}</p>
                          <p className="text-sm text-gray-600">{assignment.examiner?.institution}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <span className={`text-sm ${assignment.report_submitted ? 'text-green-600' : 'text-gray-500'}`}>
                              {assignment.report_submitted ? '✓ Report Submitted' : 'Pending Report'}
                            </span>
                            {assignment.recommendation && (
                              <span className="text-sm font-semibold text-blue-600">
                                {assignment.recommendation.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Defense */}
                {thesis.latest_defense && (
                  <div className="bg-violet-50 p-4 rounded-lg">
                    <p className="font-semibold text-violet-900 mb-2">Defense Scheduled</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Date:</span> {new Date(thesis.latest_defense.defense_date).toLocaleDateString()}</p>
                      {thesis.latest_defense.defense_time && (
                        <p><span className="font-medium">Time:</span> {thesis.latest_defense.defense_time}</p>
                      )}
                      {thesis.latest_defense.venue && (
                        <p><span className="font-medium">Venue:</span> {thesis.latest_defense.venue}</p>
                      )}
                      <p><span className="font-medium">Status:</span>
                        <span className={`ml-2 ${thesis.latest_defense.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                          {thesis.latest_defense.status?.toUpperCase()}
                        </span>
                      </p>
                      {thesis.latest_defense.outcome && (
                        <p><span className="font-medium">Outcome:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {thesis.latest_defense.outcome.replace('_', ' ').toUpperCase()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Degree Awarded */}
                {thesis.is_approved && (
                  <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg">
                    <p className="text-xl font-bold text-green-700">DEGREE AWARDED!</p>
                    {thesis.approved_at && (
                      <p className="text-sm text-green-600 mt-1">
                        Approved on: {new Date(thesis.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Workflow Progress</h3>
                  <div className="relative">
                    {['supervisor', 'dc_apc', 'external_review', 'defense_scheduled', 'post_defense_revision', 'supervisor_final_review', 'dean_academics', 'completed'].map((stage, idx, arr) => {
                      const isActive = thesis.current_stage === stage;
                      const isPast = arr.indexOf(thesis.current_stage) > idx;

                      return (
                        <div key={stage} className="flex items-center mb-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isPast || isActive ? 'bg-violet-600 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <div className="ml-4">
                            <p className={`font-medium ${isActive ? 'text-violet-600' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                              {stage.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Supervisor/Reviewer View */}
      {userRole !== 'scholar' && (
        <div className="space-y-6">
          {/* Tabs for Supervisor */}
          {userRole === 'supervisor' && (
            <div className="flex gap-4 border-b border-gray-200 mb-4">
              <button
                onClick={() => setViewMode('pending')}
                className={`pb-2 px-4 font-semibold ${
                  viewMode === 'pending'
                    ? 'border-b-2 border-violet-600 text-violet-600'
                    : 'text-gray-600'
                }`}
              >
                Pending Reviews ({pendingReviews.length})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`pb-2 px-4 font-semibold ${
                  viewMode === 'all'
                    ? 'border-b-2 border-violet-600 text-violet-600'
                    : 'text-gray-600'
                }`}
              >
                All Scholars' Theses ({allScholarsTheses.length})
              </button>
            </div>
          )}

          {/* Pending Reviews Section */}
          {viewMode === 'pending' && (
            <div className="card">
              <div className="bg-purple-100 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-lg">
                <h2 className="text-xl font-semibold text-purple-900">
                  Pending Reviews ({pendingReviews.length})
                </h2>
              </div>

            {pendingReviews.length === 0 ? (
              <p className="text-gray-600">No pending thesis reviews</p>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((thesis) => (
                  <div key={thesis.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {thesis.scholar?.name} ({thesis.scholar?.enrollment_number})
                        </h3>
                        <p className="text-sm text-gray-600">{thesis.scholar?.program}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStageColor(thesis.current_stage)}`}>
                        {thesis.current_stage?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Version</p>
                        <p className="font-semibold">V{thesis.version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-semibold capitalize">{thesis.submission_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-semibold">{new Date(thesis.submission_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Special Alert for Final Review */}
                    {thesis.current_stage === 'supervisor_final_review' && (
                      <div className="mb-4 bg-violet-50 border-l-4 border-violet-500 p-3">
                        <p className="font-semibold text-violet-900">
                          Post-Defense Final Review
                        </p>
                        <p className="text-sm text-violet-800 mt-1">
                          This is the revised thesis submitted after defense. Once approved, it will go to Dean Academics for final approval and degree award.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {thesis.current_stage === 'supervisor_final_review' ? (
                        <>
                          {/* Final Approval Buttons */}
                          <button
                            onClick={() => handleApprove(thesis.id, 'approved', 'Final revision approved - forwarding to Dean Academics')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                          >
                            ✓ Approve Final Revision
                          </button>
                          <button
                            onClick={() => {
                              const comments = prompt('Enter feedback for additional changes:');
                              if (comments) handleApprove(thesis.id, 'changes_requested', comments);
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                          >
                            Request Additional Changes
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Regular Approval Buttons */}
                          <button
                            onClick={() => handleApprove(thesis.id, 'approved', 'Approved')}
                            className="btn-primary text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const comments = prompt('Enter comments for changes:');
                              if (comments) handleApprove(thesis.id, 'changes_requested', comments);
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                          >
                            Request Changes
                          </button>
                          <button
                            onClick={() => {
                              const comments = prompt('Enter reason for rejection:');
                              if (comments) handleApprove(thesis.id, 'rejected', comments);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* CSV Upload for Supervisor */}
                      {userRole === 'supervisor' && thesis.status === 'awaiting_examiner_upload' && (
                        <button
                          onClick={() => setSelectedThesisId(thesis.id)}
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
                        >
                          Upload Examiners CSV
                        </button>
                      )}

                      {/* Schedule Defense Button */}
                      {userRole === 'supervisor' && thesis.status === 'ready_for_defense' && (
                        <button
                          onClick={() => setSchedulingThesisId(thesis.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                        >
                          Schedule Defense
                        </button>
                      )}
                    </div>

                    {/* Defense Scheduling Form */}
                    {schedulingThesisId === thesis.id && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-500">
                        <h4 className="font-semibold text-green-800 mb-3">Schedule Thesis Defense</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Defense Date *
                            </label>
                            <input
                              type="date"
                              value={defenseDate}
                              onChange={(e) => setDefenseDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Defense Time *
                            </label>
                            <input
                              type="time"
                              value={defenseTime}
                              onChange={(e) => setDefenseTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Venue *
                            </label>
                            <input
                              type="text"
                              value={defenseVenue}
                              onChange={(e) => setDefenseVenue(e.target.value)}
                              placeholder="e.g., Conference Room A, Building 3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleScheduleDefense(thesis.id)}
                              disabled={!defenseDate || !defenseTime || !defenseVenue || schedulingDefense}
                              className="btn-primary disabled:opacity-50"
                            >
                              {schedulingDefense ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                            <button
                              onClick={() => {
                                setSchedulingThesisId(null);
                                setDefenseDate('');
                                setDefenseTime('');
                                setDefenseVenue('');
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CSV Upload Form */}
                    {selectedThesisId === thesis.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Upload External Examiners</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CSV File
                            </label>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={(e) => setCsvFile(e.target.files[0])}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Deadline (days)
                            </label>
                            <input
                              type="number"
                              value={csvDeadlineDays}
                              onChange={(e) => setCsvDeadlineDays(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              min="1"
                              max="365"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCsvUpload(thesis.id)}
                              disabled={!csvFile || uploadingCsv}
                              className="btn-primary disabled:opacity-50"
                            >
                              {uploadingCsv ? 'Uploading...' : 'Upload & Send Invitations'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedThesisId(null);
                                setCsvFile(null);
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* All Scholars' Theses Tracking */}
          {viewMode === 'all' && userRole === 'supervisor' && (
            <div className="card">
              <div className="bg-purple-100 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-lg">
                <h2 className="text-xl font-semibold text-purple-900">
                  All Scholars' Theses Tracking ({allScholarsTheses.length})
                </h2>
              </div>

              {allScholarsTheses.length === 0 ? (
                <p className="text-gray-600">No thesis submissions from your scholars yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-purple-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Scholar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Version</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Stage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Examiners</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allScholarsTheses.map((thesis) => (
                        <tr key={thesis.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{thesis.scholar?.name}</div>
                              <div className="text-sm text-gray-500">{thesis.scholar?.enrollment_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            V{thesis.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(thesis.current_stage)}`}>
                              {thesis.current_stage?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getStatusColor(thesis.status)}`}>
                              {thesis.status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {thesis.examiners && thesis.examiners.length > 0 ? (
                              <div>
                                <div className="text-sm font-medium">{thesis.examiners.length} assigned</div>
                                <div className="text-xs text-gray-500">
                                  {thesis.examiners.filter(e => e.report_submitted).length} submitted
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(thesis.submission_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {thesis.status === 'ready_for_defense' && (
                              <button
                                onClick={() => setSchedulingThesisId(thesis.id)}
                                className="text-green-600 hover:text-green-900 font-semibold"
                              >
                                Schedule Defense
                              </button>
                            )}
                            {thesis.status === 'awaiting_examiner_upload' && (
                              <button
                                onClick={() => setSelectedThesisId(thesis.id)}
                                className="text-violet-600 hover:text-violet-900"
                              >
                                Upload Examiners
                              </button>
                            )}
                            {thesis.latest_defense && (
                              <span className="text-gray-600">
                                Defense: {new Date(thesis.latest_defense.defense_date).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CSV Format Help */}
          {userRole === 'supervisor' && (
          <div className="card bg-violet-50">
            <h3 className="font-semibold text-gray-800 mb-2">CSV Format for Examiners</h3>
            <p className="text-sm text-gray-700 mb-2">
              Required columns: name, email, institution
            </p>
            <p className="text-sm text-gray-700 mb-2">
              Optional: designation, specialization, phone, country
            </p>
            <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
name,email,institution,designation,specialization,phone,country
Dr. John Smith,john@mit.edu,MIT,Professor,Machine Learning,+1234567890,USA
            </pre>
          </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Thesis;
