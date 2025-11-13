import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const CommitteeApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState({
    travel_grants: [],
    progress_reports: [],
    synopsis: [],
    thesis: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      // Fetch all pending approvals in parallel
      const [travelGrantsRes, progressReportsRes, synopsisRes, thesisRes] = await Promise.all([
        api.get('/travel-grants/pending').catch(() => ({ data: [] })),
        api.get('/progress-reports/pending-reviews').catch(() => ({ data: [] })),
        api.get('/synopsis/pending-reviews').catch(() => ({ data: [] })),
        api.get('/thesis/pending-reviews').catch(() => ({ data: [] }))
      ]);

      setPendingApprovals({
        travel_grants: travelGrantsRes.data || [],
        progress_reports: progressReportsRes.data || [],
        synopsis: synopsisRes.data || [],
        thesis: thesisRes.data || []
      });
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalPendingCount = () => {
    return (
      pendingApprovals.travel_grants.length +
      pendingApprovals.progress_reports.length +
      pendingApprovals.synopsis.length +
      pendingApprovals.thesis.length
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Travel Grants */}
      {pendingApprovals.travel_grants.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Travel Grants</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pending DC approval ({pendingApprovals.travel_grants.length})
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingApprovals.travel_grants.map((grant) => (
              <div key={grant.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{grant.event_name}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Scholar:</span> {grant.scholar_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Venue:</span> {grant.venue_country}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {grant.grant_type}
                      </p>
                      {grant.anticipated_expenses && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Amount:</span> ₹{grant.anticipated_expenses}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => navigate('/travel-grants')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Reports */}
      {pendingApprovals.progress_reports.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Progress Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pending committee review ({pendingApprovals.progress_reports.length})
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingApprovals.progress_reports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Progress Report</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Scholar:</span> {report.scholar_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {formatDate(report.submission_date)}
                      </p>
                      {report.period_start && report.period_end && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Period:</span> {report.period_start} to {report.period_end}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => navigate('/progress-reports')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synopsis */}
      {pendingApprovals.synopsis.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Synopsis Submissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pending DC review ({pendingApprovals.synopsis.length})
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingApprovals.synopsis.map((syn) => (
              <div key={syn.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{syn.title}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Scholar:</span> {syn.scholar_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {formatDate(syn.submission_date)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => navigate('/synopsis')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thesis */}
      {pendingApprovals.thesis.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Thesis Submissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pending DC review ({pendingApprovals.thesis.length})
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingApprovals.thesis.map((thes) => (
              <div key={thes.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{thes.title}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Scholar:</span> {thes.scholar_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {formatDate(thes.submission_date)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <button
                      onClick={() => navigate('/thesis')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Approvals Message */}
      {getTotalPendingCount() === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No pending approvals at this time</p>
          <p className="text-sm text-gray-400 mt-2">All items have been reviewed</p>
        </div>
      )}
    </div>
  );
};

export default CommitteeApprovals;
