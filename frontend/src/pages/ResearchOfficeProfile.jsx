import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { researchOfficeAPI } from '../services/api';
import Layout from '../components/Layout';

const ResearchOfficeProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug: Log user role
  console.log('ResearchOfficeProfile - User:', user);
  console.log('ResearchOfficeProfile - User Role:', user?.role);

  const [dashboardData, setDashboardData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(null);
  const [allScholars, setAllScholars] = useState(null);
  const [allFaculty, setAllFaculty] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, pendingRes, scholarsRes, facultyRes, announcementsRes] = await Promise.all([
        researchOfficeAPI.getDashboard(),
        researchOfficeAPI.getPendingRequests(),
        researchOfficeAPI.getAllScholars(),
        researchOfficeAPI.getAllFaculty(),
        researchOfficeAPI.getAnnouncements()
      ]);

      setDashboardData(dashboardRes.data);
      setPendingRequests(pendingRes.data);
      setAllScholars(scholarsRes.data);
      setAllFaculty(facultyRes.data);
      setAnnouncements(announcementsRes.data.announcements);
      setError(null);
    } catch (err) {
      console.error('Error fetching research office dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Filter scholars
  const filteredScholars = allScholars?.filter(scholar => {
    const matchesSearch = !searchQuery ||
      scholar.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholar.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || scholar.status === filterStatus;
    const matchesProgram = filterProgram === 'all' || scholar.program === filterProgram;

    const matchesYear = filterYear === 'all' ||
      (scholar.admission_date && new Date(scholar.admission_date).getFullYear().toString() === filterYear);

    const matchesSchool = filterSchool === 'all' ||
      (scholar.school && scholar.school.id.toString() === filterSchool);

    return matchesSearch && matchesStatus && matchesProgram && matchesYear && matchesSchool;
  }) || [];

  // Get unique admission years
  const admissionYears = [...new Set(
    allScholars?.map(s => s.admission_date ? new Date(s.admission_date).getFullYear() : null)
      .filter(year => year !== null)
      .sort((a, b) => b - a) || []
  )];

  // Export functionality
  const exportAll = async () => {
    try {
      const response = await researchOfficeAPI.exportScholars();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `scholars_export_${new Date().toISOString().slice(0,10)}.csv`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Scholar data exported successfully!');
    } catch (error) {
      console.error('Error exporting scholars:', error);
      alert('Failed to export scholar data. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'ad_research' ? 'Associate Dean Research' : 'Research Office'} Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Comprehensive overview of research activities and scholars</p>
        </div>

        {/* Statistics Grid */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Scholars</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.statistics?.students?.total || 0}</p>
                </div>
                <div className="text-4xl opacity-80">👨‍🎓</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Scholars</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.statistics?.students?.active || 0}</p>
                </div>
                <div className="text-4xl opacity-80">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Faculty</p>
                  <p className="text-3xl font-bold mt-2">{dashboardData.statistics?.faculty?.total || 0}</p>
                </div>
                <div className="text-4xl opacity-80">👨‍🏫</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Reviews</p>
                  <p className="text-3xl font-bold mt-2">{pendingRequests?.total_count || 0}</p>
                </div>
                <div className="text-4xl opacity-80">⏳</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              {user?.role === 'ad_research' && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics
                </button>
              )}
              <button
                onClick={() => setActiveTab('scholars')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scholars'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Scholars ({allScholars?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faculty'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Faculty ({allFaculty?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Requests ({pendingRequests?.total_count || 0})
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Announcements ({announcements?.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && dashboardData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-800 mb-3">Students Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Total:</span><span className="font-bold">{dashboardData.statistics?.students?.total}</span></div>
                      <div className="flex justify-between"><span>Active:</span><span className="font-bold">{dashboardData.statistics?.students?.active}</span></div>
                      <div className="flex justify-between"><span>PhD:</span><span className="font-bold">{dashboardData.statistics?.students?.phd}</span></div>
                      <div className="flex justify-between"><span>M.Sc.:</span><span className="font-bold">{dashboardData.statistics?.students?.msc}</span></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-800 mb-3">Faculty Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Total:</span><span className="font-bold">{dashboardData.statistics?.faculty?.total}</span></div>
                      <div className="flex justify-between"><span>Accepting:</span><span className="font-bold">{dashboardData.statistics?.faculty?.accepting_students}</span></div>
                      <div className="flex justify-between"><span>Not Accepting:</span><span className="font-bold">{dashboardData.statistics?.faculty?.not_accepting}</span></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
                    <h4 className="font-semibold text-orange-800 mb-3">Pending Reviews</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Synopsis:</span><span className="font-bold">{dashboardData.statistics?.pending_items?.synopsis}</span></div>
                      <div className="flex justify-between"><span>Reports:</span><span className="font-bold">{dashboardData.statistics?.pending_items?.progress_reports}</span></div>
                      <div className="flex justify-between"><span>Thesis:</span><span className="font-bold">{dashboardData.statistics?.pending_items?.thesis}</span></div>
                      <div className="flex justify-between"><span>Travel:</span><span className="font-bold">{dashboardData.statistics?.pending_items?.travel_grants}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && user?.role === 'ad_research' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Research Analytics</h3>

                {/* Program Distribution */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Scholar Distribution by Program</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-indigo-700 font-medium">PhD Scholars</p>
                          <p className="text-4xl font-bold text-indigo-900 mt-2">
                            {allScholars?.filter(s => s.program === 'PhD').length || 0}
                          </p>
                        </div>
                        <div className="text-5xl opacity-60">🎓</div>
                      </div>
                      <div className="mt-4 text-sm text-indigo-600">
                        Active: {allScholars?.filter(s => s.program === 'PhD' && s.status === 'active').length || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-teal-700 font-medium">M.Sc. Scholars</p>
                          <p className="text-4xl font-bold text-teal-900 mt-2">
                            {allScholars?.filter(s => s.program === 'M.Sc. (Research)').length || 0}
                          </p>
                        </div>
                        <div className="text-5xl opacity-60">📚</div>
                      </div>
                      <div className="mt-4 text-sm text-teal-600">
                        Active: {allScholars?.filter(s => s.program === 'M.Sc. (Research)' && s.status === 'active').length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Scholar Status Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Active</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">
                        {allScholars?.filter(s => s.status === 'active').length || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-yellow-600 font-medium">On Leave</p>
                      <p className="text-3xl font-bold text-yellow-900 mt-2">
                        {allScholars?.filter(s => s.status === 'on_leave').length || 0}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-sm text-orange-600 font-medium">Suspended</p>
                      <p className="text-3xl font-bold text-orange-900 mt-2">
                        {allScholars?.filter(s => s.status === 'suspended').length || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-600 font-medium">Rusticated</p>
                      <p className="text-3xl font-bold text-red-900 mt-2">
                        {allScholars?.filter(s => s.is_rusticated).length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* School-wise Distribution */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">School-wise Scholar Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...new Set(allScholars?.map(s => s.school?.id).filter(Boolean))].map(schoolId => {
                      const school = allScholars?.find(s => s.school?.id === schoolId)?.school;
                      const schoolScholars = allScholars?.filter(s => s.school?.id === schoolId) || [];
                      return (
                        <div key={schoolId} className="border rounded-lg p-4 bg-gray-50">
                          <h5 className="font-semibold text-gray-900 mb-2">{school?.name}</h5>
                          <p className="text-sm text-gray-600 mb-3">Code: {school?.code}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-blue-50 rounded p-2">
                              <p className="text-xs text-blue-600">Total</p>
                              <p className="text-lg font-bold text-blue-900">{schoolScholars.length}</p>
                            </div>
                            <div className="bg-green-50 rounded p-2">
                              <p className="text-xs text-green-600">Active</p>
                              <p className="text-lg font-bold text-green-900">
                                {schoolScholars.filter(s => s.status === 'active').length}
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded p-2">
                              <p className="text-xs text-purple-600">PhD</p>
                              <p className="text-lg font-bold text-purple-900">
                                {schoolScholars.filter(s => s.program === 'PhD').length}
                              </p>
                            </div>
                            <div className="bg-teal-50 rounded p-2">
                              <p className="text-xs text-teal-600">M.Sc.</p>
                              <p className="text-lg font-bold text-teal-900">
                                {schoolScholars.filter(s => s.program === 'M.Sc. (Research)').length}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Faculty Analytics */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Faculty Analytics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <p className="text-purple-700 font-medium">Total Faculty</p>
                      <p className="text-4xl font-bold text-purple-900 mt-2">
                        {allFaculty?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <p className="text-green-700 font-medium">Accepting Students</p>
                      <p className="text-4xl font-bold text-green-900 mt-2">
                        {allFaculty?.filter(f => f.is_accepting_students).length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                      <p className="text-gray-700 font-medium">Not Accepting</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">
                        {allFaculty?.filter(f => !f.is_accepting_students).length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Items Summary */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Reviews Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-sm text-orange-600 font-medium">Synopsis</p>
                      <p className="text-3xl font-bold text-orange-900 mt-2">
                        {pendingRequests?.synopsis?.length || 0}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Progress Reports</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2">
                        {pendingRequests?.progress_reports?.length || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium">Thesis</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2">
                        {pendingRequests?.thesis?.length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Travel Grants</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">
                        {pendingRequests?.travel_grants?.length || 0}
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <p className="text-sm text-pink-600 font-medium">Supervisor Changes</p>
                      <p className="text-3xl font-bold text-pink-900 mt-2">
                        {pendingRequests?.supervisor_changes?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Scholars Tab */}
            {activeTab === 'scholars' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters & Search</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="text"
                      placeholder="Search by name, enrollment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="rusticated">Rusticated</option>
                      <option value="on_leave">On Leave</option>
                      <option value="graduated">Graduated</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                    <select
                      value={filterProgram}
                      onChange={(e) => setFilterProgram(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Programs</option>
                      <option value="PhD">PhD</option>
                      <option value="M.Sc. (Research)">M.Sc. (Research)</option>
                    </select>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Years</option>
                      {admissionYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={filterSchool}
                      onChange={(e) => setFilterSchool(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Schools</option>
                      {dashboardData?.schools?.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export Button */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800">Export Scholar Data</h3>
                      <p className="text-xs text-blue-600 mt-1">Download comprehensive CSV with all scholar information</p>
                    </div>
                    <button onClick={exportAll} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                      📊 Export Complete Data ({allScholars?.length || 0} scholars)
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredScholars?.length || 0}</span> of <span className="font-semibold text-gray-900">{allScholars?.length || 0}</span> scholars
                </div>

                {/* Scholars Table */}
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredScholars.map((scholar) => (
                        <tr key={scholar.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {scholar.enrollment_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {scholar.user?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scholar.program}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scholar.school?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scholar.supervisor?.name || 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              scholar.status === 'active' ? 'bg-green-100 text-green-800' :
                              scholar.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                              scholar.status === 'rusticated' ? 'bg-red-100 text-red-800' :
                              scholar.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                              scholar.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {scholar.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Faculty Tab */}
            {activeTab === 'faculty' && allFaculty && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accepting</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allFaculty.map((faculty) => (
                      <tr key={faculty.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {faculty.employee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {faculty.user?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {faculty.designation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {faculty.school?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {faculty.current_students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            faculty.is_accepting_students ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {faculty.is_accepting_students ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pending Requests Tab */}
            {activeTab === 'pending' && pendingRequests && (
              <div className="space-y-4">
                <p className="text-gray-600">Total pending items: <span className="font-bold">{pendingRequests.total_count}</span></p>
                {/* Display pending synopsis, reports, thesis, travel grants, etc. */}
                <div className="text-sm text-gray-500">
                  View and process pending synopsis, progress reports, thesis submissions, and travel grant requests.
                </div>
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && announcements && (
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No announcements available</p>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                          <p className="mt-2 text-gray-600">{announcement.message}</p>
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                            <span>👤 {announcement.created_by?.name}</span>
                            <span>📅 {new Date(announcement.created_at).toLocaleDateString()}</span>
                            {announcement.target_audience && (
                              <span>🎯 {announcement.target_audience.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          announcement.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {announcement.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResearchOfficeProfile;
