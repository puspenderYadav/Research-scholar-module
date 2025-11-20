import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../services/api';
import ChangePasswordModal from './ChangePasswordModal';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await notificationAPI.getUnread();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getIcon = (iconName) => {
    const icons = {
      dashboard: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>,
      profile: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
      analytics: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
      add: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>,
      announcement: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>,
      committee: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>,
      exam: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>,
      seminar: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>,
      document: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>,
      leave: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
      check: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
      meeting: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
      travel: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>,
      calendar: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
    };
    return icons[iconName] || icons.document;
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['all'] },
    { name: 'Profile', path: '/profile', icon: 'profile', roles: ['scholar'] },
    { name: 'Faculty Profile', path: '/faculty-profile', icon: 'profile', roles: ['supervisor', 'faculty'] },
    { name: 'School Chair Profile', path: '/school-chair-profile', icon: 'profile', roles: ['school_chair'] },
    { name: 'AD Research', path: '/research-office-profile', icon: 'profile', roles: ['ad_research'] },
    { name: 'Analytics', path: '/dean-academics-profile', icon: 'analytics', roles: ['dean_academics'] },
    { name: 'Recruit Faculty', path: '/recruit-faculty', icon: 'add', roles: ['dean_academics'] },
    { name: 'Add School', path: '/add-school', icon: 'add', roles: ['dean_academics'] },
    { name: 'Announcements', path: '/announcements', icon: 'announcement', roles: ['dean_academics', 'ad_research'] },
    { name: 'My Committee Scholars', path: '/my-committee-scholars', icon: 'committee', roles: ['supervisor'] },
    { name: 'Comprehensive Exams', path: '/comprehensive-exams', icon: 'exam', roles: ['scholar'] },
    { name: 'Seminars', path: '/seminars', icon: 'seminar', roles: ['scholar', 'supervisor'] },
    { name: 'Synopsis', path: '/synopsis', icon: 'document', roles: ['scholar', 'supervisor'] },
    { name: 'Progress Reports', path: '/progress-reports', icon: 'document', roles: ['scholar', 'supervisor'] },
    { name: 'Thesis', path: '/thesis', icon: 'document', roles: ['scholar', 'supervisor'] },
    { name: 'Leave Applications', path: '/leave-applications', icon: 'leave', roles: ['scholar'] },
    { name: 'Leave Approvals', path: '/leave-approvals', icon: 'check', roles: ['supervisor', 'school_chair'] },
    { name: 'Meetings', path: '/meetings', icon: 'meeting', roles: ['supervisor', 'scholar'] },
    { name: 'Travel Grants', path: '/travel-grants', icon: 'travel', roles: ['scholar', 'supervisor', 'school_chair', 'ad_research', 'dean_academics'] },
    { name: 'Approvals', path: '/approvals', icon: 'check', roles: ['supervisor', 'school_chair', 'ad_research', 'dean_academics'] },
    { name: 'Calendar', path: '/calendar', icon: 'calendar', roles: ['scholar', 'supervisor', 'school_chair', 'ad_research'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-purple-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-shrink-0">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="font-bold">
                  <div className="text-lg sm:text-xl whitespace-nowrap">IIT Mandi</div>
                  <div className="text-xs sm:text-sm text-purple-200 whitespace-nowrap">Research Scholars Portal</div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link
                to="/notifications"
                className="relative hover:bg-white hover:bg-opacity-10 px-2 sm:px-3 py-2 rounded-md transition"
              >
                <span className="text-lg sm:text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center hover:bg-white hover:bg-opacity-10 px-2 sm:px-3 py-2 rounded-md transition"
                >
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center sm:mr-2">
                    <span className="text-sm font-semibold">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="hidden md:inline">{user?.name}</span>
                  <span className="ml-1 sm:ml-2">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    {!['dean_academics', 'ad_research', 'supervisor'].includes(user?.role) && (
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-purple-900 hover:bg-purple-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowChangePassword(true);
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-purple-900 hover:bg-purple-50"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-purple-900 hover:bg-purple-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen">
          <nav className="mt-5">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-purple-900 hover:bg-purple-50 transition ${
                  isActive(item.path) ? 'bg-purple-100 font-semibold' : ''
                }`}
              >
                <span className="w-6 mr-3 text-violet-600">
                  {getIcon(item.icon)}
                </span>
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-purple-900 mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-white text-sm sm:text-base break-words">&copy; 2025 Research Scholars Management Portal. All rights reserved.</p>
        </div>
      </footer>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default Layout;
