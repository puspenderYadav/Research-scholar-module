import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, calendarAPI, meetingAPI } from '../services/api';
import { format, isFuture } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadUpcomingEvents();
  }, [user]);

  const loadDashboard = async () => {
    try {
      let response;
      if (user.role === 'scholar') {
        response = await dashboardAPI.getScholarDashboard();
      } else if (user.role === 'supervisor') {
        response = await dashboardAPI.getSupervisorDashboard();
      } else if (['dean_academics', 'ad_research'].includes(user.role)) {
        response = await dashboardAPI.getDeanDashboard();
      }

      setDashboardData(response?.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const calendarResponse = await calendarAPI.getEvents({
        start_date: new Date().toISOString(),
      });

      let allEvents = [...calendarResponse.data];

      // Load meetings if user is supervisor or scholar
      if (user?.role === 'supervisor' || user?.role === 'scholar') {
        try {
          const meetingsResponse = await meetingAPI.getAll();
          const upcomingMeetings = meetingsResponse.data
            .filter(m => isFuture(new Date(m.meeting_date)) && m.status === 'scheduled')
            .map(m => ({
              title: user?.role === 'supervisor'
                ? `Meeting with ${m.scholar?.name || 'Scholar'}`
                : `Meeting with ${m.faculty?.name || 'Faculty'}`,
              start: m.meeting_date,
              type: 'meeting',
              status: m.status,
              showTime: true
            }));
          allEvents = [...allEvents, ...upcomingMeetings];
        } catch (error) {
          console.error('Error loading meetings:', error);
        }
      }

      // Sort by date and take first 5
      allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
      setUpcomingEvents(allEvents.slice(0, 5));
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const renderStats = () => {
    if (!dashboardData?.stats) return null;

    const stats = [];

    if (user.role === 'scholar') {
      stats.push(
        { label: 'Program', value: dashboardData.scholar.program },
        { label: 'Exams', value: dashboardData.stats.exams_count },
        { label: 'Seminars', value: dashboardData.stats.seminars_count },
        { label: 'Travel Grants', value: dashboardData.stats.travel_grants_count }
      );
    } else if (user.role === 'supervisor') {
      stats.push(
        { label: 'Scholars', value: dashboardData.stats.total_scholars },
        { label: 'Pending Synopsis', value: dashboardData.stats.pending_synopsis_reviews },
        { label: 'Pending Progress', value: dashboardData.stats.pending_progress_reviews },
        { label: 'Status', value: 'Active' }
      );
    } else {
      stats.push(
        { label: 'Total Scholars', value: dashboardData.stats.total_scholars },
        { label: 'Supervisors', value: dashboardData.stats.total_supervisors },
        { label: 'PhD Students', value: dashboardData.stats.scholars_by_program?.PhD || 0 },
        { label: 'MSc Students', value: dashboardData.stats.scholars_by_program?.MSc || 0 }
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-purple-100">
              {stats.map((stat, index) => (
                <th key={index} className={`px-6 py-3 text-left text-sm font-semibold text-purple-900 ${index !== stats.length - 1 ? 'border-r border-purple-200' : ''}`}>
                  {stat.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {stats.map((stat, index) => (
                <td key={index} className={`px-6 py-4 text-lg font-bold text-gray-900 border-t border-gray-200 ${index !== stats.length - 1 ? 'border-r border-gray-200' : ''}`}>
                  {stat.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
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

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-purple-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, <span className="font-semibold">{user.name}</span>! Here's an overview of your activities.
        </p>
      </div>

      {/* Stats Table */}
      <div className="mb-8">
        {renderStats()}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-3 bg-purple-100">
            <h2 className="text-sm font-semibold text-purple-900">Quick Actions</h2>
          </div>
          <div className="p-4">
            {user.role === 'scholar' && (
              <div className="space-y-1">
                <a href="/meetings" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  View Meetings
                </a>
                <a href="/synopsis" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Submit Synopsis
                </a>
                <a href="/progress-reports" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Submit Progress Report
                </a>
                <a href="/travel-grants" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Apply for Travel Grant
                </a>
              </div>
            )}
            {user.role === 'supervisor' && (
              <div className="space-y-1">
                <a href="/meetings" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Organize Meeting
                </a>
                <a href="/synopsis" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Review Submissions
                </a>
                <a href="/exams" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Schedule Exam
                </a>
                <a href="/seminars" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Schedule Seminar
                </a>
              </div>
            )}
            {user.role === 'dean_academics' && (
              <div className="space-y-1">
                <a href="/bulk-scholar-upload" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Bulk Upload Scholars
                </a>
                <a href="/dean-academics-profile" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Dean Dashboard
                </a>
                <a href="/calendar" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  View Calendar
                </a>
              </div>
            )}
            {user.role === 'school_chair' && (
              <div className="space-y-1">
                <a href="/comprehensive-exams" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Schedule Comprehensive Exams
                </a>
                <a href="/approvals" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  Review Approvals
                </a>
                <a href="/calendar" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-900 rounded transition">
                  View Calendar
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-3 bg-purple-100">
            <h2 className="text-sm font-semibold text-purple-900">Upcoming Events</h2>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-900">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingEvents.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{event.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {event.showTime
                          ? format(new Date(event.start), 'MMM dd, yyyy hh:mm a')
                          : format(new Date(event.start), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium text-purple-900 bg-purple-100 rounded">
                          {event.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No upcoming events
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
