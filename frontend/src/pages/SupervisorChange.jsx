import { useState, useEffect } from 'react';
import SupervisorChangeRequestForm from '../components/SupervisorChangeRequestForm';
import api from '../services/api';

export default function SupervisorChange() {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      const response = await api.get('/supervisor-change/my-requests');
      setMyRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmitted = () => {
    setShowForm(false);
    loadMyRequests();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getApprovalLevelStatus = (request) => {
    const levels = [
      {
        name: 'Current Supervisor',
        status: request.current_supervisor_status,
        person: request.current_supervisor?.name,
        comment: request.current_supervisor_comment,
        date: request.current_supervisor_date
      },
      {
        name: 'New Supervisor',
        status: request.new_supervisor_status,
        person: request.new_supervisor?.name,
        comment: request.new_supervisor_comment,
        date: request.new_supervisor_date
      },
      {
        name: 'Dean Academics',
        status: request.dean_status,
        comment: request.dean_comment,
        date: request.dean_date
      }
    ];
    return levels;
  };

  // Check if scholar can submit a new request
  const canSubmitNewRequest = myRequests.every(req => req.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Supervisor Change Requests</h1>
        <p className="text-gray-600 mt-2">
          Request to change your research supervisor with approval from both supervisors and Dean
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        {canSubmitNewRequest ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            {showForm ? 'Hide Form' : '+ New Supervisor Change Request'}
          </button>
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800">
              You have a pending supervisor change request. Please wait for it to be processed before submitting a new request.
            </p>
          </div>
        )}
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="mb-8">
          <SupervisorChangeRequestForm onRequestSubmitted={handleRequestSubmitted} />
        </div>
      )}

      {/* My Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">My Requests History</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your requests...</div>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              You haven't submitted any supervisor change requests yet.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {myRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Request Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {request.current_supervisor?.name} → {request.new_supervisor?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Reason for Change:</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{request.reason}</p>
                </div>

                {/* Approval Timeline */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Approval Progress:</h4>
                  <div className="space-y-3">
                    {getApprovalLevelStatus(request).map((level, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {level.status === 'approved' && (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {level.status === 'rejected' && (
                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {level.status === 'pending' && (
                            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{level.name}</p>
                              {level.person && (
                                <p className="text-sm text-gray-600">{level.person}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(level.status)}`}>
                              {level.status}
                            </span>
                          </div>
                          {level.comment && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              Comment: {level.comment}
                            </p>
                          )}
                          {level.date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(level.date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                {request.status === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                      {request.current_supervisor_status === 'pending' && request.new_supervisor_status === 'pending' && (
                        '⏳ Waiting for both supervisors to approve'
                      )}
                      {request.current_supervisor_status === 'approved' && request.new_supervisor_status === 'pending' && (
                        '⏳ Current supervisor approved. Waiting for new supervisor approval.'
                      )}
                      {request.current_supervisor_status === 'pending' && request.new_supervisor_status === 'approved' && (
                        '⏳ New supervisor approved. Waiting for current supervisor approval.'
                      )}
                      {request.current_supervisor_status === 'approved' && request.new_supervisor_status === 'approved' && request.dean_status === 'pending' && (
                        '⏳ Both supervisors approved. Waiting for Dean approval.'
                      )}
                    </p>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Your supervisor has been successfully changed to {request.new_supervisor?.name}
                    </p>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800 font-medium">
                      ❌ Your request was rejected
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
