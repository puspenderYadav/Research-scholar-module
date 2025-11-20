import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import CommitteeApprovals from '../components/CommitteeApprovals';

const MyCommitteeScholars = () => {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scholars'); // 'scholars' or 'approvals'
  const [filterType, setFilterType] = useState('all'); // 'all', 'DC', 'APC'
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommitteeScholars();
  }, []);

  const fetchCommitteeScholars = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committees/my-committee-scholars');
      setScholars(response.data);
    } catch (err) {
      console.error('Error fetching committee scholars:', err);
      setError(err.response?.data?.error || 'Failed to load scholars');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'on_leave': 'bg-yellow-100 text-yellow-800',
      'graduated': 'bg-violet-100 text-violet-800',
      'withdrawn': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCommitteeRoleBadge = (role) => {
    if (role === 'DC') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          Doctoral Committee
        </span>
      );
    } else if (role === 'APC') {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
          Academic Progress Committee
        </span>
      );
    }
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
        {role}
      </span>
    );
  };

  const filteredScholars = scholars.filter(scholar => {
    if (filterType === 'all') return true;
    return scholar.committee_role === filterType;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900">My Committee</h1>
        <p className="text-gray-600 mt-2">Manage your committee responsibilities</p>
      </div>


      {/* Main Tabs: Scholars and Approvals */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scholars')}
              className={`${
                activeTab === 'scholars'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Scholars
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                {scholars.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`${
                activeTab === 'approvals'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Approvals
            </button>
          </nav>
        </div>
      </div>

      {/* Scholars Tab Content */}
      {activeTab === 'scholars' && (
        <>
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilterType('all')}
              className={`${
                filterType === 'all'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Committees
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                {scholars.length}
              </span>
            </button>
            <button
              onClick={() => setFilterType('DC')}
              className={`${
                filterType === 'DC'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Doctoral Committee
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-purple-100 text-purple-900">
                {scholars.filter(s => s.committee_role === 'DC').length}
              </span>
            </button>
            <button
              onClick={() => setFilterType('APC')}
              className={`${
                filterType === 'APC'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Academic Progress Committee
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900">
                {scholars.filter(s => s.committee_role === 'APC').length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {filteredScholars.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500">
            {filterType === 'all' 
              ? 'You are not currently assigned to any committees'
              : `You are not currently assigned to any ${filterType === 'DC' ? 'Doctoral' : 'Academic Progress'} committees`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Scholar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Enrollment No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Research Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Assigned Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScholars.map((scholar) => (
                  <tr key={scholar.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="text-violet-600 font-semibold text-sm">
                            {scholar.user?.name?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {scholar.user?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scholar.user?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scholar.enrollment_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scholar.program}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={scholar.research_area}>
                        {scholar.research_area || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {scholar.supervisor?.user?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCommitteeRoleBadge(scholar.committee_role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(scholar.status)}`}>
                        {scholar.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(scholar.assigned_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-violet-50 border border-violet-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-violet-800">About Committee Roles</h3>
            <div className="mt-2 text-sm text-violet-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Doctoral Committee (DC):</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Review research proposals and synopsis</li>
                    <li>Evaluate thesis submissions</li>
                    <li>Approve progress reports</li>
                    <li>Participate in comprehensive exams</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Academic Progress Committee (APC):</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Monitor academic progress</li>
                    <li>Review and approve progress reports</li>
                    <li>Provide guidance on coursework</li>
                    <li>Evaluate research milestones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Approvals Tab Content */}
      {activeTab === 'approvals' && (
        <CommitteeApprovals />
      )}
    </Layout>
  );
};

export default MyCommitteeScholars;
