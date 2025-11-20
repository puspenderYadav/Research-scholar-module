import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { deanAPI } from '../services/api';

const BulkScholarUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await deanAPI.downloadSampleCSV();

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'scholars_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await deanAPI.bulkUploadScholars(formData);
      setResult(response.data);
      setShowResults(true);

      // Clear file input if all succeeded
      if (response.data.failed_count === 0) {
        setFile(null);
        document.getElementById('file-input').value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setShowResults(false);
    document.getElementById('file-input').value = '';
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bulk Scholar Upload</h1>
        <p className="text-gray-600 mt-2">Upload CSV file to create multiple scholar accounts at once</p>
      </div>

      {/* Instructions Card */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Download the CSV template using the button below</li>
          <li>Fill in the scholar details in the CSV file with their personal emails</li>
          <li>Ensure all required columns are filled correctly</li>
          <li>Upload the completed CSV file</li>
          <li>The system will automatically:
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
              <li>Generate enrollment numbers (format: XYYZZZ where X=P/M for PhD/MSc, YY=year last 2 digits, ZZZ=serial)</li>
              <li>Generate institute email addresses (enrollment@university.edu)</li>
              <li>Create user accounts with secure random passwords</li>
              <li>Send credentials to personal emails</li>
              <li>Students login using institute email and password from their personal email</li>
            </ul>
          </li>
        </ol>

        <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-2">Required CSV Columns:</p>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded overflow-x-auto">
            name, personal_email, program, admission_year, school_code, admission_date, supervisor_email,
            dc_member1_email, dc_member2_email, dc_member3_email, apc_member1_email, apc_member2_email, apc_member3_email
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Optional CSV Columns:</p>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
            phone, co_supervisor_email, research_area
          </div>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Program must be 'PhD' or 'MSc'. Admission year must be 4-digit year (e.g., 2025).
              Institute email will be auto-generated as P25001@university.edu (PhD) or M25001@university.edu (MSc).
            </p>
          </div>
        </div>
      </div>

      {/* Download Template Button */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Download Template</h3>
        <button
          onClick={handleDownloadTemplate}
          className="btn-primary"
        >
          Download CSV Template
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Download a sample CSV file with example data and correct formatting
        </p>
      </div>

      {/* Upload Section */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Upload Completed CSV</h3>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`btn-primary ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <span className="spinner inline-block mr-2"></span>
                  Uploading...
                </>
              ) : (
                <>Upload and Process</>
              )}
            </button>

            {file && !uploading && (
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && showResults && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Results</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                <p className="text-3xl font-bold text-blue-800">
                  {result.successful_count + result.failed_count}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Successful</p>
                <p className="text-3xl font-bold text-green-800">{result.successful_count}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-3xl font-bold text-red-800">{result.failed_count}</p>
              </div>
            </div>

            <p className="text-gray-600">{result.message}</p>
          </div>

          {/* Successful Uploads */}
          {result.successful_uploads && result.successful_uploads.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-green-700 mb-4">
                Successfully Created ({result.successful_uploads.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Institute Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Personal Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credentials Sent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.successful_uploads.map((scholar, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{scholar.name}</td>
                        <td className="px-4 py-2 text-sm text-blue-600 font-mono">{scholar.enrollment_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 font-mono">{scholar.institute_email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{scholar.personal_email}</td>
                        <td className="px-4 py-2 text-sm">
                          {scholar.email_sent ? (
                            <span className="text-green-600 font-medium">✓ Sent</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed Uploads */}
          {result.errors && result.errors.length > 0 && (
            <div className="card bg-red-50 border border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-4">
                Errors ({result.errors.length})
              </h3>
              <div className="space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card">
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="btn-primary"
              >
                Upload Another File
              </button>
              <button
                onClick={() => navigate('/dean/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BulkScholarUpload;
