import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { deanAPI } from '../services/api';
import Layout from '../components/Layout';

// Scholar Actions Component
const ScholarActions = ({ scholar, onUpdate }) => {
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRusticateModal, setShowRusticateModal] = useState(false);
  const [suspendData, setSuspendData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [rusticateData, setRusticateData] = useState({
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendData.start_date || !suspendData.end_date || !suspendData.reason) {
      alert('Please fill all fields');
      return;
    }

    if (new Date(suspendData.start_date) >= new Date(suspendData.end_date)) {
      alert('End date must be after start date');
      return;
    }

    if (!window.confirm(`Are you sure you want to suspend ${scholar.enrollment_number}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deanAPI.suspendScholar(scholar.id, suspendData);
      alert('Scholar suspended successfully');
      setShowSuspendModal(false);
      setSuspendData({ start_date: '', end_date: '', reason: '' });
      onUpdate();
    } catch (error) {
      console.error('Error suspending scholar:', error);
      alert(error.response?.data?.error || 'Failed to suspend scholar');
    } finally {
      setLoading(false);
    }
  };

  const handleRusticate = async (e) => {
    e.preventDefault();
    if (!rusticateData.reason) {
      alert('Please provide a reason for rustication');
      return;
    }

    if (!window.confirm(`Are you sure you want to RUSTICATE ${scholar.enrollment_number}? This action is PERMANENT and cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deanAPI.rusticateScholar(scholar.id, rusticateData);
      alert('Scholar rusticated successfully');
      setShowRusticateModal(false);
      setRusticateData({ reason: '' });
      onUpdate();
    } catch (error) {
      console.error('Error rusticating scholar:', error);
      alert(error.response?.data?.error || 'Failed to rusticate scholar');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Are you sure you want to reactivate ${scholar.enrollment_number}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deanAPI.reactivateScholar(scholar.id);
      alert('Scholar reactivated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error reactivating scholar:', error);
      alert(error.response?.data?.error || 'Failed to reactivate scholar');
    } finally {
      setLoading(false);
    }
  };

  // Rusticated scholars cannot be reactivated (permanent)
  if (scholar.status === 'rusticated') {
    return (
      <span className="text-xs text-gray-500 italic">No actions available</span>
    );
  }

  // Suspended scholars can be reactivated or rusticated
  if (scholar.status === 'suspended') {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleReactivate}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
        >
          Reactivate
        </button>
        <button
          onClick={() => setShowRusticateModal(true)}
          disabled={loading}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
        >
          Rusticate
        </button>

        {/* Rusticate Modal */}
        {showRusticateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 text-red-600">Rusticate Scholar</h3>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Warning:</strong> Rustication is a permanent action and cannot be undone.
              </p>
              <form onSubmit={handleRusticate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rustication *
                  </label>
                  <textarea
                    value={rusticateData.reason}
                    onChange={(e) => setRusticateData({ ...rusticateData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="4"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRusticateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Rusticating...' : 'Rusticate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active scholars can be suspended or rusticated
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowSuspendModal(true)}
        disabled={loading}
        className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
      >
        Suspend
      </button>
      <button
        onClick={() => setShowRusticateModal(true)}
        disabled={loading}
        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
      >
        Rusticate
      </button>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-orange-600">Suspend Scholar</h3>
            <form onSubmit={handleSuspend}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={suspendData.start_date}
                  onChange={(e) => setSuspendData({ ...suspendData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={suspendData.end_date}
                  onChange={(e) => setSuspendData({ ...suspendData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension *
                </label>
                <textarea
                  value={suspendData.reason}
                  onChange={(e) => setSuspendData({ ...suspendData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="4"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Suspending...' : 'Suspend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rusticate Modal */}
      {showRusticateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-red-600">Rusticate Scholar</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Warning:</strong> Rustication is a permanent action and cannot be undone.
            </p>
            <form onSubmit={handleRusticate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rustication *
                </label>
                <textarea
                  value={rusticateData.reason}
                  onChange={(e) => setRusticateData({ ...rusticateData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="4"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRusticateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Rusticating...' : 'Rusticate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DeanAcademicsProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [allScholars, setAllScholars] = useState(null);
  const [allFaculty, setAllFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [transferData, setTransferData] = useState({ new_school_id: '', specialization: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, scholarsRes, facultyRes] = await Promise.all([
        deanAPI.getDashboard(),
        deanAPI.getAllScholars(),
        deanAPI.getAllFaculty()
      ]);

      setDashboardData(dashboardRes.data);
      setAllScholars(scholarsRes.data);
      setAllFaculty(facultyRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dean dashboard:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);

      let errorMessage = 'Failed to load dashboard data';

      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        // Error setting up request
        errorMessage = err.message || 'Failed to load dashboard data';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete faculty "${faculty.user?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deanAPI.deleteFaculty(faculty.id);
      alert('Faculty deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting faculty:', error);
      alert(error.response?.data?.error || 'Failed to delete faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChairPassword = async (school) => {
    if (!school.chair) {
      alert('This school has no chair assigned');
      return;
    }

    if (!window.confirm(`Reset password for chair "${school.chair.name}" (${school.chair.email})? A new password will be generated and displayed.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await deanAPI.resetChairPassword(school.id);

      if (response.data.email_sent) {
        alert(`Password reset successful!\n\nNew credentials have been sent to ${response.data.chair_email}`);
      } else {
        // Show the password in a modal or alert if email failed
        const password = response.data.new_password;
        alert(`Password reset successful!\n\nEmail: ${response.data.chair_email}\nNew Password: ${password}\n\nPlease save this password - it cannot be retrieved later!`);
      }

      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (school) => {
    if (school.student_count > 0) {
      alert(`Cannot delete school "${school.name}". It has ${school.student_count} active students. Please reassign or remove students first.`);
      return;
    }

    const message = school.faculty_count > 0
      ? `Are you sure you want to delete school "${school.name}"? This will also delete ${school.faculty_count} faculty member(s). This action cannot be undone.`
      : `Are you sure you want to delete school "${school.name}"? This action cannot be undone.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setLoading(true);
      await deanAPI.deleteSchool(school.id);
      alert('School deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting school:', error);
      alert(error.response?.data?.error || 'Failed to delete school');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    setTransferData({
      new_school_id: '',
      specialization: faculty.specialization || ''
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    if (!transferData.new_school_id) {
      alert('Please select a school');
      return;
    }

    if (transferData.new_school_id === selectedFaculty.school_id?.toString()) {
      alert('Faculty is already in this school');
      return;
    }

    try {
      setLoading(true);
      await deanAPI.transferFaculty(selectedFaculty.id, transferData);
      alert('Faculty transferred successfully');
      setShowTransferModal(false);
      setSelectedFaculty(null);
      setTransferData({ new_school_id: '', specialization: '' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error transferring faculty:', error);
      alert(error.response?.data?.error || 'Failed to transfer faculty');
    } finally {
      setLoading(false);
    }
  };

  const filteredScholars = allScholars?.filter(scholar => {
    const matchesSearch = !searchQuery ||
      scholar.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholar.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholar.research_area?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || scholar.status === filterStatus;
    const matchesProgram = filterProgram === 'all' || scholar.program === filterProgram;

    const matchesYear = filterYear === 'all' ||
      (scholar.admission_date && new Date(scholar.admission_date).getFullYear().toString() === filterYear);

    const matchesSchool = filterSchool === 'all' ||
      (scholar.school_id && scholar.school_id.toString() === filterSchool);

    return matchesSearch && matchesStatus && matchesProgram && matchesYear && matchesSchool;
  });

  // Get unique admission years from scholars
  const admissionYears = [...new Set(allScholars?.map(s =>
    s.admission_date ? new Date(s.admission_date).getFullYear() : null
  ).filter(Boolean))].sort((a, b) => b - a);

  // CSV Export Functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Enrollment Number',
      'Name',
      'Email',
      'Phone',
      'Program',
      'Status',
      'School',
      'Admission Date',
      'Admission Year',
      'Admission Mode',
      'Supervisor',
      'Research Area'
    ];

    const csvData = data.map(scholar => [
      scholar.enrollment_number || '',
      scholar.user?.name || '',
      scholar.user?.email || '',
      scholar.user?.phone || '',
      scholar.program || '',
      scholar.status || '',
      scholar.school?.name || '',
      scholar.admission_date ? new Date(scholar.admission_date).toLocaleDateString() : '',
      scholar.admission_date ? new Date(scholar.admission_date).getFullYear() : '',
      scholar.admission_mode || '',
      scholar.supervisor?.name || '',
      scholar.research_area || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentYear = () => {
    const currentYear = new Date().getFullYear();
    const currentYearScholars = allScholars?.filter(s =>
      s.admission_date && new Date(s.admission_date).getFullYear() === currentYear
    );
    exportToCSV(currentYearScholars, `scholars_${currentYear}.csv`);
  };

  const exportPreviousYear = () => {
    const previousYear = new Date().getFullYear() - 1;
    const previousYearScholars = allScholars?.filter(s =>
      s.admission_date && new Date(s.admission_date).getFullYear() === previousYear
    );
    exportToCSV(previousYearScholars, `scholars_${previousYear}.csv`);
  };

  const exportFiltered = () => {
    exportToCSV(filteredScholars, 'scholars_filtered.csv');
  };

  const exportAll = async () => {
    try {
      const response = await deanAPI.exportScholars();

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from response headers or use default
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

  const filteredFaculty = allFaculty?.filter(faculty => {
    const matchesSearch = !searchQuery ||
      faculty.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  const stats = dashboardData?.statistics || {};

  return (
    <Layout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Complete Institutional Oversight</p>
            </div>
            <button
              onClick={() => navigate('/bulk-scholar-upload')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Bulk Upload Scholars
            </button>
          </div>
        </div>

        {/* Main Statistics Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-100">
                <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">Total Schools</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">Total Students</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900 border-r border-purple-200">Total Faculty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-purple-900">Pending Approvals</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 text-lg font-bold text-gray-900 border-t border-gray-200 border-r border-gray-200">
                  {stats.overview?.total_schools || 0}
                </td>
                <td className="px-6 py-4 border-t border-gray-200 border-r border-gray-200">
                  <div className="text-lg font-bold text-gray-900">{stats.overview?.total_students || 0}</div>
                  <div className="text-xs text-gray-600">Active: {stats.students?.by_status?.active || 0}</div>
                </td>
                <td className="px-6 py-4 border-t border-gray-200 border-r border-gray-200">
                  <div className="text-lg font-bold text-gray-900">{stats.overview?.total_faculty || 0}</div>
                  <div className="text-xs text-gray-600">Accepting: {stats.faculty?.accepting_students || 0}</div>
                </td>
                <td className="px-6 py-4 border-t border-gray-200">
                  <div className="text-lg font-bold text-gray-900">{stats.pending_approvals?.total || 0}</div>
                  <div className="text-xs text-gray-600">Require Action</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3 bg-purple-100">
              <h3 className="text-sm font-semibold text-purple-900">Student Distribution</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">PhD Students</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.students?.by_program?.phd || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">M.Sc. Students</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.students?.by_program?.msc || 0}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On Leave</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.students?.by_status?.on_leave || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Graduated</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.students?.by_status?.graduated || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Withdrawn</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.students?.by_status?.withdrawn || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Modes */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3 bg-purple-100">
              <h3 className="text-sm font-semibold text-purple-900">By Admission Mode</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Regular</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.students?.by_admission_mode?.regular || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sponsored</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.students?.by_admission_mode?.sponsored || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">External</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.students?.by_admission_mode?.external || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3 bg-purple-100">
              <h3 className="text-sm font-semibold text-purple-900">Recent Activity (30 Days)</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Admissions</span>
                  <span className="text-sm font-semibold text-purple-900">{stats.recent_activity?.new_admissions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Graduations</span>
                  <span className="text-sm font-semibold text-purple-900">{stats.recent_activity?.graduations || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-purple-100 border-b border-purple-200">
            <nav className="flex justify-evenly">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-purple-900 text-purple-900'
                    : 'text-gray-500 hover:text-purple-900 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'schools'
                    ? 'border-b-2 border-purple-900 text-purple-900'
                    : 'text-gray-500 hover:text-purple-900 hover:border-gray-300'
                }`}
              >
                Schools
              </button>
              <button
                onClick={() => setActiveTab('scholars')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'scholars'
                    ? 'border-b-2 border-purple-900 text-purple-900'
                    : 'text-gray-500 hover:text-purple-900 hover:border-gray-300'
                }`}
              >
                All Scholars
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'faculty'
                    ? 'border-b-2 border-purple-900 text-purple-900'
                    : 'text-gray-500 hover:text-purple-900 hover:border-gray-300'
                }`}
              >
                All Faculty
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Upcoming Events */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upcoming Exams */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams</h3>
                    {stats.upcoming?.exams?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.upcoming.exams.map((exam) => (
                          <div key={exam.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{exam.exam_type}</p>
                                <p className="text-sm text-gray-600">{exam.scholar?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{exam.scholar?.enrollment_number}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-purple-900">
                                  {exam.scheduled_date ? new Date(exam.scheduled_date).toLocaleDateString() : 'TBD'}
                                </p>
                                <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                                  exam.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  exam.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {exam.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No upcoming exams</p>
                    )}
                  </div>

                  {/* Upcoming Seminars */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Seminars</h3>
                    {stats.upcoming?.seminars?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.upcoming.seminars.map((seminar) => (
                          <div key={seminar.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{seminar.seminar_type}</p>
                                <p className="text-sm text-gray-700 mt-1">{seminar.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{seminar.scholar?.name || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-purple-900">
                                  {seminar.scheduled_date ? new Date(seminar.scheduled_date).toLocaleDateString() : 'TBD'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No upcoming seminars</p>
                    )}
                  </div>
                </div>

                {/* Approval Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Approved Items Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600">Synopsis</p>
                      <p className="text-2xl font-bold text-green-900">{stats.approved_items?.synopsis || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600">Progress Reports</p>
                      <p className="text-2xl font-bold text-green-900">{stats.approved_items?.progress_reports || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600">Thesis</p>
                      <p className="text-2xl font-bold text-green-900">{stats.approved_items?.thesis || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600">Travel Grants</p>
                      <p className="text-2xl font-bold text-green-900">{stats.approved_items?.travel_grants || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schools Tab */}
            {activeTab === 'schools' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">All Schools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData?.schools?.map((school) => (
                    <div key={school.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{school.name}</h4>
                          <p className="text-sm text-gray-600">Code: {school.code}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResetChairPassword(school)}
                            className="text-purple-900 hover:text-purple-900 text-sm font-medium"
                            title="Reset Chair Password"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteSchool(school)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            title="Delete School"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {school.chair && (
                        <div className="text-sm text-gray-700 mb-3">
                          <p className="font-medium">Chair: {school.chair.name}</p>
                          <p className="text-xs text-gray-500">{school.chair.email}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-purple-50 rounded p-2">
                          <p className="text-xs text-purple-900">Faculty</p>
                          <p className="text-lg font-bold text-purple-900">{school.faculty_count || 0}</p>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <p className="text-xs text-green-600">Students</p>
                          <p className="text-lg font-bold text-green-900">{school.student_count || 0}</p>
                        </div>
                        <div className="bg-purple-50 rounded p-2">
                          <p className="text-xs text-purple-600">PhD</p>
                          <p className="text-lg font-bold text-purple-900">{school.phd_students || 0}</p>
                        </div>
                        <div className="bg-orange-50 rounded p-2">
                          <p className="text-xs text-orange-600">M.Sc.</p>
                          <p className="text-lg font-bold text-orange-900">{school.msc_students || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Scholars Tab */}
            {activeTab === 'scholars' && (
              <div className="space-y-4 overflow-hidden">
                {/* Filters Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters & Search</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="text"
                      placeholder="Search by name, enrollment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Programs</option>
                      <option value="PhD">PhD</option>
                      <option value="M.Sc. (Research)">M.Sc. (Research)</option>
                    </select>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Years</option>
                      {admissionYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={filterSchool}
                      onChange={(e) => setFilterSchool(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Schools</option>
                      {dashboardData?.schools?.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3">Export Data as CSV</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={exportCurrentYear} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
                      Export {new Date().getFullYear()} Admissions
                    </button>
                    <button onClick={exportPreviousYear} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
                      Export {new Date().getFullYear() - 1} Admissions
                    </button>
                    <button onClick={exportFiltered} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
                      Export Filtered ({filteredScholars?.length || 0} scholars)
                    </button>
                    <button onClick={exportAll} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
                      Export Complete Data ({allScholars?.length || 0} scholars)
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredScholars?.length || 0}</span> of <span className="font-semibold text-gray-900">{allScholars?.length || 0}</span> scholars
                </div>

                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-purple-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Enrollment
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Supervisor
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredScholars?.map((scholar) => (
                        <tr key={scholar.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {scholar.enrollment_number}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {scholar.user?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {scholar.program}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {scholar.admission_date ? new Date(scholar.admission_date).getFullYear() : 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              scholar.status === 'active' ? 'bg-green-100 text-green-800' :
                              scholar.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                              scholar.status === 'rusticated' ? 'bg-red-100 text-red-800' :
                              scholar.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                              scholar.status === 'graduated' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {scholar.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {scholar.school?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {scholar.supervisor?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <ScholarActions scholar={scholar} onUpdate={fetchDashboardData} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredScholars?.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No scholars found matching your criteria</p>
                )}
              </div>
            )}

            {/* All Faculty Tab */}
            {activeTab === 'faculty' && (
              <div className="space-y-4 overflow-hidden">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by name, employee ID, or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-purple-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Designation
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Accepting
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFaculty?.map((faculty) => (
                        <tr key={faculty.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {faculty.employee_id}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {faculty.user?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {faculty.designation}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {faculty.school?.name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {faculty.current_students} / {faculty.max_phd_scholars + faculty.max_msc_scholars}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              faculty.is_accepting_students
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {faculty.is_accepting_students ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm space-x-2">
                            <button
                              onClick={() => handleTransferFaculty(faculty)}
                              className="text-purple-900 hover:text-purple-900 font-medium"
                            >
                              Transfer
                            </button>
                            <button
                              onClick={() => handleDeleteFaculty(faculty)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredFaculty?.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No faculty found matching your criteria</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Faculty Modal */}
        {showTransferModal && selectedFaculty && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transfer Faculty: {selectedFaculty.user?.name}
              </h3>

              <form onSubmit={handleTransferSubmit}>
                <div className="space-y-4">
                  {/* Current School Info */}
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Current School:</p>
                    <p className="font-medium text-gray-900">{selectedFaculty.school?.name}</p>
                  </div>

                  {/* New School Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer To School <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={transferData.new_school_id}
                      onChange={(e) => setTransferData({ ...transferData, new_school_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a school</option>
                      {dashboardData?.schools
                        ?.filter(s => s.id !== selectedFaculty.school_id)
                        .map(school => (
                          <option key={school.id} value={school.id}>
                            {school.name} ({school.code})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization (Optional)
                    </label>
                    <input
                      type="text"
                      value={transferData.specialization}
                      onChange={(e) => setTransferData({ ...transferData, specialization: e.target.value })}
                      placeholder="Update specialization (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setSelectedFaculty(null);
                      setTransferData({ new_school_id: '', specialization: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Transferring...' : 'Transfer Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Recruit Faculty Form Component
const RecruitFacultyForm = ({ schools, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    designation: '',
    school_id: '',
    specialization: '',
    max_phd_scholars: 8,
    max_msc_scholars: 5,
    is_accepting_students: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await deanAPI.recruitFaculty(formData);
      setSuccess(`Faculty recruited successfully! Temporary password: ${response.data.temporary_password}`);
      setGeneratedPassword(response.data.temporary_password);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        employee_id: '',
        designation: '',
        school_id: '',
        specialization: '',
        max_phd_scholars: 8,
        max_msc_scholars: 5,
        is_accepting_students: true
      });

      // Call success callback after 2 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to recruit faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recruit New Faculty Member</h2>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>{success}</p>
          <p className="mt-2 font-mono text-sm bg-white p-2 rounded">
            Password: {generatedPassword}
          </p>
          <p className="mt-2 text-sm">Please save this password and share it with the faculty member.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Dr. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="john.doe@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID *
            </label>
            <input
              type="text"
              name="employee_id"
              required
              value={formData.employee_id}
              onChange={handleChange}
              className="input-field"
              placeholder="FAC001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation *
            </label>
            <select
              name="designation"
              required
              value={formData.designation}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- Select Designation --</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Senior Lecturer">Senior Lecturer</option>
              <option value="Lecturer">Lecturer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School *
            </label>
            <select
              name="school_id"
              required
              value={formData.school_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- Select School --</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <textarea
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="input-field"
              rows="3"
              placeholder="Research areas and specialization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max PhD Scholars
            </label>
            <input
              type="number"
              name="max_phd_scholars"
              min="0"
              max="20"
              value={formData.max_phd_scholars}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max M.Sc. Scholars
            </label>
            <input
              type="number"
              name="max_msc_scholars"
              min="0"
              max="20"
              value={formData.max_msc_scholars}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_accepting_students"
                checked={formData.is_accepting_students}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Currently accepting students
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Recruiting...' : 'Recruit Faculty'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add School Form Component
const AddSchoolForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    chair_email: '',
    chair_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await deanAPI.createSchool(formData);
      
      let successMsg = `School "${formData.name}" created successfully!`;
      if (response.data.chair_created) {
        successMsg += ` School chair account created and credentials sent to ${formData.chair_email}.`;
      } else if (formData.chair_email && !response.data.email_sent) {
        successMsg += ` Note: Failed to send email. Temporary password: ${response.data.temporary_password}`;
      }
      setSuccess(successMsg);

      // Reset form
      setFormData({ name: '', code: '', chair_email: '', chair_name: '' });

      // Call success callback after 2 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New School/Department</h2>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., School of Computer Science"
          />
          <p className="mt-1 text-sm text-gray-500">
            Full name of the school or department
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Code *
          </label>
          <input
            type="text"
            name="code"
            required
            value={formData.code}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., CS"
            maxLength="20"
          />
          <p className="mt-1 text-sm text-gray-500">
            Short code for the school (will be converted to uppercase)
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            School Chair Information
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            A school chair account will be automatically created and login credentials will be sent to the provided email.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chair Email *
              </label>
              <input
                type="email"
                name="chair_email"
                required
                value={formData.chair_email}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., chair@university.edu"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email address for login and credentials delivery
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chair Name (Optional)
              </label>
              <input
                type="text"
                name="chair_name"
                value={formData.chair_name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Dr. John Smith"
              />
              <p className="mt-1 text-sm text-gray-500">
                Full name of the school chair
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create School'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeanAcademicsProfile;
