import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { meetingAPI } from '../services/api';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, differenceInDays, isPast, isFuture } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new meeting
  const [formData, setFormData] = useState({
    scholar_id: '',
    meeting_date: '',
    time: '',
    description: ''
  });

  // Scholars list
  const [scholars, setScholars] = useState([]);

  // Scholar comment state
  const [commentingMeetingId, setCommentingMeetingId] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadMeetings();
    if (user?.role === 'supervisor') {
      loadSupervisedScholars();
    }
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await meetingAPI.getAll();
      setMeetings(response.data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisedScholars = async () => {
    try {
      const response = await meetingAPI.getSupervisedScholars();
      setScholars(response.data);
    } catch (error) {
      console.error('Error loading supervised scholars:', error);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedMeeting(null);
    setFormData({
      scholar_id: '',
      meeting_date: '',
      time: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.scholar_id || !formData.meeting_date || !formData.time) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time into ISO format
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.time}`);

      await meetingAPI.create({
        scholar_id: parseInt(formData.scholar_id),
        meeting_date: meetingDateTime.toISOString(),
        description: formData.description
      });

      alert('Meeting scheduled successfully!');
      setShowModal(false);
      loadMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(error.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await meetingAPI.update(meetingId, { status: newStatus });
      alert('Meeting status updated successfully!');
      loadMeetings();
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('Failed to update meeting status');
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await meetingAPI.cancel(meetingId);
      alert('Meeting cancelled successfully!');
      loadMeetings();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      alert('Failed to cancel meeting');
    }
  };

  const handleAddComment = async (meetingId) => {
    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);

    try {
      await meetingAPI.addScholarComment(meetingId, commentText);
      alert('Comment added successfully!');
      setCommentingMeetingId(null);
      setCommentText('');
      loadMeetings();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCommenting = (meeting) => {
    setCommentingMeetingId(meeting.id);
    setCommentText(meeting.scholar_comment || '');
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      missed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeRemaining = (meetingDate) => {
    const now = new Date();
    const meeting = new Date(meetingDate);

    if (isPast(meeting)) {
      return null;
    }

    const days = differenceInDays(meeting, now);
    const hours = differenceInHours(meeting, now) % 24;
    const minutes = differenceInMinutes(meeting, now) % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Filter meetings
  const futureMeetings = meetings.filter(m => isFuture(new Date(m.meeting_date)) && m.status === 'scheduled');
  const pastMeetings = meetings.filter(m => isPast(new Date(m.meeting_date)) || m.status !== 'scheduled').slice(0, 10);

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-iit-darkblue">Meetings</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'supervisor'
              ? 'Manage meetings with your supervised scholars'
              : 'View your scheduled meetings'}
          </p>
        </div>
        {user?.role === 'supervisor' && (
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
          >
            Organize Meeting
          </button>
        )}
      </div>

      {/* Future Meetings */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
          <span className="mr-2">📅</span>
          Upcoming Meetings
        </h2>

        {futureMeetings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
        ) : (
          <div className="space-y-4">
            {futureMeetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {user?.role === 'supervisor'
                          ? `Meeting with ${meeting.scholar?.name || 'Scholar'}`
                          : `Meeting with ${meeting.faculty?.name || 'Faculty'}`}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>

                    {user?.role === 'supervisor' && meeting.scholar && (
                      <p className="text-sm text-gray-600 mb-1">
                        Scholar: {meeting.scholar.enrollment_number}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mb-1">
                      📅 {format(new Date(meeting.meeting_date), 'PPpp')}
                    </p>

                    {meeting.description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {meeting.description}
                      </p>
                    )}

                    {/* Time Remaining */}
                    {meeting.time_remaining && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        <span>⏱️</span>
                        <span>Time remaining: {getTimeRemaining(meeting.meeting_date)}</span>
                      </div>
                    )}

                    {/* Scholar Comment Section */}
                    {user?.role === 'scholar' && (
                      <div className="mt-4 border-t pt-3">
                        {commentingMeetingId === meeting.id ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Comment (e.g., unavailability, request to reschedule, etc.)
                            </label>
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-iit-lightblue"
                              rows="2"
                              placeholder="Enter your comment here..."
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAddComment(meeting.id)}
                                className="px-4 py-2 bg-iit-blue text-white rounded-md hover:bg-iit-darkblue text-sm"
                                disabled={submitting}
                              >
                                {submitting ? 'Saving...' : 'Save Comment'}
                              </button>
                              <button
                                onClick={() => {
                                  setCommentingMeetingId(null);
                                  setCommentText('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                                disabled={submitting}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {meeting.scholar_comment ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Your Comment:</p>
                                    <p className="text-sm text-gray-800">{meeting.scholar_comment}</p>
                                  </div>
                                  <button
                                    onClick={() => handleStartCommenting(meeting)}
                                    className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartCommenting(meeting)}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                <span>💬</span>
                                <span>Add Comment</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show Scholar Comment to Supervisor */}
                    {user?.role === 'supervisor' && meeting.scholar_comment && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Scholar's Comment:</p>
                        <p className="text-sm text-gray-800">{meeting.scholar_comment}</p>
                      </div>
                    )}
                  </div>

                  {user?.role === 'supervisor' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(meeting.id, 'completed')}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="Mark as completed"
                      >
                        ✓ Complete
                      </button>
                      <button
                        onClick={() => handleCancelMeeting(meeting.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Cancel meeting"
                      >
                        ✗ Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
          <span className="mr-2">📋</span>
          Past Meetings
        </h2>

        {pastMeetings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No past meetings</p>
        ) : (
          <div className="space-y-4">
            {pastMeetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {user?.role === 'supervisor'
                          ? `Meeting with ${meeting.scholar?.name || 'Scholar'}`
                          : `Meeting with ${meeting.faculty?.name || 'Faculty'}`}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>

                    {user?.role === 'supervisor' && meeting.scholar && (
                      <p className="text-sm text-gray-600 mb-1">
                        Scholar: {meeting.scholar.enrollment_number}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mb-1">
                      📅 {format(new Date(meeting.meeting_date), 'PPpp')}
                    </p>

                    {meeting.description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {meeting.description}
                      </p>
                    )}

                    {meeting.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded">
                        <p className="text-xs font-semibold text-gray-700">Notes:</p>
                        <p className="text-sm text-gray-700">{meeting.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Organize Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-iit-darkblue mb-4">Organize Meeting</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.scholar_id}
                  onChange={(e) => setFormData({ ...formData, scholar_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-iit-lightblue"
                  required
                >
                  <option value="">Select a scholar</option>
                  {scholars.map((scholar) => (
                    <option key={scholar.id} value={scholar.id}>
                      {scholar.name} ({scholar.enrollment_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-iit-lightblue"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-iit-lightblue"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-iit-lightblue"
                  rows="3"
                  placeholder="Meeting agenda or notes..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Meetings;
