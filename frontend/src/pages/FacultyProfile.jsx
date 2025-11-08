import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supervisorAPI } from '../services/api';

const FacultyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await supervisorAPI.getMyProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'on_leave': 'bg-yellow-100 text-yellow-800',
      'graduated': 'bg-blue-100 text-blue-800',
      'withdrawn': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">No profile data available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Faculty Profile</h1>
        <p className="text-gray-600 mt-2">View your profile and supervise students</p>
      </div>

      {/* Profile Header Card */}
      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-primary-200 rounded-full flex items-center justify-center text-4xl">
              👨‍🏫
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{profile.user?.name}</h2>
            <p className="text-lg text-gray-600 mt-1">{profile.designation}</p>
            <p className="text-sm text-gray-500 mt-1">Employee ID: {profile.employee_id}</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">School</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.school?.name || 'Not assigned'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="text-lg font-semibold text-gray-800">
                  {profile.specialization || 'Not specified'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_accepting_students ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile.is_accepting_students ? 'Accepting Students' : 'Not Accepting'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm text-blue-600 font-medium">Total Students</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {profile.statistics?.total_students || 0}
          </p>
        </div>
        <div className="card bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-green-600 font-medium">PhD Students</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {profile.statistics?.phd_students || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Max: {profile.max_phd_scholars}</p>
        </div>
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <p className="text-sm text-purple-600 font-medium">M.Sc. Students</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">
            {profile.statistics?.msc_students || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Max: {profile.max_msc_scholars}</p>
        </div>
        <div className="card bg-orange-50 border-l-4 border-orange-500">
          <p className="text-sm text-orange-600 font-medium">Committees</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">
            {profile.statistics?.total_committees || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'students'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students ({profile.students?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('committees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'committees'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Committees ({profile.committees?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-gray-800 font-medium">{profile.user?.email || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-800 font-medium">{profile.user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Capacity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded p-4">
                    <span className="text-gray-700">PhD Scholars Capacity</span>
                    <span className="font-semibold text-gray-800">
                      {profile.statistics?.phd_students || 0} / {profile.max_phd_scholars}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded p-4">
                    <span className="text-gray-700">M.Sc. Scholars Capacity</span>
                    <span className="font-semibold text-gray-800">
                      {profile.statistics?.msc_students || 0} / {profile.max_msc_scholars}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              {!profile.students || profile.students.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 mb-2">No students under supervision</p>
                  <p className="text-sm text-gray-400">
                    Students will appear here once they are assigned to you
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.students.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{student.user?.name}</h4>
                          <p className="text-sm text-gray-500">{student.enrollment_number}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                          {student.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Program</p>
                          <p className="text-sm font-medium text-gray-800">{student.program}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Research Area</p>
                          <p className="text-sm font-medium text-gray-800">
                            {student.research_area || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date of Admission</p>
                          <p className="text-sm font-medium text-gray-800">
                            {student.date_of_admission
                              ? new Date(student.date_of_admission).toLocaleDateString()
                              : 'Not available'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                        <div className="flex space-x-4">
                          <p className="text-sm text-gray-700">{student.user?.email}</p>
                          {student.user?.phone && (
                            <p className="text-sm text-gray-700">{student.user.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Committees Tab */}
          {activeTab === 'committees' && (
            <div>
              {!profile.committees || profile.committees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 mb-2">No committee memberships</p>
                  <p className="text-sm text-gray-400">
                    You are not currently part of any doctoral committees
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.committees.map((committee) => (
                    <div key={committee.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{committee.name}</h4>
                          <p className="text-sm text-gray-500">Committee ID: {committee.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          committee.type === 'DC'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {committee.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Your Role</p>
                          <p className="text-sm font-medium text-gray-800">
                            {committee.role || 'Member'}
                          </p>
                        </div>
                        {committee.scholar && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Scholar</p>
                            <p className="text-sm font-medium text-gray-800">
                              {committee.scholar.name} ({committee.scholar.enrollment_number})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FacultyProfile;
