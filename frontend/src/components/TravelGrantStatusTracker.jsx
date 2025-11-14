import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TravelGrantStatusTracker = ({ grantId }) => {
  const [grant, setGrant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrantDetails();
  }, [grantId]);

  const fetchGrantDetails = async () => {
    try {
      const response = await api.get(`/travel-grants/${grantId}`);
      setGrant(response.data);
    } catch (error) {
      console.error('Error fetching grant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApprovalLevels = () => {
    return [
      { level: 'supervisor', name: 'Supervisor' },
      { level: 'dc', name: 'Doctoral Committee' },
      { level: 'school_chair', name: 'School Chair' },
      { level: 'ad_research', name: 'AD Research' },
      { level: 'dean_academics', name: 'Dean Academics' }
    ];
  };

  const getLevelStatus = (level) => {
    if (!grant?.approvals) return 'pending';
    
    const approval = grant.approvals.find(a => a.level === level);
    if (approval) {
      return approval.status;
    }
    
    // Check if we've passed this level
    const levels = getApprovalLevels();
    const currentLevelIndex = levels.findIndex(l => l.level === grant.current_approval_level);
    const thisLevelIndex = levels.findIndex(l => l.level === level);
    
    if (thisLevelIndex < currentLevelIndex) {
      return 'approved'; // Must have been approved to pass
    }
    
    return 'pending';
  };

  const getLevelComment = (level) => {
    if (!grant?.approvals) return '';
    const approval = grant.approvals.find(a => a.level === level);
    return approval?.comment || '';
  };

  const getLevelApprovedBy = (level) => {
    if (!grant?.approvals) return '';
    const approval = grant.approvals.find(a => a.level === level);
    return approval?.approved_by_name || '';
  };

  const getLevelDate = (level) => {
    if (!grant?.approvals) return '';
    const approval = grant.approvals.find(a => a.level === level);
    if (approval?.updated_at) {
      return new Date(approval.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return '';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getOverallStatusBadge = () => {
    if (!grant) return null;
    
    const hasRejection = grant.approvals?.some(a => a.status === 'rejected');
    if (hasRejection) {
      return (
        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
          Rejected
        </span>
      );
    }
    
    if (grant.current_status === 'approved') {
      return (
        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
          Fully Approved
        </span>
      );
    }
    
    return (
      <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
        In Progress
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="text-center py-12 text-gray-500">
        Grant not found
      </div>
    );
  }

  const levels = getApprovalLevels();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{grant.event_name}</h2>
            <p className="text-gray-600 mt-1">{grant.grant_type}</p>
          </div>
          {getOverallStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <div>
            <span className="font-medium">Venue:</span> {grant.venue_country}
          </div>
          <div>
            <span className="font-medium">Organizer:</span> {grant.organizer_name}
          </div>
          <div>
            <span className="font-medium">Submitted:</span>{' '}
            {new Date(grant.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          {grant.anticipated_expenses && (
            <div>
              <span className="font-medium">Anticipated Expenses:</span> ₹{grant.anticipated_expenses}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Approval Progress</h3>

        {levels.map((level, index) => {
          const status = getLevelStatus(level.level);
          const comment = getLevelComment(level.level);
          const approvedBy = getLevelApprovedBy(level.level);
          const date = getLevelDate(level.level);
          const isActive = grant.current_approval_level === level.level;

          return (
            <div key={level.level} className="relative">
              {/* Connecting Line */}
              {index < levels.length - 1 && (
                <div
                  className={`absolute left-5 top-12 w-0.5 h-16 ${
                    status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{ height: '4rem' }}
                />
              )}

              <div className={`flex items-start space-x-4 ${isActive ? 'bg-blue-50 p-4 rounded-lg' : ''}`}>
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(status)}
                </div>

                {/* Level Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">
                      {level.name}
                      {isActive && status === 'pending' && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">(Current Stage)</span>
                      )}
                    </h4>
                    {date && (
                      <span className="text-sm text-gray-500">{date}</span>
                    )}
                  </div>

                  {approvedBy && (
                    <p className="text-sm text-gray-600 mt-1">
                      {status === 'approved' ? 'Approved' : 'Reviewed'} by: {approvedBy}
                    </p>
                  )}

                  {comment && (
                    <div className={`mt-2 p-3 rounded-md ${
                      status === 'rejected' 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {status === 'rejected' ? 'Rejection Reason:' : 'Comment:'}
                      </p>
                      <p className="text-sm text-gray-600">{comment}</p>
                    </div>
                  )}

                  {status === 'pending' && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      {isActive ? 'Awaiting review...' : 'Pending'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Status Message */}
      {grant.current_status === 'approved' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-900">Application Fully Approved!</p>
              <p className="text-sm text-green-700 mt-1">
                Your travel grant application has been approved by all authorities.
              </p>
            </div>
          </div>
        </div>
      )}

      {grant.approvals?.some(a => a.status === 'rejected') && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900">Application Rejected</p>
              <p className="text-sm text-red-700 mt-1">
                Your application has been rejected. Please review the comments above and resubmit if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelGrantStatusTracker;
