import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../assets/preview.png';
import logo from '../assets/newlogo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password, role });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image for entire page */}
      <div className="absolute inset-0 opacity-60 z-0">
        <img src={backgroundImage} alt="IIT Mandi Campus" className="w-full h-full object-cover" />
      </div>

      {/* Header */}
      <div className="relative z-10 py-4 sm:py-6 px-4 sm:px-6">
        <div className="w-full max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
              <img src={logo} alt="IIT Mandi Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 drop-shadow-lg whitespace-nowrap">IIT Mandi</h1>
              <p className="text-xs sm:text-sm text-gray-800 drop-shadow whitespace-nowrap">Research Scholars Portal</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-transparent border border-gray-700 text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200 font-medium flex items-center gap-1 sm:gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm sm:text-base">Home</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">

        <div className="w-full max-w-md relative z-10">
          {/* Login form - transparent style */}
          <div className="backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/30 border border-gray-400/40 p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-black mb-2">Welcome Back</h2>
              <p className="text-black font-semibold text-sm">Sign in to access your research portal</p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-bold text-black mb-2">
              Sign in as
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-lg focus:ring-0 focus:border-purple-800 outline-none transition-all bg-white text-gray-900"
              >
                <option value="">Select your role</option>
                <option value="scholar">Scholar</option>
                <option value="supervisor">Supervisor/Faculty</option>
                <option value="school_chair">School Chair</option>
                <option value="ad_research">AD Research</option>
                <option value="dean_academics">Dean Academics</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-lg focus:ring-0 focus:border-purple-800 outline-none transition-all bg-white text-gray-900 placeholder:text-black"
                placeholder="Institute ID"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-black mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-lg focus:ring-0 focus:border-purple-800 outline-none transition-all bg-white text-gray-900 placeholder:text-black"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-800 hover:bg-purple-900 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-violet-900 hover:text-violet-950 font-medium transition-colors">
              Forgot your password?
            </Link>
          </div>
        </form>

            {/* Footer in same card */}
            <div className="mt-8 pt-6 border-t border-gray-400">
              <div className="text-center">
                <p className="text-xs text-black font-semibold mb-1">For support, contact</p>
                <a href="mailto:research@iitmandi.ac.in" className="text-sm text-purple-800 hover:text-purple-900 font-bold">
                  research@iitmandi.ac.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
