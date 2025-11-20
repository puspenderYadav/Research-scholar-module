import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ProgressReportSubmissionForm from '../components/ProgressReportSubmissionForm';
import ProgressReportStatusList from '../components/ProgressReportStatusList';
import ProgressReportReviewList from '../components/ProgressReportReviewList';

const ProgressReports = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const handleReportSubmitted = () => {
    setShowSubmitForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  // Determine what to show based on user role
  const isScholar = user?.role === 'scholar';
  const isReviewer = user?.role === 'supervisor' || user?.role === 'dc_member' || user?.role === 'adc_member' || user?.role === 'school_chair' || user?.role === 'ad_research' || user?.role === 'dean_academics';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-900">Progress Reports</h1>
          <p className="text-gray-600 mt-2">
            {isScholar 
              ? 'Submit and track your progress reports' 
              : 'Review progress reports from scholars'}
          </p>
        </div>

        {/* Scholar View */}
        {isScholar && (
          <>
            {/* Submit Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                {showSubmitForm ? 'Hide Form' : '+ Submit New Progress Report'}
              </button>
            </div>

            {/* Submission Form */}
            {showSubmitForm && (
              <div className="mb-8">
                <ProgressReportSubmissionForm onReportSubmitted={handleReportSubmitted} />
              </div>
            )}

            {/* Status List */}
            <ProgressReportStatusList 
              scholarId={user?.scholar_profile?.id} 
              refreshTrigger={refreshTrigger}
            />
          </>
        )}

        {/* Reviewer View (Supervisor or Committee Member) */}
        {isReviewer && (
          <ProgressReportReviewList />
        )}

        {/* Other roles */}
        {!isScholar && !isReviewer && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center">
              Progress reports are only accessible to scholars, supervisors, and committee members.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProgressReports;
