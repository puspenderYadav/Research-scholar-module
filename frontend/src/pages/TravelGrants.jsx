import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import TravelGrantApplicationForm from '../components/TravelGrantApplicationForm';
import TravelGrantApprovalWorkflow from '../components/TravelGrantApprovalWorkflow';
import TravelGrantStatusTracker from '../components/TravelGrantStatusTracker';
import api from '../services/api';

const TravelGrants = () => {
  const { user } = useAuth();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [myGrants, setMyGrants] = useState([]);
  const [selectedGrantId, setSelectedGrantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-applications'); // 'my-applications' or 'pending-approvals'

  useEffect(() => {
    if (user?.role === 'scholar') {
      fetchMyGrants();
    }
  }, [user]);

  const fetchMyGrants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/travel-grants');
      setMyGrants(response.data);
    } catch (error) {
      console.error('Error fetching grants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    fetchMyGrants();
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'submitted': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isApprover = () => {
    return ['supervisor', 'committee_member', 'school_chair', 'ad_research', 'dean_academics'].includes(user?.role);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Travel Grants</h1>
        <p className="text-gray-600 mt-2">Manage your travel grant applications</p>
      </div>

      {/* Scholar View */}
      {user?.role === 'scholar' && (
        <>
          {!showApplicationForm && !selectedGrantId && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Apply for Travel Grant</span>
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">My Applications</h2>
                  </div>

                  {myGrants.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No travel grant applications yet</p>
                      <p className="text-sm mt-2">Click "Apply for Travel Grant" to submit your first application</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {myGrants.map((grant) => (
                        <div key={grant.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">{grant.event_name}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(grant.current_status)}`}>
                                  {grant.current_status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Type:</span> {grant.grant_type}
                                </div>
                                <div>
                                  <span className="font-medium">Venue:</span> {grant.venue_country}
                                </div>
                                <div>
                                  <span className="font-medium">Submitted:</span> {formatDate(grant.created_at)}
                                </div>
                                {grant.anticipated_expenses && (
                                  <div>
                                    <span className="font-medium">Amount:</span> ₹{grant.anticipated_expenses}
                                  </div>
                                )}
                              </div>
                              {grant.presenting_paper && (
                                <div className="mt-2 text-sm text-blue-600">
                                  📄 Presenting {grant.number_of_papers} paper(s)
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedGrantId(grant.id)}
                              className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                              Track Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {showApplicationForm && (
            <TravelGrantApplicationForm
              onSuccess={handleApplicationSuccess}
              onCancel={() => setShowApplicationForm(false)}
            />
          )}

          {selectedGrantId && (
            <div>
              <button
                onClick={() => setSelectedGrantId(null)}
                className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Applications
              </button>
              <TravelGrantStatusTracker grantId={selectedGrantId} />
            </div>
          )}
        </>
      )}

      {/* Approver View (Supervisor, Committee, School Chair, AD Research, Dean) */}
      {isApprover() && (
        <div>
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab('pending-approvals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending-approvals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Approvals
              </button>
            </nav>
          </div>

          {activeTab === 'my-applications' && user?.role !== 'dean_academics' && user?.role !== 'ad_research' && user?.role !== 'school_chair' && (
            <>
              {!showApplicationForm && !selectedGrantId ? (
                <>
                  <div className="mb-6">
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Apply for Travel Grant</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold">My Applications</h2>
                    </div>
                    <div className="px-6 py-8 text-center text-gray-500">
                      <p>Your travel grant applications will appear here</p>
                    </div>
                  </div>
                </>
              ) : showApplicationForm ? (
                <TravelGrantApplicationForm
                  onSuccess={handleApplicationSuccess}
                  onCancel={() => setShowApplicationForm(false)}
                />
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedGrantId(null)}
                    className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Applications
                  </button>
                  <TravelGrantStatusTracker grantId={selectedGrantId} />
                </div>
              )}
            </>
          )}

          {activeTab === 'pending-approvals' && (
            <TravelGrantApprovalWorkflow />
          )}
        </div>
      )}
    </Layout>
  );
};

export default TravelGrants;
