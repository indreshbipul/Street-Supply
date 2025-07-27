// src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Spinner, Notification } from './UI';

const AuthComponent = ({ setSession }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let authResponse;
    if (isSignUp) {
      authResponse = await supabase.auth.signUp({ email, password, options: {} });
    } else {
      authResponse = await supabase.auth.signInWithPassword({ email, password });
    }
    
    const { error } = authResponse;

    if (error) {
      setNotification({ type: 'error', message: error.message });
    } else if (isSignUp) {
      setNotification({ type: 'success', message: 'Success! Please check your email to verify your account.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">StreetSupply</h1>
        <p className="text-center text-gray-600 mb-6">{isSignUp ? 'Create a new account' : 'Welcome back!'}</p>
        <form onSubmit={handleAuth}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input-style"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input-style"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? <Spinner /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-indigo-500 hover:text-indigo-700 ml-2"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthComponent;
