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
        { icon: '🎓', label: 'Program', value: dashboardData.scholar.program, color: 'blue' },
        { icon: '📝', label: 'Exams', value: dashboardData.stats.exams_count, color: 'green' },
        { icon: '🎤', label: 'Seminars', value: dashboardData.stats.seminars_count, color: 'purple' },
        { icon: '✈️', label: 'Travel Grants', value: dashboardData.stats.travel_grants_count, color: 'yellow' }
      );
    } else if (user.role === 'supervisor') {
      stats.push(
        { icon: '👥', label: 'Scholars', value: dashboardData.stats.total_scholars, color: 'blue' },
        { icon: '📄', label: 'Pending Synopsis', value: dashboardData.stats.pending_synopsis_reviews, color: 'yellow' },
        { icon: '📊', label: 'Pending Progress', value: dashboardData.stats.pending_progress_reviews, color: 'red' },
        { icon: '✅', label: 'Status', value: 'Active', color: 'green' }
      );
    } else {
      stats.push(
        { icon: '🎓', label: 'Total Scholars', value: dashboardData.stats.total_scholars, color: 'blue' },
        { icon: '👨‍🏫', label: 'Supervisors', value: dashboardData.stats.total_supervisors, color: 'green' },
        { icon: '📈', label: 'PhD Students', value: dashboardData.stats.scholars_by_program?.PhD || 0, color: 'purple' },
        { icon: '🎓', label: 'MSc Students', value: dashboardData.stats.scholars_by_program?.MSc || 0, color: 'yellow' }
      );
    }

    return stats.map((stat, index) => (
      <div key={index} className="card">
        <div className="flex items-center">
          <div className={`flex-shrink-0 bg-${stat.color}-100 rounded-md p-3`}>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        </div>
      </div>
    ));
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-iit-darkblue">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, <span className="font-semibold text-iit-blue">{user.name}</span>! Here's an overview of your activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {renderStats()}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="space-y-3">
            {user.role === 'scholar' && (
              <>
                <a href="/meetings" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">🤝</span>
                  <span className="text-gray-700 font-medium">View Meetings</span>
                </a>
                <a href="/synopsis" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📄</span>
                  <span className="text-gray-700 font-medium">Submit Synopsis</span>
                </a>
                <a href="/progress-reports" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📊</span>
                  <span className="text-gray-700 font-medium">Submit Progress Report</span>
                </a>
                <a href="/travel-grants" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">✈️</span>
                  <span className="text-gray-700 font-medium">Apply for Travel Grant</span>
                </a>
              </>
            )}
            {user.role === 'supervisor' && (
              <>
                <a href="/meetings" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">🤝</span>
                  <span className="text-gray-700 font-medium">Organize Meeting</span>
                </a>
                <a href="/synopsis" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">✅</span>
                  <span className="text-gray-700 font-medium">Review Submissions</span>
                </a>
                <a href="/exams" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📝</span>
                  <span className="text-gray-700 font-medium">Schedule Exam</span>
                </a>
                <a href="/seminars" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">🎤</span>
                  <span className="text-gray-700 font-medium">Schedule Seminar</span>
                </a>
              </>
            )}
            {user.role === 'dean_academics' && (
              <>
                <a href="/bulk-scholar-upload" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📤</span>
                  <span className="text-gray-700 font-medium">Bulk Upload Scholars</span>
                </a>
                <a href="/dean-academics-profile" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📊</span>
                  <span className="text-gray-700 font-medium">Dean Dashboard</span>
                </a>
                <a href="/calendar" className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-iit-lightblue hover:border-iit-blue transition">
                  <span className="text-iit-blue mr-3">📅</span>
                  <span className="text-gray-700 font-medium">View Calendar</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold text-iit-darkblue mb-4 flex items-center border-b pb-3">
            <span className="mr-2">📅</span>
            Upcoming Events
          </h2>
          {upcomingEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-iit-lightblue">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-iit-darkblue uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingEvents.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {event.showTime
                          ? format(new Date(event.start), 'MMM dd, yyyy hh:mm a')
                          : format(new Date(event.start), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-iit-lightblue text-iit-blue">{event.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{event.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming events</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
