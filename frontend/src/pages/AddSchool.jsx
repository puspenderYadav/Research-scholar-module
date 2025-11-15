import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deanAPI } from '../services/api';
import Layout from '../components/Layout';

const AddSchool = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    chair_email: '',
    chair_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await deanAPI.createSchool(formData);
      setSuccess(response.data.message || `School "${formData.name}" created successfully!`);

      // Reset form
      setFormData({ name: '', code: '', chair_email: '', chair_name: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create school');
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New School/Department</h1>
          <p className="text-gray-600 mt-2">Create a new school or department in the system</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., School of Computer Science"
              />
              <p className="mt-1 text-sm text-gray-500">
                Full name of the school or department
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Code *
              </label>
              <input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., CS"
                maxLength="20"
              />
              <p className="mt-1 text-sm text-gray-500">
                Short code for the school (will be converted to uppercase)
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                School Chair Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                A school chair account will be automatically created and login credentials will be sent to the provided email.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chair Email *
                  </label>
                  <input
                    type="email"
                    name="chair_email"
                    required
                    value={formData.chair_email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., chair@university.edu"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Personal email address for the school chair (used for login)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chair Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="chair_name"
                    value={formData.chair_name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Dr. John Smith"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Full name of the school chair (auto-generated from email if not provided)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Create School'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dean-academics-profile')}
                className="btn-secondary"
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

export default AddSchool;
