import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchApprovals();
    fetchSummary();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/approvals/all');
      setApprovals(response.data.approvals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      alert('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/approvals/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleActionClick = (approval, actionType) => {
    setSelectedApproval(approval);
    setAction(actionType);
    setShowModal(true);
    setComment('');
  };

  const submitAction = async () => {
    if (action === 'reject' && !comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessingAction(true);
    try {
      const endpoint = selectedApproval.approval_endpoint;
      let payload = {};

      // Different approval types expect different payload formats
      if (selectedApproval.type === 'progress_report') {
        payload = {
          action: action === 'approve' ? 'approved' : 'rejected',
          comments: comment
        };
      } else if (selectedApproval.type === 'synopsis' || selectedApproval.type === 'thesis') {
        payload = {
          action: action === 'approve' ? 'approved' : 'rejected',
          comments: comment
        };
      } else if (selectedApproval.type === 'leave') {
        payload = {
          decision: action === 'approve' ? 'approved' : 'rejected',
          feedback: comment
        };
      } else {
        // Default for travel_grant, comprehensive_exam, supervisor_change
        payload = {
          decision: action === 'approve' ? 'approved' : 'rejected',
          comments: comment
        };
      }

      await api.post(endpoint, payload);

      alert(`${selectedApproval.type_label} ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowModal(false);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
      fetchSummary();
    } catch (error) {
      console.error('Error processing action:', error);
      alert(error.response?.data?.error || 'Failed to process action. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'travel_grant': 'bg-blue-100 text-blue-800',
      'progress_report': 'bg-purple-100 text-purple-800',
      'synopsis': 'bg-green-100 text-green-800',
      'thesis': 'bg-red-100 text-red-800',
      'leave': 'bg-yellow-100 text-yellow-800',
      'comprehensive_exam': 'bg-indigo-100 text-indigo-800',
      'supervisor_change': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredApprovals = filterType === 'all'
    ? approvals
    : approvals.filter(a => a.type === filterType);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Approval Center</h1>
        <p className="text-gray-600 mt-2">Review and approve pending requests</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          {summary.travel_grants > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.travel_grants}</div>
              <div className="text-xs text-gray-600">Travel Grants</div>
            </div>
          )}
          {summary.progress_reports > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{summary.progress_reports}</div>
              <div className="text-xs text-gray-600">Progress Reports</div>
            </div>
          )}
          {summary.synopsis > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{summary.synopsis}</div>
              <div className="text-xs text-gray-600">Synopsis</div>
            </div>
          )}
          {summary.thesis > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{summary.thesis}</div>
              <div className="text-xs text-gray-600">Thesis</div>
            </div>
          )}
          {summary.leaves > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">{summary.leaves}</div>
              <div className="text-xs text-gray-600">Leaves</div>
            </div>
          )}
          {summary.comprehensive_exams > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-indigo-600">{summary.comprehensive_exams}</div>
              <div className="text-xs text-gray-600">Comp. Exams</div>
            </div>
          )}
          {summary.supervisor_changes > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-pink-600">{summary.supervisor_changes}</div>
              <div className="text-xs text-gray-600">Supervisor Changes</div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              filterType === 'all'
                ? 'border-purple-900 text-purple-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All ({approvals.length})
          </button>
          {summary && Object.entries(summary).filter(([key, value]) => key !== 'total' && value > 0).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                filterType === key
                  ? 'border-purple-900 text-purple-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} ({value})
            </button>
          ))}
        </nav>
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All caught up! You have no pending requests to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div key={`${approval.type}-${approval.id}`} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(approval.type)}`}>
                        {approval.type_label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(approval.status)}`}>
                        {approval.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(approval.submitted_date)}
                      </span>
                    </div>

                    {/* Title and Scholar Info */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{approval.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {approval.scholar_name}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>{approval.scholar_enrollment}</span>
                    </div>

                    {/* Your Role */}
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Your Role: {approval.my_role} - {approval.stage_info}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Request Details:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {Object.entries(approval.details).map(([key, value]) => {
                          if (value === null || value === undefined || value === '') return null;
                          return (
                            <div key={key}>
                              <span className="font-medium">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:</span> {value}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleActionClick(approval, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleActionClick(approval, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {action === 'approve' ? 'Approve' : 'Reject'} {selectedApproval.type_label}
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Request:</strong> {selectedApproval.title}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Scholar:</strong> {selectedApproval.scholar_name} ({selectedApproval.scholar_enrollment})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Your Role:</strong> {selectedApproval.my_role}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={action === 'approve' ? 'Optional comments...' : 'Please provide a reason for rejection...'}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={processingAction}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  disabled={processingAction}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingAction ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Approvals;
