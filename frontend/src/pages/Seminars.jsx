import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Seminars = () => {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [seminarStats, setSeminarStats] = useState(null);
  const [supervisorScholars, setSupervisorScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    seminar_type: 'open_seminar_1',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    venue: '',
    online_link: '',
    abstract: ''
  });

  useEffect(() => {
    fetchSeminars();
  }, [user]);

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user.role === 'supervisor') {
        // Fetch all supervised scholars' seminars
        const response = await api.get('/seminars/supervisor/scholars');
        setSupervisorScholars(response.data);
      } else if (user.role === 'scholar') {
        // Fetch own seminars with stats
        const response = await api.get(`/seminars/scholar/${user.scholar_id}`);
        setSeminars(response.data.seminars || []);
        setSeminarStats({
          required: response.data.required_seminars,
          completed: response.data.completed_seminars,
          remaining: response.data.remaining_seminars
        });
      }
    } catch (err) {
      console.error('Error fetching seminars:', err);
      setError(err.response?.data?.error || 'Failed to load seminars');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    
    if (!selectedScholar) {
      setError('Please select a scholar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;

      await api.post('/seminars/schedule', {
        scholar_id: selectedScholar.id,
        title: formData.title,
        seminar_type: formData.seminar_type,
        scheduled_date: scheduledDateTime,
        duration_minutes: parseInt(formData.duration_minutes),
        venue: formData.venue,
        online_link: formData.online_link,
        abstract: formData.abstract
      });

      setShowScheduleModal(false);
      setFormData({
        title: '',
        seminar_type: 'open_seminar_1',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        venue: '',
        online_link: '',
        abstract: ''
      });
      setSelectedScholar(null);
      
      fetchSeminars();
      alert('Seminar scheduled successfully! Scholar has been notified.');
    } catch (err) {
      console.error('Error scheduling seminar:', err);
      setError(err.response?.data?.error || 'Failed to schedule seminar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-violet-100 text-violet-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !supervisorScholars.length && !seminars.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading seminars...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900">Seminars</h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'scholar' 
            ? 'Track your seminar requirements and scheduled presentations'
            : 'Schedule and manage seminars for your scholars'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Scholar View */}
      {user.role === 'scholar' && seminarStats && (
        <>
          {/* Requirements Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <div className="text-sm text-violet-600 font-medium">Required Seminars</div>
              <div className="text-2xl font-bold text-violet-900 mt-1">{seminarStats.required}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{seminarStats.completed}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">Remaining</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">{seminarStats.remaining}</div>
            </div>
          </div>

          {/* Seminars List */}
          <div className="card">
            <div className="bg-purple-100 px-6 py-2 -mx-6 -mt-6 mb-6 rounded-t-lg">
              <h2 className="text-lg font-semibold text-purple-900">My Seminars</h2>
            </div>
            {seminars.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No seminars scheduled yet. Your supervisor will schedule your seminars.</p>
            ) : (
              <div className="space-y-4">
                {seminars.map((seminar) => (
                  <div key={seminar.id} className="border border-gray-200 rounded-lg p-4 hover:border-violet-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{seminar.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(seminar.status)}`}>
                            {seminar.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Date:</span> {formatDateTime(seminar.scheduled_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Venue:</span> {seminar.venue || 'TBD'}
                          </div>
                          {seminar.duration_minutes && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Duration:</span> {seminar.duration_minutes} minutes
                            </div>
                          )}
                          {seminar.online_link && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <a href={seminar.online_link} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                                Join Online
                              </a>
                            </div>
                          )}
                        </div>
                        {seminar.abstract && (
                          <div className="mt-3 text-sm text-gray-700">
                            <span className="font-medium">Abstract:</span>
                            <p className="mt-1">{seminar.abstract}</p>
                          </div>
                        )}
                        {seminar.feedback && (
                          <div className="mt-3 text-sm bg-gray-50 p-3 rounded">
                            <span className="font-medium text-gray-700">Feedback:</span>
                            <p className="mt-1 text-gray-600">{seminar.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Supervisor View */}
      {user.role === 'supervisor' && (
        <>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium mb-6 inline-flex items-center whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Seminar
          </button>

          <div className="space-y-6">
            {supervisorScholars.length === 0 ? (
              <div className="card">
                <p className="text-gray-500 text-center py-8">No scholars assigned yet.</p>
              </div>
            ) : (
              supervisorScholars.map((scholarData) => (
                <div key={scholarData.scholar.id} className="card bg-violet-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{scholarData.scholar.name}</h2>
                      <p className="text-sm text-gray-600">
                        {scholarData.scholar.enrollment_number} • {scholarData.scholar.program}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{scholarData.completed_seminars}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{scholarData.remaining_seminars}</div>
                        <div className="text-xs text-gray-600">Remaining</div>
                      </div>
                    </div>
                  </div>

                  {scholarData.seminars.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No seminars scheduled for this scholar.</p>
                  ) : (
                    <div className="space-y-3">
                      {scholarData.seminars.map((seminar) => (
                        <div key={seminar.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-800">{seminar.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(seminar.status)}`}>
                                  {seminar.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatDateTime(seminar.scheduled_date)} • {seminar.venue}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedScholar(scholarData.scholar);
                                // Could open edit modal here
                              }}
                              className="text-violet-600 hover:text-violet-800 text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {scholarData.remaining_seminars > 0 && (
                    <button
                      onClick={() => {
                        setSelectedScholar(scholarData.scholar);
                        setShowScheduleModal(true);
                      }}
                      className="mt-3 text-violet-600 hover:text-violet-800 text-sm font-medium"
                    >
                      + Schedule Seminar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Schedule Seminar Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Schedule Seminar</h2>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedScholar(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSchedule} className="space-y-4">
                {/* Scholar Selection */}
                {!selectedScholar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Scholar</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                      onChange={(e) => {
                        const scholar = supervisorScholars.find(s => s.scholar.id === parseInt(e.target.value))?.scholar;
                        setSelectedScholar(scholar);
                      }}
                      required
                    >
                      <option value="">Choose a scholar...</option>
                      {supervisorScholars.map((scholarData) => (
                        <option key={scholarData.scholar.id} value={scholarData.scholar.id}>
                          {scholarData.scholar.name} ({scholarData.scholar.enrollment_number}) - {scholarData.remaining_seminars} remaining
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedScholar && (
                  <div className="bg-violet-50 border border-violet-200 rounded p-3">
                    <div className="text-sm font-medium text-violet-900">{selectedScholar.name}</div>
                    <div className="text-xs text-violet-700">{selectedScholar.enrollment_number}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seminar Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seminar Type *</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    value={formData.seminar_type}
                    onChange={(e) => setFormData({ ...formData, seminar_type: e.target.value })}
                    required
                  >
                    <option value="open_seminar_1">Open Seminar 1</option>
                    <option value="open_seminar_2">Open Seminar 2</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    min="30"
                    max="180"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Online Meeting Link (optional)</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    value={formData.online_link}
                    onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Abstract (optional)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                    rows="4"
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex-1"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Seminar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedScholar(null);
                      setError(null);
                    }}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium flex-1"
                  >
                    Cancel
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

export default Seminars;
