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
  const [committee, setCommittee] = useState(null);
  const [committeeLoading, setCommitteeLoading] = useState(false);

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
      
      // Load committee information
      if (response.data.id) {
        loadCommittee(response.data.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCommittee = async (scholarId) => {
    try {
      setCommitteeLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/committees/scholar/${scholarId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommittee(data);
      }
    } catch (error) {
      console.error('Error loading committee:', error);
      // Don't show error to user - committee might not exist yet
    } finally {
      setCommitteeLoading(false);
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
        <h1 className="text-3xl font-bold text-purple-900">My Profile</h1>
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

      {/* Program Completion Banner */}
      {profile.status === 'completed' && profile.degree_awarded_date && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-violet-50 border-2 border-green-400 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="text-6xl mr-6"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Congratulations! Program Completed
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                Your {profile.program === 'PhD' ? 'Ph.D.' : 'M.Sc. (Research)'} degree has been officially awarded!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-600">Degree Awarded On</p>
                  <p className="text-lg font-bold text-green-700">{formatDate(profile.degree_awarded_date)}</p>
                </div>
                {profile.defense_completion_date && (
                  <div className="bg-white rounded-lg p-3 border border-violet-200">
                    <p className="text-sm text-gray-600">Defense Completed On</p>
                    <p className="text-lg font-bold text-violet-700">{formatDate(profile.defense_completion_date)}</p>
                  </div>
                )}
                {profile.final_result && (
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-sm text-gray-600">Final Result</p>
                    <p className="text-lg font-bold text-purple-700 uppercase">{profile.final_result.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-violet-200 rounded-full flex items-center justify-center mr-4">
              <svg className="w-12 h-12 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {profile.status === 'completed' && profile.program === 'PhD' ? 'Dr. ' : ''}{profile.user?.name}
              </h2>
              <p className="text-gray-600">{profile.user?.email}</p>
              <span className={`badge ${getStatusBadge(profile.status)} mt-2`}>
                {profile.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              onClick={handleEdit}
              className="bg-violet-100 text-violet-700 px-6 py-3 rounded-lg hover:bg-violet-200 font-medium"
            >
              Edit Profile
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
            <h3 className="text-xl font-semibold text-gray-800">Supervision</h3>
            <button
              onClick={() => navigate('/supervisor-change-request')}
              className="bg-violet-100 text-violet-700 px-4 py-2 rounded-lg hover:bg-violet-200 font-medium text-sm"
            >
              Request Supervisor Change
            </button>
          </div>
          <div className="p-4 bg-violet-50 rounded-lg max-w-md">
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
              <p className="text-sm text-gray-600 mt-2">{profile.supervisor.user.email}</p>
            )}
          </div>
        </div>

        <hr className="my-6" />

        {/* Doctoral Committee Information */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Doctoral Committee</h3>
          
          {committeeLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : committee && committee.dc_members && committee.dc_members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {committee.dc_members.map((member, index) => (
                <div key={member.id} className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-violet-200 rounded-full flex items-center justify-center">
                      <span className="text-violet-700 font-semibold">{index + 1}</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-violet-900">
                        {member.supervisor?.user?.name || 'N/A'}
                      </p>
                      {member.supervisor?.designation && (
                        <p className="text-xs text-violet-700 mt-1">
                          {member.supervisor.designation}
                        </p>
                      )}
                      {member.supervisor?.specialization && (
                        <p className="text-xs text-violet-600 mt-1">
                          {member.supervisor.specialization}
                        </p>
                      )}
                      {member.supervisor?.user?.email && (
                        <p className="text-xs text-violet-600 mt-2">
                          {member.supervisor.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-violet-50 rounded-lg text-center border border-violet-200">
              <p className="text-violet-700">No doctoral committee assigned yet</p>
              <p className="text-sm text-violet-500 mt-1">Your committee will be assigned during the admission process</p>
            </div>
          )}
        </div>

        <hr className="my-6" />

        {/* Research Information - Editable */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Research Information</h3>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
                  placeholder="Enter your thesis title (if finalized)"
                />
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
                  Save Changes
                </button>
                <button type="button" onClick={handleCancel} className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="px-4 py-3 rounded bg-violet-50">
                <label className="block text-sm font-medium text-violet-700 mb-1">
                  Specialization / Research Area
                </label>
                <p className="text-lg text-violet-900">
                  {profile.research_area || <span className="text-violet-400 italic">Not specified</span>}
                </p>
              </div>

              <div className="px-4 py-3 rounded bg-violet-50">
                <label className="block text-sm font-medium text-violet-700 mb-1">
                  Thesis Title
                </label>
                <p className="text-lg text-violet-900">
                  {profile.thesis_title || <span className="text-violet-400 italic">Not specified</span>}
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
            Academic Progress
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center px-3 py-2 rounded bg-violet-50">
              <span className="text-violet-700">Exams Completed</span>
              <span className="text-violet-900">-</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded bg-violet-50">
              <span className="text-violet-700">Seminars Presented</span>
              <span className="text-violet-900">-</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded bg-violet-50">
              <span className="text-violet-700">Progress Reports</span>
              <span className="text-violet-900">-</span>
            </div>
          </div>
        </div>

        {/* Courses Taken */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            Courses Taken
          </h3>
          <div className="text-gray-500 text-center py-4">
            <p className="mb-2">No courses recorded</p>
            <p className="text-sm">Contact your department to update course information</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <a href="/synopsis" className="block w-full text-left px-3 py-2 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm">
              Submit Synopsis
            </a>
            <a href="/progress-reports" className="block w-full text-left px-3 py-2 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm">
              Submit Progress Report
            </a>
            <a href="/travel-grants" className="block w-full text-left px-3 py-2 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm">
              Apply for Travel Grant
            </a>
            <a href="/calendar" className="block w-full text-left px-3 py-2 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm">
              View Calendar
            </a>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="px-4 py-3 rounded bg-violet-50">
            <label className="block text-sm font-medium text-violet-700 mb-1">Email</label>
            <p className="text-lg text-violet-900">{profile.user?.email}</p>
          </div>

          <div className="px-4 py-3 rounded bg-violet-50">
            <label className="block text-sm font-medium text-violet-700 mb-1">Phone</label>
            <p className="text-lg text-violet-900">{profile.user?.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default ScholarProfile;