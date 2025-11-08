import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { schoolAPI } from '../services/api';

const SchoolChairProfile = () => {
  const { user } = useAuth();
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      const response = await schoolAPI.getMySchool();
      setSchoolData(response.data);
    } catch (error) {
      console.error('Error loading school data:', error);
      setError(error.response?.data?.error || 'Failed to load school data');
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

  const filteredStudents = schoolData?.students?.filter(student => {
    const matchesSearch = !searchQuery ||
      student.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesProgram = filterProgram === 'all' || student.program === filterProgram;

    return matchesSearch && matchesStatus && matchesProgram;
  }) || [];

  const filteredFaculty = schoolData?.faculty?.filter(fac => {
    return !searchQuery || fac.user?.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

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

  if (!schoolData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">No school data available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">School Chair Profile</h1>
        <p className="text-gray-600 mt-2">Manage and oversee your school</p>
      </div>

      {/* School Header Card */}
      <div className="card mb-6 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-indigo-200 rounded-full flex items-center justify-center text-4xl">
              🏫
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{schoolData.name}</h2>
            <p className="text-lg text-gray-600 mt-1">School Code: {schoolData.code}</p>
            <p className="text-sm text-gray-500 mt-1">Chair: {user?.name}</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">Total Faculty</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {schoolData.statistics?.total_faculty || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {schoolData.statistics?.total_students || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">PhD Students</p>
                <p className="text-2xl font-bold text-purple-600">
                  {schoolData.statistics?.phd_students || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-500">M.Sc. Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {schoolData.statistics?.msc_students || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-green-600 font-medium">Active Students</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {schoolData.statistics?.active_students || 0}
          </p>
        </div>
        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-600 font-medium">On Leave</p>
          <p className="text-3xl font-bold text-yellow-900 mt-2">
            {schoolData.statistics?.on_leave || 0}
          </p>
        </div>
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm text-blue-600 font-medium">Graduated</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {schoolData.statistics?.graduated || 0}
          </p>
        </div>
        <div className="card bg-indigo-50 border-l-4 border-indigo-500">
          <p className="text-sm text-indigo-600 font-medium">Faculty Accepting</p>
          <p className="text-3xl font-bold text-indigo-900 mt-2">
            {schoolData.statistics?.faculty_accepting_students || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
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
              onClick={() => setActiveTab('faculty')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'faculty'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Faculty ({schoolData.faculty?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'students'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students ({schoolData.students?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">School Name</p>
                    <p className="text-gray-800 font-medium">{schoolData.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">School Code</p>
                    <p className="text-gray-800 font-medium">{schoolData.code}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">Chair</p>
                    <p className="text-gray-800 font-medium">{user?.name}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm text-gray-500 mb-1">Contact</p>
                    <p className="text-gray-800 font-medium">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-700 mb-4">Student Programs</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">PhD</span>
                        <span className="font-bold text-purple-600">
                          {schoolData.statistics?.phd_students || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">M.Sc. (Research)</span>
                        <span className="font-bold text-green-600">
                          {schoolData.statistics?.msc_students || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-700 mb-4">Student Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active</span>
                        <span className="font-bold text-green-600">
                          {schoolData.statistics?.active_students || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">On Leave</span>
                        <span className="font-bold text-yellow-600">
                          {schoolData.statistics?.on_leave || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Graduated</span>
                        <span className="font-bold text-blue-600">
                          {schoolData.statistics?.graduated || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Tab */}
          {activeTab === 'faculty' && (
            <div>
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search faculty by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-full md:w-96"
                />
              </div>

              {filteredFaculty.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 mb-2">No faculty members found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No faculty assigned to this school'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFaculty.map((faculty) => (
                    <div key={faculty.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{faculty.user?.name}</h4>
                          <p className="text-sm text-gray-500">{faculty.employee_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          faculty.is_accepting_students
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {faculty.is_accepting_students ? 'Accepting Students' : 'Not Accepting'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Designation</p>
                          <p className="text-sm font-medium text-gray-800">{faculty.designation}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Specialization</p>
                          <p className="text-sm font-medium text-gray-800">
                            {faculty.specialization || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Students</p>
                          <p className="text-sm font-medium text-gray-800">{faculty.current_student_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Capacity</p>
                          <p className="text-sm font-medium text-gray-800">
                            PhD: {faculty.max_phd_scholars} | MSc: {faculty.max_msc_scholars}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                        <div className="flex space-x-4">
                          <p className="text-sm text-gray-700">{faculty.user?.email}</p>
                          {faculty.user?.phone && (
                            <p className="text-sm text-gray-700">{faculty.user.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              {/* Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search students by name or enrollment number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field flex-1"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-full md:w-48"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="input-field w-full md:w-48"
                >
                  <option value="all">All Programs</option>
                  <option value="PhD">PhD</option>
                  <option value="M.Sc. (Research)">M.Sc. (Research)</option>
                </select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 mb-2">No students found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery || filterStatus !== 'all' || filterProgram !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No students enrolled in this school'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                          <p className="text-xs text-gray-500 mb-1">Admission Date</p>
                          <p className="text-sm font-medium text-gray-800">
                            {student.date_of_admission
                              ? new Date(student.date_of_admission).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Admission Mode</p>
                          <p className="text-sm font-medium text-gray-800">
                            {student.admission_mode || 'Regular'}
                          </p>
                        </div>
                      </div>

                      {student.supervisor && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Supervisor</p>
                          <p className="text-sm font-medium text-gray-800">
                            {student.supervisor.name} - {student.supervisor.designation}
                          </p>
                        </div>
                      )}

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
        </div>
      </div>
    </Layout>
  );
};

export default SchoolChairProfile;
