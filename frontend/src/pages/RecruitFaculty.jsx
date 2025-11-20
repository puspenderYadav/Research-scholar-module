import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deanAPI } from '../services/api';
import Layout from '../components/Layout';

const RecruitFaculty = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personal_email: '',
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

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await deanAPI.getAllSchools();
      setSchools(response.data.schools);
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  };

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
        personal_email: '',
        phone: '',
        employee_id: '',
        designation: '',
        school_id: '',
        specialization: '',
        max_phd_scholars: 8,
        max_msc_scholars: 5,
        is_accepting_students: true
      });
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
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Recruit New Faculty Member</h1>
          <p className="text-gray-600 mt-2">Add a new faculty member to the system</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">{success}</p>
            <div className="mt-3 bg-white p-3 rounded border border-green-300">
              <p className="text-sm font-semibold text-gray-700 mb-1">Temporary Password:</p>
              <p className="font-mono text-lg text-gray-900">{generatedPassword}</p>
            </div>
            <p className="mt-2 text-sm">Please save this password and share it securely with the faculty member.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institute Email (Login) *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-500">This will be their username for login</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Email *
                </label>
                <input
                  type="email"
                  name="personal_email"
                  required
                  value={formData.personal_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-500">Credentials will be sent to this email</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  rows="3"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_accepting_students"
                    checked={formData.is_accepting_students}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 accent-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Currently accepting students
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 font-medium"
              >
                {loading ? 'Recruiting...' : 'Recruit Faculty'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dean-academics-profile')}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RecruitFaculty;
