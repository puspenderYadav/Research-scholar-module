import React, { useState, useEffect } from 'react';
import { synopsisAPI } from '../services/api';

const SynopsisUploadTracker = ({ scholarId }) => {
  const [synopses, setSynopses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSynopses();
  }, []);

  const loadSynopses = async () => {
    try {
      setLoading(true);
      const response = await synopsisAPI.getMySynopses();
      setSynopses(response.data || []);
    } catch (error) {
      console.error('Error loading synopses:', error);
      setError('Failed to load synopsis history');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      await synopsisAPI.submit(formData);

      setSuccess('Synopsis submitted successfully! Your supervisor has been notified.');
      setSelectedFile(null);
      // Reset file input
      document.getElementById('synopsis-file-input').value = '';

      // Reload synopses to show the new submission
      loadSynopses();
    } catch (error) {
      console.error('Error uploading synopsis:', error);
      setError(error.response?.data?.error || 'Failed to upload synopsis');
    } finally {
      setUploading(false);
    }
  };

  const getStageInfo = (stage) => {
    const stages = {
      supervisor: { label: 'Supervisor Review', icon: '1', color: 'blue' },
      dc_apc: { label: 'DC/APC Review', icon: '2', color: 'purple' },
      school_chair: { label: 'School Chair Review', icon: '3', color: 'indigo' },
      ad_research: { label: 'Assoc. Dean Research', icon: '4', color: 'violet' },
      dean_academics: { label: 'Dean Academics', icon: '5', color: 'pink' },
      completed: { label: 'Approved', icon: '✓', color: 'green' },
      rejected: { label: 'Rejected', icon: '✗', color: 'red' }
    };
    return stages[stage] || { label: stage, icon: '•', color: 'gray' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      with_supervisor: { label: 'With Supervisor', class: 'bg-blue-100 text-blue-800' },
      with_dc_apc: { label: 'With DC/APC', class: 'bg-purple-100 text-purple-800' },
      with_school_chair: { label: 'With School Chair', class: 'bg-indigo-100 text-indigo-800' },
      with_ad_research: { label: 'With AD Research', class: 'bg-violet-100 text-violet-800' },
      with_dean: { label: 'With Dean', class: 'bg-pink-100 text-pink-800' },
      approved: { label: 'Approved', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800' },
      changes_requested: { label: 'Changes Requested', class: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const renderProgressTracker = (synopsis) => {
    const allStages = ['supervisor', 'dc_apc', 'school_chair', 'ad_research', 'dean_academics'];
    const currentStageIndex = allStages.indexOf(synopsis.current_stage);

    if (synopsis.status === 'rejected') {
      return (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center text-red-700">
            <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <div>
              <p className="font-semibold">Synopsis Rejected</p>
              {synopsis.approvals && synopsis.approvals.find(a => a.decision === 'rejected') && (
                <p className="text-sm mt-1">
                  {synopsis.approvals.find(a => a.decision === 'rejected').comments}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (synopsis.is_approved) {
      return (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center text-green-700">
            <svg className="w-8 h-8 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <div>
              <p className="font-semibold">Synopsis Approved!</p>
              <p className="text-sm mt-1">All reviewers have approved your synopsis</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Approval Progress:</p>
        <div className="space-y-3">
          {allStages.map((stage, index) => {
            const stageInfo = getStageInfo(stage);
            const isPast = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isFuture = index > currentStageIndex;

            const approval = synopsis.approvals?.find(a => a.stage === stage);
            const isApproved = approval?.decision === 'approved';

            return (
              <div key={stage} className="flex items-center">
                {/* Stage Icon/Indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isApproved ? 'bg-green-500 text-white' :
                  isCurrent ? `bg-${stageInfo.color}-500 text-white` :
                  isPast ? 'bg-gray-300 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isApproved ? '✓' : stageInfo.icon}
                </div>

                {/* Stage Label */}
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    isCurrent ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {stageInfo.label}
                  </p>
                  {approval && approval.reviewed_at && (
                    <p className="text-xs text-gray-500">
                      {approval.decision === 'approved' ? 'Approved' : 'Reviewed'} on {new Date(approval.reviewed_at).toLocaleDateString()}
                    </p>
                  )}
                  {approval && approval.comments && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{approval.comments}"
                    </p>
                  )}
                </div>

                {/* Status Indicator */}
                {isCurrent && (
                  <div className="ml-2">
                    <span className="inline-flex h-3 w-3 rounded-full bg-blue-500 animate-pulse"></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          Submit Synopsis
        </h3>

        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Synopsis Document
            </label>
            <input
              id="synopsis-file-input"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Accepted formats: PDF, DOC, DOCX (Max size: 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Selected:</span> {selectedFile.name}
                <span className="text-gray-500 ml-2">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className={`btn-primary ${(!selectedFile || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Submit Synopsis'}
          </button>
        </form>

        <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your synopsis will go through the following approval workflow:
            <span className="block mt-1">Supervisor → DC/APC Committee → School Chair → Associate Dean Research → Dean Academics</span>
          </p>
        </div>
      </div>

      {/* Submissions History and Tracking */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Submission History & Tracking</h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : synopses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No synopsis submissions yet</p>
            <p className="text-sm">Upload your first synopsis using the form above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {synopses.map((synopsis) => (
              <div key={synopsis.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Synopsis v{synopsis.version}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(synopsis.submission_date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(synopsis.status)}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <p><strong>File:</strong> {synopsis.file_name}</p>
                  <p><strong>Current Stage:</strong> {getStageInfo(synopsis.current_stage).label}</p>
                </div>

                {renderProgressTracker(synopsis)}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => window.open(`/api/synopsis/${synopsis.id}/download`, '_blank')}
                    className="btn-secondary text-sm"
                  >
                    Download Submitted File
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

export default SynopsisUploadTracker;
