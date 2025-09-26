import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Briefcase, User as UserIcon } from 'lucide-react';

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await signUp(name, email, password, role);
    
    if (result.success) {
      if (result.requiresConfirmation) {
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
      } else {
        // If no confirmation is needed, user is logged in automatically
        // The AuthContext's onAuthStateChange will handle navigation
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Create an Account</h1>
            <p className="text-gray-600">Join EventManager Pro today</p>
          </div>

          {successMessage ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-center">
              <p>{successMessage}</p>
              <Link to="/login" className="font-medium text-green-800 hover:underline mt-2 inline-block">
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${role === 'user' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="user" checked={role === 'user'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                    <UserIcon className={`h-5 w-5 mr-2 ${role === 'user' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">User</span>
                  </label>
                  <label className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${role === 'vendor' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="vendor" checked={role === 'vendor'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                    <Briefcase className={`h-5 w-5 mr-2 ${role === 'vendor' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">Vendor</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
