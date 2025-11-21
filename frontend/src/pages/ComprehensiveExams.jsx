import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ComprehensiveExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_date: '',
    exam_time: '',
    duration_minutes: 180,
    venue: '',
    program: '',
    school_id: '',
    admission_year: '',
    instructions: '',
    syllabus: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const [examsRes, schoolsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/comprehensive-exams`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/schools`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setExams(examsRes.data);
      setSchools(schoolsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const payload = { ...formData };

      // Convert empty strings to null
      if (!payload.program) delete payload.program;
      if (!payload.school_id) delete payload.school_id;
      if (!payload.admission_year) delete payload.admission_year;

      const response = await axios.post(
        `${API_BASE_URL}/comprehensive-exams`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating exam:', error);
      setError(error.response?.data?.error || 'Failed to create exam');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      exam_date: '',
      exam_time: '',
      duration_minutes: 180,
      venue: '',
      program: '',
      school_id: '',
      admission_year: '',
      instructions: '',
      syllabus: ''
    });
  };

  const viewExamDetails = (exam) => {
    setSelectedExam(exam);
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

  if (user.role === 'scholar') {
    // Scholar view - show their registered exams
    return (
      <Layout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-900">Comprehensive Exams</h1>
          <p className="text-gray-600 mt-2">View your upcoming comprehensive examinations</p>
        </div>

        {exams.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No comprehensive exams scheduled for you</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{exam.title}</h3>
                    <p className="text-gray-600 mt-1">{exam.description}</p>
                  </div>
                  <span className={`badge ${exam.status === 'scheduled' ? 'badge-primary' : 'badge-secondary'}`}>
                    {exam.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold">
                      {new Date(exam.exam_date).toLocaleDateString()} at {exam.exam_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{exam.duration_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-semibold">{exam.venue}</p>
                  </div>
                  {exam.registration && exam.registration.result && (
                    <div>
                      <p className="text-sm text-gray-500">Result</p>
                      <p className={`font-semibold ${exam.registration.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {exam.registration.result.toUpperCase()}
                        {exam.registration.grade && ` - Grade: ${exam.registration.grade}`}
                      </p>
                    </div>
                  )}
                </div>

                {exam.instructions && (
                  <div className="mt-4 p-3 bg-violet-50 rounded">
                    <p className="text-sm font-medium text-gray-700">Instructions:</p>
                    <p className="text-sm text-gray-600 mt-1">{exam.instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  // Research Office view - schedule and manage exams
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900">Comprehensive Exams</h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'school_chair'
            ? 'Schedule and manage comprehensive examinations'
            : 'View comprehensive examinations'}
        </p>
      </div>

      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {user.role === 'school_chair' && !showForm ? (
        <div className="card mb-6">
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
            + Schedule New Comprehensive Exam
          </button>
        </div>
      ) : user.role === 'school_chair' && showForm ? (
        <div className="card mb-6">
          <div className="bg-purple-100 px-6 py-2 -mx-6 -mt-6 mb-6 rounded-t-lg">
            <h2 className="text-lg font-semibold text-purple-900">Schedule Comprehensive Exam</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input-field"
                  required
                  placeholder="e.g., Comprehensive Exam - January 2025"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="input-field"
                  placeholder="Brief description of the exam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date *
                </label>
                <input
                  type="date"
                  name="exam_date"
                  value={formData.exam_date}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Time *
                </label>
                <input
                  type="time"
                  name="exam_time"
                  value={formData.exam_time}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  className="input-field"
                  required
                  min="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="input-field"
                  required
                  placeholder="e.g., Main Auditorium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program (Leave blank for all)
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">All Programs</option>
                  <option value="PhD">PhD</option>
                  <option value="MSc">MSc</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School (Leave blank for all)
                </label>
                <select
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">All Schools</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Year (Leave blank for all)
                </label>
                <input
                  type="number"
                  name="admission_year"
                  value={formData.admission_year}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 2023"
                  min="2000"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Important instructions for students"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Syllabus
                </label>
                <textarea
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Exam syllabus details"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
                Schedule Exam & Notify Students
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Exams List */}
      <div className="card">
        <div className="bg-purple-100 px-6 py-2 -mx-6 -mt-6 mb-6 rounded-t-lg">
          <h2 className="text-lg font-semibold text-purple-900">Scheduled Exams</h2>
        </div>
        {exams.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No exams scheduled yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-purple-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map(exam => (
                  <tr key={exam.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                        <div className="text-sm text-gray-500">
                          {exam.program || 'All'} | {exam.school?.name || 'All Schools'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(exam.exam_date).toLocaleDateString()}<br/>
                      {exam.exam_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.venue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exam.registered_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${exam.status === 'scheduled' ? 'badge-primary' : 'badge-secondary'}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewExamDetails(exam)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ComprehensiveExams;
