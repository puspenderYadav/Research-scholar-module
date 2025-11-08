import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { scholarAPI } from '../services/api';

const ScholarProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await scholarAPI.getMyProfile();
      setProfile(response.data);
      setFormData({
        research_area: response.data.research_area || '',
        thesis_title: response.data.thesis_title || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      research_area: profile.research_area || '',
      thesis_title: profile.thesis_title || ''
    });
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await scholarAPI.update(profile.id, formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (!profile && !loading) {
    return (
      <Layout>
        <div className="card">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Profile Not Found</h3>
          {error && (
            <p className="text-red-600 mb-4">Error: {error}</p>
          )}
          <p className="text-gray-600 mb-4">
            Your scholar profile could not be loaded. This could be because:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
            <li>The database hasn't been seeded with test data</li>
            <li>You're logged in with an account that doesn't have a scholar profile</li>
            <li>There's a connection issue with the backend</li>
          </ul>
          <p className="text-sm text-gray-500">
            Please check the browser console for more details, or contact the administrator.
          </p>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'badge-success',
      on_leave: 'badge-warning',
      completed: 'badge-primary',
      withdrawn: 'badge-danger'
    };
    return statusColors[status] || 'badge-secondary';
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your academic profile</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl mr-4">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.user?.name}</h2>
              <p className="text-gray-600">{profile.user?.email}</p>
              <span className={`badge ${getStatusBadge(profile.status)} mt-2`}>
                {profile.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              onClick={handleEdit}
              className="btn-primary"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Enrollment Number</label>
            <p className="text-lg font-semibold text-gray-800">{profile.enrollment_number}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Program Type</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile.program === 'PhD' ? 'Ph.D.' : 'M.Sc. (Research)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Department / School</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile.school?.name || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Date of Admission</label>
            <p className="text-lg font-semibold text-gray-800">
              {formatDate(profile.admission_date)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Expected Completion</label>
            <p className="text-lg font-semibold text-gray-800">
              {formatDate(profile.expected_completion_date)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Current Status</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile.status?.replace('_', ' ').charAt(0).toUpperCase() + profile.status?.slice(1)}
            </p>
          </div>
        </div>

        <hr className="my-6" />

        {/* Supervisor Information */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">👨‍🏫 Supervision</h3>
            <button
              onClick={() => navigate('/supervisor-change-request')}
              className="btn-secondary text-sm"
            >
              🔄 Request Supervisor Change
            </button>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg max-w-md">
            <label className="block text-sm font-medium text-gray-600 mb-2">Current Supervisor</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile.supervisor?.user?.name || 'Not Assigned'}
            </p>
            {profile.supervisor?.designation && (
              <p className="text-sm text-gray-600 mt-1">{profile.supervisor.designation}</p>
            )}
            {profile.supervisor?.specialization && (
              <p className="text-xs text-gray-500 mt-1">{profile.supervisor.specialization}</p>
            )}
            {profile.supervisor?.user?.email && (
              <p className="text-sm text-gray-600 mt-2">📧 {profile.supervisor.user.email}</p>
            )}
          </div>
        </div>

        <hr className="my-6" />

        {/* Research Information - Editable */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🔬 Research Information</h3>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization / Research Area *
                </label>
                <textarea
                  name="research_area"
                  value={formData.research_area}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Enter your research area (e.g., Machine Learning, Quantum Computing)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thesis Title
                </label>
                <textarea
                  name="thesis_title"
                  value={formData.thesis_title}
                  onChange={handleChange}
                  rows="2"
                  className="input-field"
                  placeholder="Enter your thesis title (if finalized)"
                />
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-success">
                  💾 Save Changes
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary">
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Specialization / Research Area
                </label>
                <p className="text-lg text-gray-800">
                  {profile.research_area || <span className="text-gray-400 italic">Not specified</span>}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Thesis Title
                </label>
                <p className="text-lg text-gray-800">
                  {profile.thesis_title || <span className="text-gray-400 italic">Not specified</span>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Academic Progress */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            📊 Academic Progress
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Exams Completed</span>
              <span className="font-semibold text-gray-800">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Seminars Presented</span>
              <span className="font-semibold text-gray-800">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Progress Reports</span>
              <span className="font-semibold text-gray-800">-</span>
            </div>
          </div>
        </div>

        {/* Courses Taken */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            📚 Courses Taken
          </h3>
          <div className="text-gray-500 text-center py-4">
            <p className="mb-2">No courses recorded</p>
            <p className="text-sm">Contact your department to update course information</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            ⚡ Quick Actions
          </h3>
          <div className="space-y-2">
            <a href="/synopsis" className="block w-full text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm">
              📄 Submit Synopsis
            </a>
            <a href="/progress-reports" className="block w-full text-left px-3 py-2 rounded bg-green-50 hover:bg-green-100 text-green-700 text-sm">
              📊 Submit Progress Report
            </a>
            <a href="/travel-grants" className="block w-full text-left px-3 py-2 rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm">
              ✈️ Apply for Travel Grant
            </a>
            <a href="/calendar" className="block w-full text-left px-3 py-2 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm">
              📅 View Calendar
            </a>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📞 Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-lg text-gray-800">{profile.user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            <p className="text-lg text-gray-800">{profile.user?.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScholarProfile;