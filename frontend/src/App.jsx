import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'

// Pages
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
import Exams from './pages/Exams'
import Seminars from './pages/Seminars'
import Synopsis from './pages/Synopsis'
import ProgressReports from './pages/ProgressReports'
import Thesis from './pages/Thesis'
import TravelGrants from './pages/TravelGrants'
import Calendar from './pages/Calendar'
import Notifications from './pages/Notifications'
import SupervisorChangeRequest from './pages/SupervisorChangeRequest'
import SupervisorChangeApprovals from './pages/SupervisorChangeApprovals'
import BulkScholarUpload from './pages/BulkScholarUpload'
import ComprehensiveExams from './pages/ComprehensiveExams'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
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

          <Route path="/exams" element={
            <PrivateRoute>
              <Exams />
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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
