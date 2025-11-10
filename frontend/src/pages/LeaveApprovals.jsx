import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { leaveAPI } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const LeaveApprovals = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await leaveAPI.getPending();
      setLeaves(response.data);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
    setDecision('');
    setFeedback('');
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();

    if (decision === 'rejected' && !feedback) {
      alert('Feedback is required for rejection');
      return;
    }

    setSubmitting(true);

    try {
      await leaveAPI.approve(selectedLeave.id, {
        decision,
        feedback
      });

      alert(`Leave application ${decision} successfully!`);
      setShowModal(false);
      setSelectedLeave(null);
      loadLeaves();
    } catch (error) {
      console.error('Error submitting decision:', error);
      alert(error.response?.data?.error || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      personal: 'Personal Leave',
      medical: 'Medical Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave'
    };
    return labels[type] || type;
  };

  if (loading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-iit-darkblue">Leave Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve leave applications from scholars</p>
      </div>

      {/* Pending Leaves */}
      <div className="card">
        <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
          <span className="mr-2">⏳</span>
          Pending Approvals
        </h2>

        {leaves.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No pending leave approvals</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-iit-lightblue">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Scholar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{leave.scholar?.name}</div>
                        <div className="text-sm text-gray-500">{leave.scholar?.enrollment_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{getLeaveTypeLabel(leave.leave_type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {leave.total_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(leave.submission_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleReview(leave)}
                        className="px-4 py-2 bg-iit-blue text-white rounded-lg hover:bg-iit-darkblue transition text-sm font-semibold"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-iit-darkblue">Review Leave Application</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Leave Details */}
              <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Scholar Name</p>
                    <p className="text-gray-900">{selectedLeave.scholar?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Enrollment Number</p>
                    <p className="text-gray-900">{selectedLeave.scholar?.enrollment_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Leave Type</p>
                    <p className="text-gray-900">{getLeaveTypeLabel(selectedLeave.leave_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Total Days</p>
                    <p className="text-gray-900 font-semibold">{selectedLeave.total_days} days</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Start Date</p>
                    <p className="text-gray-900">{format(new Date(selectedLeave.start_date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">End Date</p>
                    <p className="text-gray-900">{format(new Date(selectedLeave.end_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Reason for Leave</p>
                  <p className="text-gray-900 bg-white p-3 rounded border border-gray-200">{selectedLeave.reason}</p>
                </div>

                {selectedLeave.supporting_document && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Supporting Document</p>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/leaves/${selectedLeave.supporting_document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iit-blue hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Submitted On</p>
                  <p className="text-gray-900">{format(new Date(selectedLeave.submission_date), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {/* Approval History */}
              {selectedLeave.approvals && selectedLeave.approvals.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Approval History</h3>
                  <div className="space-y-2">
                    {selectedLeave.approvals.map((approval, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{approval.approval_stage}</p>
                            <p className="text-sm text-gray-600">{approval.approver_name}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            approval.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {approval.decision.toUpperCase()}
                          </span>
                        </div>
                        {approval.feedback && (
                          <p className="text-sm text-gray-700 mt-2">{approval.feedback}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(approval.approval_date), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Form */}
              <form onSubmit={handleSubmitDecision} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Decision <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setDecision('approved')}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                        decision === 'approved'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('rejected')}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                        decision === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {decision === 'rejected' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Feedback <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-iit-blue focus:border-iit-blue"
                      placeholder="Provide feedback for rejection..."
                      required={decision === 'rejected'}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!decision || submitting}
                    className="px-6 py-2 bg-iit-blue text-white rounded-lg hover:bg-iit-darkblue transition font-semibold disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveApprovals;
