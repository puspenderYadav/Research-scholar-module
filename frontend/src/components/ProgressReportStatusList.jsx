import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ProgressReportStatusList({ scholarId, refreshTrigger }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scholarId) {
      loadReports();
    }
  }, [scholarId, refreshTrigger]);

  const loadReports = async () => {
    try {
      const response = await api.get(`/progress-reports/scholar/${scholarId}`);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading progress reports:', error);
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

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      under_review: 'bg-violet-100 text-violet-800 border-violet-300',
      changes_requested: 'bg-orange-100 text-orange-800 border-orange-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (status === 'rejected') {
      return (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (status === 'changes_requested') {
      return (
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-violet-400 flex items-center justify-center">
          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
  };

  const getApprovalSummary = (report) => {
    if (!report.approvals || report.approvals.length === 0) {
      return 'No reviewers assigned';
    }

    const approved = report.approvals.filter(a => a.status === 'approved').length;
    const total = report.approvals.length;
    const pending = report.approvals.filter(a => a.status === 'pending').length;
    const changesRequested = report.approvals.filter(a => a.status === 'changes_requested').length;
    const rejected = report.approvals.filter(a => a.status === 'rejected').length;

    return {
      approved,
      total,
      pending,
      changesRequested,
      rejected
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading your progress reports...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No progress reports submitted yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Progress Reports</h2>
      
      {reports.map((report) => {
        const summary = getApprovalSummary(report);
        
        return (
          <div key={report.id} className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Progress Report - {new Date(report.submission_date).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-600">
                  Period: {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(report.status)}`}>
                {report.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* File Info */}
            <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{report.file_name}</span>
              </div>
              <button
                onClick={() => downloadReport(report.id, report.file_name)}
                className="text-violet-600 hover:text-violet-800 text-sm font-medium"
              >
                Download
              </button>
            </div>

            {/* Approval Progress */}
            {report.approvals && report.approvals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Review Progress</h4>
                  <span className="text-sm text-gray-600">
                    {summary.approved} of {summary.total} approved
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(summary.approved / summary.total) * 100}%` }}
                  ></div>
                </div>

                {/* Reviewers List */}
                <div className="space-y-3">
                  {report.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-start border-l-4 border-gray-300 pl-4">
                      <div className="flex-shrink-0 mr-3">
                        {getStatusIcon(approval.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {approval.reviewer?.name || 'Reviewer'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {approval.reviewer_role.replace('_', ' ')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(approval.status)}`}>
                            {approval.status === 'pending' ? 'Pending' :
                             approval.status === 'approved' ? 'Approved' :
                             approval.status === 'changes_requested' ? 'Changes Requested' :
                             'Rejected'}
                          </span>
                        </div>
                        {approval.comments && (
                          <p className="text-sm text-gray-700 mt-2 italic bg-gray-50 p-2 rounded">
                            "{approval.comments}"
                          </p>
                        )}
                        {approval.reviewed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(approval.reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Message */}
            {report.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800 font-medium flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Progress report officially submitted - approved by all reviewers!
                </p>
              </div>
            )}

            {report.status === 'changes_requested' && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm text-orange-800 font-medium">
                  Changes requested - please review the feedback and resubmit
                </p>
              </div>
            )}

            {report.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800 font-medium">
                  Report rejected - please review feedback and submit a new report
                </p>
              </div>
            )}

            {report.status === 'pending_review' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⏳ Waiting for all reviewers to start the review process
                </p>
              </div>
            )}

            {report.status === 'under_review' && summary.pending > 0 && (
              <div className="bg-violet-50 border border-violet-200 rounded p-3">
                <p className="text-sm text-violet-800">
                  🔍 Under review - waiting for {summary.pending} more reviewer(s) to complete their review
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
