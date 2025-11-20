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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-purple-900">
            {user?.role === 'ad_research' ? 'Associate Dean Research' : 'Research Office'} Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, <span className="font-semibold">{user?.name}</span>! Comprehensive overview of research activities and scholars.
          </p>
        </div>

        {/* Statistics Table */}
        {dashboardData && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-100">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">
                    Total Scholars
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">
                    Active Scholars
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">
                    Total Faculty
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900">
                    Pending Reviews
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4 text-lg font-bold text-gray-900 border-t border-r border-gray-200">
                    {dashboardData.statistics?.students?.total || 0}
                  </td>
                  <td className="px-6 py-4 text-lg font-bold text-gray-900 border-t border-r border-gray-200">
                    {dashboardData.statistics?.students?.active || 0}
                  </td>
                  <td className="px-6 py-4 text-lg font-bold text-gray-900 border-t border-r border-gray-200">
                    {dashboardData.statistics?.faculty?.total || 0}
                  </td>
                  <td className="px-6 py-4 text-lg font-bold text-gray-900 border-t border-gray-200">
                    {pendingRequests?.total_count || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-500 text-purple-600'
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
                      ? 'border-b-2 border-purple-500 text-purple-600'
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
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Scholars
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faculty'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Faculty
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Announcements
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Students Overview */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-purple-100">
                    <h2 className="text-sm font-semibold text-purple-900">Students Overview</h2>
                  </div>
                  <div className="p-3">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-gray-600">Total</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.students?.total}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Active</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.students?.active}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">PhD</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.students?.phd}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">M.Sc.</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.students?.msc}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Faculty Overview */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-purple-100">
                    <h2 className="text-sm font-semibold text-purple-900">Faculty Overview</h2>
                  </div>
                  <div className="p-3">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-gray-600">Total</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.faculty?.total}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Accepting</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.faculty?.accepting_students}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Not Accepting</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.faculty?.not_accepting}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending Reviews */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-purple-100">
                    <h2 className="text-sm font-semibold text-purple-900">Pending Reviews</h2>
                  </div>
                  <div className="p-3">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-gray-600">Synopsis</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.pending_items?.synopsis}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Reports</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.pending_items?.progress_reports}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Thesis</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.pending_items?.thesis}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Travel</td>
                          <td className="py-2 text-right font-bold text-gray-900">{dashboardData.statistics?.pending_items?.travel_grants}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && user?.role === 'ad_research' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Research Analytics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Program Distribution */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Scholar Distribution by Program</h4>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3">
                        <p className="text-xs text-violet-700 font-medium">PhD Scholars</p>
                        <p className="text-xl font-bold text-violet-900 mt-1">
                          {allScholars?.filter(s => s.program === 'PhD').length || 0}
                        </p>
                        <div className="mt-1 text-xs text-violet-600">
                          Active: {allScholars?.filter(s => s.program === 'PhD' && s.status === 'active').length || 0}
                        </div>
                      </div>

                      <div className="flex-1 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3">
                        <p className="text-xs text-violet-700 font-medium">M.Sc. Scholars</p>
                        <p className="text-xl font-bold text-violet-900 mt-1">
                          {allScholars?.filter(s => s.program === 'M.Sc. (Research)').length || 0}
                        </p>
                        <div className="mt-1 text-xs text-violet-600">
                          Active: {allScholars?.filter(s => s.program === 'M.Sc. (Research)' && s.status === 'active').length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Scholar Status Distribution</h4>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-violet-50 rounded-lg p-3 border border-violet-200">
                        <p className="text-xs text-violet-600 font-medium">Active</p>
                        <p className="text-xl font-bold text-violet-900 mt-1">
                          {allScholars?.filter(s => s.status === 'active').length || 0}
                        </p>
                      </div>
                      <div className="flex-1 bg-violet-50 rounded-lg p-3 border border-violet-200">
                        <p className="text-xs text-violet-600 font-medium">On Leave</p>
                        <p className="text-xl font-bold text-violet-900 mt-1">
                          {allScholars?.filter(s => s.status === 'on_leave').length || 0}
                        </p>
                      </div>
                      <div className="flex-1 bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-xs text-orange-600 font-medium">Suspended</p>
                        <p className="text-xl font-bold text-orange-900 mt-1">
                          {allScholars?.filter(s => s.status === 'suspended').length || 0}
                        </p>
                      </div>
                      <div className="flex-1 bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-red-600 font-medium">Rusticated</p>
                        <p className="text-xl font-bold text-red-900 mt-1">
                          {allScholars?.filter(s => s.is_rusticated).length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* School-wise Distribution */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">School-wise Scholar Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...new Set(allScholars?.map(s => s.school?.id).filter(Boolean))].map(schoolId => {
                      const school = allScholars?.find(s => s.school?.id === schoolId)?.school;
                      const schoolScholars = allScholars?.filter(s => s.school?.id === schoolId) || [];
                      return (
                        <div key={schoolId} className="border rounded-lg p-3 bg-violet-50">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">{school?.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">Code: {school?.code}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-violet-100 rounded p-2">
                              <p className="text-xs text-violet-600">Total</p>
                              <p className="text-base font-bold text-violet-900">{schoolScholars.length}</p>
                            </div>
                            <div className="bg-violet-100 rounded p-2">
                              <p className="text-xs text-violet-600">Active</p>
                              <p className="text-base font-bold text-violet-900">
                                {schoolScholars.filter(s => s.status === 'active').length}
                              </p>
                            </div>
                            <div className="bg-violet-100 rounded p-2">
                              <p className="text-xs text-violet-600">PhD</p>
                              <p className="text-base font-bold text-violet-900">
                                {schoolScholars.filter(s => s.program === 'PhD').length}
                              </p>
                            </div>
                            <div className="bg-violet-100 rounded p-2">
                              <p className="text-xs text-violet-600">M.Sc.</p>
                              <p className="text-base font-bold text-violet-900">
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
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Faculty Analytics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3">
                      <p className="text-sm text-violet-700 font-medium">Total Faculty</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {allFaculty?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3">
                      <p className="text-sm text-violet-700 font-medium">Accepting Students</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {allFaculty?.filter(f => f.is_accepting_students).length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3">
                      <p className="text-sm text-violet-700 font-medium">Not Accepting</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {allFaculty?.filter(f => !f.is_accepting_students).length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Items Summary */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Pending Reviews Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium">Synopsis</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {pendingRequests?.synopsis?.length || 0}
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium">Progress Reports</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {pendingRequests?.progress_reports?.length || 0}
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium">Thesis</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {pendingRequests?.thesis?.length || 0}
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium">Travel Grants</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {pendingRequests?.travel_grants?.length || 0}
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium">Supervisor Changes</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">
                        {pendingRequests?.supervisor_changes?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Scholars Tab */}
            {activeTab === 'scholars' && (
              <div className="space-y-4 overflow-hidden">
                {/* Filters */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">Filters & Search</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="text"
                      placeholder="Search by name, enrollment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-violet-300"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-violet-300"
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
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-violet-300"
                    >
                      <option value="all">All Programs</option>
                      <option value="PhD">PhD</option>
                      <option value="M.Sc. (Research)">M.Sc. (Research)</option>
                    </select>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-violet-300"
                    >
                      <option value="all">All Years</option>
                      {admissionYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={filterSchool}
                      onChange={(e) => setFilterSchool(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-violet-300"
                    >
                      <option value="all">All Schools</option>
                      {dashboardData?.schools?.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export Button */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-purple-900">Export Scholar Data</h3>
                      <p className="text-xs text-purple-700 mt-1">Download comprehensive CSV with all scholar information</p>
                    </div>
                    <button onClick={exportAll} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition">
                      Export Complete Data ({allScholars?.length || 0} scholars)
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredScholars?.length || 0}</span> of <span className="font-semibold text-gray-900">{allScholars?.length || 0}</span> scholars
                </div>

                {/* Scholars Table */}
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-purple-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Enrollment</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Program</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">School</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Supervisor</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredScholars.map((scholar) => (
                        <tr key={scholar.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {scholar.enrollment_number}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {scholar.user?.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {scholar.program}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {scholar.school?.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {scholar.supervisor?.name || 'Not Assigned'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              scholar.status === 'active' ? 'text-green-800 bg-green-100' :
                              scholar.status === 'suspended' ? 'text-orange-800 bg-orange-100' :
                              scholar.status === 'rusticated' ? 'text-red-800 bg-red-100' :
                              scholar.status === 'on_leave' ? 'text-yellow-800 bg-yellow-100' :
                              scholar.status === 'graduated' ? 'text-purple-900 bg-purple-100' :
                              'text-gray-800 bg-gray-100'
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
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-purple-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Employee ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Designation</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">School</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Current Students</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Accepting</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allFaculty.map((faculty) => (
                      <tr key={faculty.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {faculty.employee_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {faculty.user?.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {faculty.designation}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {faculty.school?.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {faculty.current_students}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            faculty.is_accepting_students ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'
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
                            <span>By: {announcement.created_by?.name}</span>
                            <span>Date: {new Date(announcement.created_at).toLocaleDateString()}</span>
                            {announcement.target_audience && (
                              <span>Audience: {announcement.target_audience.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded ${
                          announcement.is_published ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'
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
