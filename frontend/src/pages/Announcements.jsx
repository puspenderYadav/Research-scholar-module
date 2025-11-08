import React, { useState, useEffect } from 'react';
import { deanAPI, researchOfficeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Select the appropriate API based on user role
  const api = user?.role === 'ad_research' ? researchOfficeAPI : deanAPI;

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.getAnnouncements();
      setAnnouncements(response.data.announcements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await api.deleteAnnouncement(id);
      alert('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete announcement');
    }
  };

  const handlePublishAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to publish this announcement now?')) {
      return;
    }

    try {
      await api.publishAnnouncement(id);
      alert('Announcement published successfully');
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish announcement');
    }
  };

  const scheduledAnnouncements = announcements?.filter(a => !a.is_published) || [];
  const publishedAnnouncements = announcements?.filter(a => a.is_published) || [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {showCreateForm ? (
          <CreateAnnouncementForm
            api={api}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchAnnouncements();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                <p className="text-gray-600 mt-2">Manage and schedule institutional announcements</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create New Announcement
              </button>
            </div>

            {/* Scheduled Announcements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Scheduled Announcements ({scheduledAnnouncements.length})
              </h3>
              {scheduledAnnouncements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No scheduled announcements</p>
              ) : (
                <div className="space-y-4">
                  {scheduledAnnouncements.map(announcement => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{announcement.title}</h4>
                          <p className="text-gray-700 mt-2">{announcement.message}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <span className="font-semibold mr-1">Created by:</span>
                              <span className="text-primary-600">{announcement.created_by_display}</span>
                            </span>
                            <span className="flex items-center">
                              <span className="font-semibold mr-1">Scheduled:</span>
                              {new Date(announcement.scheduled_time).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <span className="font-semibold mr-1">Target:</span>
                              {announcement.target_audience.join(', ')}
                            </span>
                            {announcement.attachment_filename && (
                              <span className="flex items-center">
                                <span className="font-semibold mr-1">Attachment:</span>
                                {announcement.attachment_filename}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handlePublishAnnouncement(announcement.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            Publish Now
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published Announcements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Published Announcements ({publishedAnnouncements.length})
              </h3>
              {publishedAnnouncements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No published announcements</p>
              ) : (
                <div className="space-y-4">
                  {publishedAnnouncements.map(announcement => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 text-lg">{announcement.title}</h4>
                      <p className="text-gray-700 mt-2">{announcement.message}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="font-semibold mr-1">Created by:</span>
                          <span className="text-primary-600">{announcement.created_by_display}</span>
                        </span>
                        <span className="flex items-center">
                          <span className="font-semibold mr-1">Published:</span>
                          {new Date(announcement.published_at).toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <span className="font-semibold mr-1">Target:</span>
                          {announcement.target_audience.join(', ')}
                        </span>
                        {announcement.attachment_filename && (
                          <span className="flex items-center">
                            <span className="font-semibold mr-1">Attachment:</span>
                            {announcement.attachment_filename}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

// Create Announcement Form Component
const CreateAnnouncementForm = ({ onSuccess, onCancel, api }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_audience: [],
    scheduled_time: '',
    attachment: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('message', formData.message);
      submitData.append('target_audience', JSON.stringify(formData.target_audience));
      submitData.append('scheduled_time', formData.scheduled_time);

      if (formData.attachment) {
        submitData.append('attachment', formData.attachment);
      }

      await api.createAnnouncement(submitData);
      alert('Announcement created successfully');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleTargetAudienceChange = (role) => {
    setFormData(prev => {
      const newAudience = prev.target_audience.includes(role)
        ? prev.target_audience.filter(r => r !== role)
        : [...prev.target_audience, role];
      return { ...prev, target_audience: newAudience };
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Announcement</h1>
          <p className="text-gray-600 mt-2">Schedule a new announcement for the institution</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="input-field"
              rows="6"
              placeholder="Announcement message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              {['all', 'scholar', 'supervisor', 'school_chair', 'ad_research'].map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.target_audience.includes(role)}
                    onChange={() => handleTargetAudienceChange(role)}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm capitalize">
                    {role === 'all' ? 'All Users' :
                     role === 'ad_research' ? 'Research Office' :
                     role.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
            {formData.target_audience.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Please select at least one target audience</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="input-field"
            />
            <p className="mt-1 text-sm text-gray-500">
              When should this announcement be published? Leave blank for immediate publishing.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="input-field"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            {formData.attachment && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {formData.attachment.name}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Allowed: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || formData.target_audience.length === 0}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Announcements;
