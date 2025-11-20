import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { schoolAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SchoolChairProfile = () => {
  const { user } = useAuth();
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');

  // Approvals state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalTypeFilter, setApprovalTypeFilter] = useState('all');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('month');

  // Comprehensive exams state
  const [comprehensiveExams, setComprehensiveExams] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examSuccess, setExamSuccess] = useState('');
  const [examError, setExamError] = useState('');
  const [showExamForm, setShowExamForm] = useState(false);
  const [examFormData, setExamFormData] = useState({
    title: '',
    description: '',
    exam_date: '',
    exam_time: '',
    duration_minutes: 180,
    venue: '',
    program: '',
    admission_year: '',
    instructions: '',
    syllabus: ''
  });

  useEffect(() => {
    loadSchoolData();
  }, []);

  useEffect(() => {
    if (activeTab === 'approvals') {
      loadPendingApprovals();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
      } else if (activeTab === 'comprehensive') {
        loadComprehensiveExams();
    }
  }, [activeTab, analyticsTimeRange]);

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

  const loadPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/school-chair/pending-approvals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/school-chair/analytics?range=${analyticsTimeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadComprehensiveExams = async () => {
    try {
      setExamLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/comprehensive-exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load exams');
      }

      const data = await response.json();
      setComprehensiveExams(data);
    } catch (err) {
      console.error('Error loading comprehensive exams:', err);
      setExamError(err.message || 'Failed to load comprehensive exams');
    } finally {
      setExamLoading(false);
    }
  };

  const handleExamFieldChange = (e) => {
    const { name, value } = e.target;
    setExamFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetExamForm = () => {
    setExamFormData({
      title: '',
      description: '',
      exam_date: '',
      exam_time: '',
      duration_minutes: 180,
      venue: '',
      program: '',
      admission_year: '',
      instructions: '',
      syllabus: ''
    });
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    setExamError('');
    setExamSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const payload = { ...examFormData };

      if (!payload.program) delete payload.program;
      if (!payload.admission_year) delete payload.admission_year;

      const response = await fetch(`${API_BASE_URL}/comprehensive-exams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to schedule exam');
      }

      const data = await response.json();
      setExamSuccess(data.message || 'Exam scheduled successfully');
      setShowExamForm(false);
      resetExamForm();
      loadComprehensiveExams();
    } catch (err) {
      console.error('Error scheduling exam:', err);
      setExamError(err.message || 'Failed to schedule exam');
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

  const filteredApprovals = pendingApprovals.filter(approval => {
    return approvalTypeFilter === 'all' || approval.type === approvalTypeFilter;
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900">School Chair Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage and oversee your school</p>
      </div>

      {/* School Header */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-3 bg-purple-100">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-4xl text-white">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-purple-900">{schoolData.name}</h2>
              <p className="text-lg text-gray-700 mt-1">School Code: {schoolData.code}</p>
              <p className="text-sm text-gray-600 mt-1">Chair: {user?.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <p className="text-sm text-purple-700">Total Students</p>
              <p className="text-2xl font-bold text-purple-900">
                {schoolData.statistics?.total_students || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <p className="text-sm text-purple-700">PhD Students</p>
              <p className="text-2xl font-bold text-purple-900">
                {schoolData.statistics?.phd_students || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <p className="text-sm text-purple-700">MSc Students</p>
              <p className="text-2xl font-bold text-purple-900">
                {schoolData.statistics?.msc_students || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-700">
                {pendingApprovals.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="bg-purple-100 border-b border-purple-200">
          <nav className="flex space-x-6 overflow-x-auto px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Approvals
            </button>
            <button
              onClick={() => setActiveTab('comprehensive')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'comprehensive'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Comprehensive Exams
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'faculty'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 text-sm text-gray-700 transition-colors whitespace-nowrap ${
                activeTab === 'students'
                  ? 'border-purple-600'
                  : 'border-transparent hover:text-purple-900'
              }`}
            >
              Students
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold text-purple-900 mb-4">School Overview</h3>
              <p className="text-gray-600">Welcome to {schoolData.name}!</p>
              <p className="text-gray-600 mt-2">Total Faculty: {schoolData.statistics?.total_faculty || 0}</p>
              <p className="text-gray-600 mt-2">Total Students: {schoolData.statistics?.total_students || 0}</p>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-900">School Analytics</h3>
                <select
                  value={analyticsTimeRange}
                  onChange={(e) => setAnalyticsTimeRange(e.target.value)}
                  className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300 w-48"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {analyticsLoading ? (
                <div className="text-center py-12">
                  <div className="spinner mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading analytics...</p>
                </div>
              ) : analyticsData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                      <p className="text-sm text-purple-700 font-medium mb-2">Total Submissions</p>
                      <p className="text-3xl font-bold text-purple-900">{analyticsData.total_submissions || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-5 border border-violet-200">
                      <p className="text-sm text-violet-700 font-medium mb-2">Approvals Given</p>
                      <p className="text-3xl font-bold text-violet-900">{analyticsData.total_approvals || 0}</p>
                      <p className="text-xs text-violet-600 mt-1">{analyticsData.approval_rate || 0}% approval rate</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-5 border border-purple-300">
                      <p className="text-sm text-purple-800 font-medium mb-2">Pending Reviews</p>
                      <p className="text-3xl font-bold text-purple-900">{analyticsData.pending_count || 0}</p>
                      <p className="text-xs text-purple-700 mt-1">Avg. {analyticsData.avg_review_time || 0} days review time</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg p-5 border border-violet-300">
                      <p className="text-sm text-violet-800 font-medium mb-2">Active Projects</p>
                      <p className="text-3xl font-bold text-violet-900">{analyticsData.active_projects || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-purple-900 mb-4">Submission Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Synopsis</span>
                          <span className="font-semibold text-purple-900">{analyticsData.breakdown?.synopsis || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Progress Reports</span>
                          <span className="font-semibold text-purple-900">{analyticsData.breakdown?.progress_reports || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Thesis</span>
                          <span className="font-semibold text-purple-900">{analyticsData.breakdown?.thesis || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Leave Applications</span>
                          <span className="font-semibold text-purple-900">{analyticsData.breakdown?.leave || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-purple-900 mb-4">Faculty Load</h4>
                      <div className="space-y-3">
                        {analyticsData.faculty_load && analyticsData.faculty_load.length > 0 ? (
                          analyticsData.faculty_load.map((faculty, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{faculty.name}</span>
                              <span className="font-semibold text-gray-800">{faculty.students}/{faculty.max_capacity}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No faculty data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {analyticsData.recent_activities && analyticsData.recent_activities.length > 0 && (
                    <div className="bg-white border border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-purple-900 mb-4">Recent Activities</h4>
                      <div className="space-y-2">
                        {analyticsData.recent_activities.map((activity, idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              activity.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {activity.action}
                            </span>
                            <span className="text-gray-600">{activity.scholar_name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{activity.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No analytics data available
                </div>
              )}
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-900">Pending Approvals</h3>
                <select
                  value={approvalTypeFilter}
                  onChange={(e) => setApprovalTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300 w-64"
                >
                  <option value="all">All Types</option>
                  <option value="synopsis">Synopsis</option>
                  <option value="progress-reports">Progress Reports</option>
                  <option value="thesis">Thesis</option>
                  <option value="leave-applications">Leave Applications</option>
                  <option value="supervisor-change">Supervisor Change</option>
                  <option value="comprehensive-exams">Comprehensive Exams</option>
                </select>
              </div>

              {approvalsLoading ? (
                <div className="text-center py-12">
                  <div className="spinner mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading approvals...</p>
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500">No pending approvals</p>
                  <p className="text-gray-400 mt-2">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApprovals.map((approval, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">
                              {approval.type === 'synopsis' ? 'Synopsis' : 
                               approval.type === 'progress-reports' ? 'Progress' : 
                               approval.type === 'thesis' ? 'Thesis' : 
                               approval.type === 'leave-applications' ? 'Leave' : 'Document'}
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-800 capitalize">{approval.type.replace('-', ' ')}</h4>
                              <p className="text-sm text-gray-500">Scholar: {approval.scholar.name} ({approval.scholar.enrollment_number})</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 mt-3">
                            <p>Program: {approval.scholar.program}</p>
                            <p>Supervisor: {approval.supervisor}</p>
                            <p>Submitted: {new Date(approval.submitted_at).toLocaleDateString()}</p>
                            {approval.file_name && (
                              <p>File: <a href={`http://localhost:5000/api/uploads/${approval.type}/${approval.file_name}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{approval.file_name}</a></p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button className="btn btn-primary btn-sm">View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comprehensive Exams Tab */}
          {activeTab === 'comprehensive' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Comprehensive Exams</h3>
                  <p className="text-sm text-gray-600">Schedule exams and notify every scholar in your school instantly.</p>
                </div>
                {!showExamForm && (
                  <button
                    onClick={() => { setShowExamForm(true); setExamSuccess(''); setExamError(''); }}
                    className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium"
                  >
                    + Schedule Exam
                  </button>
                )}
              </div>

              {examSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {examSuccess}
                </div>
              )}

              {examError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {examError}
                </div>
              )}

              {showExamForm && (
                <div className="bg-white border border-purple-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-purple-900">Schedule Comprehensive Exam</h4>
                    <button
                      onClick={() => { setShowExamForm(false); resetExamForm(); }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleExamSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={examFormData.title}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          required
                          placeholder="e.g., Comprehensive Exam - Spring 2026"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={examFormData.description}
                          onChange={handleExamFieldChange}
                          rows="2"
                          className="input-field"
                          placeholder="Brief summary for scholars"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
                        <input
                          type="date"
                          name="exam_date"
                          value={examFormData.exam_date}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Time *</label>
                        <input
                          type="time"
                          name="exam_time"
                          value={examFormData.exam_time}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                        <input
                          type="number"
                          name="duration_minutes"
                          value={examFormData.duration_minutes}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          required
                          min="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                        <input
                          type="text"
                          name="venue"
                          value={examFormData.venue}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          required
                          placeholder="Main Auditorium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program Filter</label>
                        <select
                          name="program"
                          value={examFormData.program}
                          onChange={handleExamFieldChange}
                          className="input-field"
                        >
                          <option value="">All Programs</option>
                          <option value="PhD">PhD</option>
                          <option value="MSc">MSc</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admission Year Filter</label>
                        <input
                          type="number"
                          name="admission_year"
                          value={examFormData.admission_year}
                          onChange={handleExamFieldChange}
                          className="input-field"
                          placeholder="e.g., 2024"
                          min="2000"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <textarea
                          name="instructions"
                          value={examFormData.instructions}
                          onChange={handleExamFieldChange}
                          rows="3"
                          className="input-field"
                          placeholder="Important notes for scholars"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus</label>
                        <textarea
                          name="syllabus"
                          value={examFormData.syllabus}
                          onChange={handleExamFieldChange}
                          rows="3"
                          className="input-field"
                          placeholder="Outline of topics"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                        Schedule & Notify
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowExamForm(false); resetExamForm(); }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-purple-100">
                  <h4 className="text-sm font-semibold text-purple-900">Scheduled Exams</h4>
                </div>
                {examLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading exams...</div>
                ) : comprehensiveExams.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No exams scheduled yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {comprehensiveExams.map(exam => (
                          <tr key={exam.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                              <div className="text-xs text-gray-500">{exam.program || 'All Programs'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : '—'}<br />
                              <span className="text-xs text-gray-500">{exam.exam_time?.slice(0,5)}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{exam.venue}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{exam.registered_count}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                exam.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {exam.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Faculty Tab */}
          {activeTab === 'faculty' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-900">Faculty Members</h3>
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300 w-64"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFaculty.map((faculty) => (
                  <div key={faculty.id} className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition">
                    <h4 className="font-semibold text-purple-900">{faculty.user?.name || 'N/A'}</h4>
                    <p className="text-sm text-purple-700">{faculty.designation || 'Faculty Member'}</p>
                    <p className="text-sm text-gray-600 mt-2">{faculty.user?.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-purple-900">Students</h3>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300 w-64"
                  />
                  <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300">
                    <option value="all">All Programs</option>
                    <option value="PhD">PhD</option>
                    <option value="MSc">MSc</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:border-purple-300">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition">
                    <h4 className="font-semibold text-purple-900">{student.user?.name || 'N/A'}</h4>
                    <p className="text-sm text-purple-700">{student.enrollment_number}</p>
                    <p className="text-sm text-gray-600">{student.program}</p>
                    <p className="text-xs text-gray-500 mt-2">Status: {student.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SchoolChairProfile;
