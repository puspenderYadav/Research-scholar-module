import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaFileAlt, FaCalendarAlt, FaBell, FaPlane, FaArrowRight } from 'react-icons/fa';
import logo from '../assets/newlogo.png';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Purple Header */}
      <header className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div>
              <h1 className="text-2xl font-bold">IIT Mandi</h1>
            </div>
            <div className="flex items-center h-full">
              <img src={logo} alt="IIT Mandi Logo" className="h-24 w-auto mt-16" />
            </div>
          </div>
          <div className="pb-4">
            <h2 className="text-3xl font-light tracking-wide">RESEARCH SCHOLAR MANAGEMENT SYSTEM</h2>
          </div>
          <nav className="flex space-x-8 pb-4">
            <a href="#" className="text-white hover:text-gray-200 font-medium">Home</a>
            <a href="#features" className="text-white hover:text-gray-200">Features</a>
            <a href="#access" className="text-white hover:text-gray-200">User Access</a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Content - Main Section */}
          <div className="flex-1 lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-4xl font-normal text-purple-900 mb-6">
                Research Scholar Management System
              </h1>

              <p className="text-gray-700 italic mb-8 leading-relaxed">
                The Research Scholar Management System is a centralized platform for managing research scholars academic progress and handle administrative workflows in research journey at Indian Institute of Technology Mandi. The system provides multi-level hierarchical access for scholars, guides, and administrators, ensuring appropriate permissions and oversight at every stage with digitized workflows and automated approval processes.
              </p>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-normal text-purple-900 mb-4" id="features">
                  Key Features
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaUserGraduate className="text-blue-600 mr-3" />
                      Scholar Management
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Comprehensive profile management, progress tracking, and academic milestone monitoring for research scholars.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaChalkboardTeacher className="text-green-600 mr-3" />
                      Supervision & Committees
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Manage supervisor assignments, committee formations, and collaborative academic oversight.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaFileAlt className="text-purple-600 mr-3" />
                      Progress Reports & Thesis
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Submit and review progress reports, synopsis, and thesis with multi-level approval workflows.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaCalendarAlt className="text-orange-600 mr-3" />
                      Exams & Seminars
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Schedule and manage comprehensive exams, seminars, and academic presentations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaBell className="text-red-600 mr-3" />
                      Announcements & Notifications
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Stay updated with institutional announcements and real-time notifications.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <FaPlane className="text-teal-600 mr-3" />
                      Travel Grants & Leave
                    </h3>
                    <p className="text-gray-700 ml-8">
                      Apply for travel grants, manage leave applications with streamlined approval processes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-normal text-purple-900 mb-4" id="access">
                  User Access
                </h2>

                <div className="space-y-4">
                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-1">Research Scholars</h3>
                    <p className="text-gray-700 text-sm">
                      Active research scholars access the system to track progress, submit reports, and manage academic milestones.
                      Login with institutional credentials.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-1">Supervisors</h3>
                    <p className="text-gray-700 text-sm">
                      Faculty advisors and committee members can view and monitor assigned scholars' progress and review submissions.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-1">School Chairs</h3>
                    <p className="text-gray-700 text-sm">
                      Department heads oversee school activities, approve academic requests, and manage departmental scholars.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-1">AD Research</h3>
                    <p className="text-gray-700 text-sm">
                      Associate Dean of Research manages research operations, policy implementation, and institutional oversight.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900 mb-1">Dean Academics</h3>
                    <p className="text-gray-700 text-sm">
                      Final approvals for academic matters, institutional administration, and policy decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:w-1/3">
            <div className="space-y-4 sticky top-4">
              {/* Login Button */}
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-between group"
              >
                <span className="text-xl font-semibold">System Login</span>
                <FaArrowRight className="text-2xl group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              {/* Info Box */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How to Access
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">For Students and Faculty</h4>
                    <p className="text-gray-700">
                      Login using your institutional credentials.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">For Administrative Staff</h4>
                    <p className="text-gray-700">
                      Login with appropriate credentials.
                    </p>
                  </div>
                </div>
              </div>

              {/* Related Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Related Information
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-purple-900 hover:underline">
                      Student Handbook
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-purple-900 hover:underline">
                      Academic Calendar
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-purple-900 hover:underline">
                      Research Guidelines
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-purple-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Logo Section - Left */}
            <div className="flex justify-center md:justify-start">
              <img src={logo} alt="IIT Mandi Logo" className="h-40 w-auto" />
            </div>

            {/* Institute Info Section - Middle */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Indian Institute of Technology Mandi
              </h3>
              <p className="text-gray-300 text-sm">
                Kamand, Himachal Pradesh, India - 175005
              </p>
            </div>

            {/* Contact Us Section - Right */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold text-white mb-2">
                Contact Us
              </h3>
              <div className="space-y-1 text-gray-300 text-sm">
                <p>
                  <span className="font-medium">Phone:</span> 01905267000
                </p>
                <p>
                  <span className="font-medium">Email:</span> it_helpdesk@iitmandi.ac.in
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-purple-700 mt-6 pt-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 IIT Mandi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
