import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'

// Pages
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ScholarProfile from './pages/ScholarProfile'
import FacultyProfile from './pages/FacultyProfile'
import SchoolChairProfile from './pages/SchoolChairProfile'
import ResearchOfficeProfile from './pages/ResearchOfficeProfile'
import DeanAcademicsProfile from './pages/DeanAcademicsProfile'
import RecruitFaculty from './pages/RecruitFaculty'
import AddSchool from './pages/AddSchool'
import Announcements from './pages/Announcements'
import Supervisors from './pages/Supervisors'
import MyCommitteeScholars from './pages/MyCommitteeScholars'
import Seminars from './pages/Seminars'
import Synopsis from './pages/Synopsis'
import ProgressReports from './pages/ProgressReports'
import Thesis from './pages/Thesis'
import TravelGrants from './pages/TravelGrants'
import Calendar from './pages/Calendar'
import Notifications from './pages/Notifications'
import SupervisorChangeRequest from './pages/SupervisorChangeRequest'
import SupervisorChangeApprovals from './pages/SupervisorChangeApprovals'
import SupervisorApprovals from './pages/SupervisorApprovals'
import BulkScholarUpload from './pages/BulkScholarUpload'
import ComprehensiveExams from './pages/ComprehensiveExams'
import LeaveApplications from './pages/LeaveApplications'
import LeaveApprovals from './pages/LeaveApprovals'
import Meetings from './pages/Meetings'
import Approvals from './pages/Approvals'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <ScholarProfile />
            </PrivateRoute>
          } />

          <Route path="/faculty-profile" element={
            <PrivateRoute>
              <FacultyProfile />
            </PrivateRoute>
          } />

          <Route path="/school-chair-profile" element={
            <PrivateRoute>
              <SchoolChairProfile />
            </PrivateRoute>
          } />

          <Route path="/research-office-profile" element={
            <PrivateRoute>
              <ResearchOfficeProfile />
            </PrivateRoute>
          } />

          <Route path="/dean-academics-profile" element={
            <PrivateRoute>
              <DeanAcademicsProfile />
            </PrivateRoute>
          } />

          <Route path="/recruit-faculty" element={
            <PrivateRoute>
              <RecruitFaculty />
            </PrivateRoute>
          } />

          <Route path="/add-school" element={
            <PrivateRoute>
              <AddSchool />
            </PrivateRoute>
          } />

          <Route path="/announcements" element={
            <PrivateRoute>
              <Announcements />
            </PrivateRoute>
          } />

          <Route path="/supervisors" element={
            <PrivateRoute>
              <Supervisors />
            </PrivateRoute>
          } />

          <Route path="/my-committee-scholars" element={
            <PrivateRoute>
              <MyCommitteeScholars />
            </PrivateRoute>
          } />

          <Route path="/supervisor-change-request" element={
            <PrivateRoute>
              <SupervisorChangeRequest />
            </PrivateRoute>
          } />

          <Route path="/supervisor-change-approvals" element={
            <PrivateRoute>
              <SupervisorChangeApprovals />
            </PrivateRoute>
          } />

          <Route path="/supervisor-approvals" element={
            <PrivateRoute>
              <SupervisorApprovals />
            </PrivateRoute>
          } />

          <Route path="/seminars" element={
            <PrivateRoute>
              <Seminars />
            </PrivateRoute>
          } />

          <Route path="/synopsis" element={
            <PrivateRoute>
              <Synopsis />
            </PrivateRoute>
          } />

          <Route path="/progress-reports" element={
            <PrivateRoute>
              <ProgressReports />
            </PrivateRoute>
          } />

          <Route path="/thesis" element={
            <PrivateRoute>
              <Thesis />
            </PrivateRoute>
          } />

          <Route path="/travel-grants" element={
            <PrivateRoute>
              <TravelGrants />
            </PrivateRoute>
          } />

          <Route path="/calendar" element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          } />

          <Route path="/notifications" element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          } />

          <Route path="/bulk-scholar-upload" element={
            <PrivateRoute>
              <BulkScholarUpload />
            </PrivateRoute>
          } />

          <Route path="/comprehensive-exams" element={
            <PrivateRoute>
              <ComprehensiveExams />
            </PrivateRoute>
          } />

          <Route path="/leave-applications" element={
            <PrivateRoute>
              <LeaveApplications />
            </PrivateRoute>
          } />

          <Route path="/leave-approvals" element={
            <PrivateRoute>
              <LeaveApprovals />
            </PrivateRoute>
          } />

          <Route path="/meetings" element={
            <PrivateRoute>
              <Meetings />
            </PrivateRoute>
          } />

          <Route path="/approvals" element={
            <PrivateRoute>
              <Approvals />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
