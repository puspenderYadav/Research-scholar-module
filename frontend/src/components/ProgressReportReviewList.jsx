import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ProgressReportReviewList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      const response = await api.get('/progress-reports/pending-reviews');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId, fileName) => {
    try {
      const response = await api.get(`/progress-reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handleReview = async (reportId, action) => {
    const actionLabels = {
      approve: 'approve',
      changes_requested: 'request changes for',
      reject: 'reject'
    };

    const comments = prompt(
      action === 'approve'
        ? 'Optional: Add comments for approval'
        : `Please provide detailed ${action === 'reject' ? 'reason for rejection' : 'feedback for changes'} (required):`
    );

    if (action !== 'approve' && !comments) {
      alert('Comments are required for this action');
      return;
    }

    if (action === 'reject') {
      const confirmReject = window.confirm(
        'Are you sure you want to REJECT this progress report? This action will cancel the entire submission.'
      );
      if (!confirmReject) return;
    }

    setProcessingId(reportId);
    try {
      await api.post(`/progress-reports/${reportId}/approve`, {
        action,
        comments: comments || ''
      });

      alert(`Progress report ${actionLabels[action]}d successfully!`);
      loadPendingReviews();
    } catch (error) {
      console.error('Error processing review:', error);
      alert(error.response?.data?.error || 'Failed to process review');
    } finally {
      setProcessingId(null);
    }
  };

  const getApprovalSummary = (report) => {
    if (!report.approvals || report.approvals.length === 0) {
      return { approved: 0, total: 0, pending: 0 };
    }

    const approved = report.approvals.filter(a => a.status === 'approved').length;
    const total = report.approvals.length;
    const pending = report.approvals.filter(a => a.status === 'pending').length;

    return { approved, total, pending };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending reviews...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No progress reports pending your review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Progress Reports Pending Review</h2>
      
      {reports.map((report) => {
        const summary = getApprovalSummary(report);
        
        return (
          <div key={report.id} className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Progress Report Review Required
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on {new Date(report.submission_date).toLocaleDateString()}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                PENDING YOUR REVIEW
              </span>
            </div>

            {/* Scholar Info */}
            <div className="mb-4 bg-violet-50 rounded p-4">
              <h4 className="font-semibold text-violet-900 mb-2">Scholar Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Name:</span> {report.scholar?.name}</p>
                <p><span className="font-medium">Enrollment:</span> {report.scholar?.enrollment_number}</p>
                <p><span className="font-medium">Program:</span> {report.scholar?.program}</p>
                <p><span className="font-medium">Research Area:</span> {report.scholar?.research_area}</p>
              </div>
            </div>

            {/* Report Period */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Report Period</h4>
              <p className="text-sm text-gray-700">
                {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
              </p>
            </div>

            {/* File Download */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded border border-gray-200">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{report.file_name}</p>
                    <p className="text-xs text-gray-500">Click to download and review</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report.id, report.file_name)}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 font-medium"
                >
                  Download Report
                </button>
              </div>
            </div>

            {/* Your Role */}
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Your Role:</span>{' '}
                <span className="capitalize">{report.my_approval_role?.replace('_', ' ')}</span>
              </p>
            </div>

            {/* Other Reviewers Status */}
            {report.approvals && report.approvals.length > 1 && (
              <div className="mb-4 border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Other Reviewers</h4>
                <div className="space-y-2">
                  {report.approvals
                    .filter(a => a.id !== report.my_approval_id)
                    .map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{approval.reviewer?.name}</span>
                          <span className="text-gray-500 ml-2 capitalize">
                            ({approval.reviewer_role?.replace('_', ' ')})
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                          approval.status === 'changes_requested' ? 'bg-orange-100 text-orange-800' :
                          approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {approval.status === 'pending' ? 'Pending' :
                           approval.status === 'approved' ? 'Approved' :
                           approval.status === 'changes_requested' ? 'Changes Requested' :
                           'Rejected'}
                        </span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {summary.approved} of {summary.total} reviewers have approved
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Your Review Decision</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleReview(report.id, 'approve')}
                  disabled={processingId === report.id}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Approve
                </button>

                <button
                  onClick={() => handleReview(report.id, 'changes_requested')}
                  disabled={processingId === report.id}
                  className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Request Changes
                </button>

                <button
                  onClick={() => handleReview(report.id, 'reject')}
                  disabled={processingId === report.id}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Reject
                </button>
              </div>

              <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-700">
                  <strong>Approve:</strong> You accept the report as submitted<br/>
                  <strong>Request Changes:</strong> Scholar must revise and resubmit<br/>
                  <strong>Reject:</strong> Report is rejected - scholar must submit a new report
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
